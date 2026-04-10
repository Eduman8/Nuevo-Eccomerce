const { Payment } = require("mercadopago");
const { parseExternalReference } = require("../payments/mercadopago.helpers");

const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  REJECTED: "rejected",
};

const createOrdersWorkflow = ({ mercadopagoClient }) => {
  const finalizeOrderWithStockValidation = async (
    client,
    { order, userId, paymentReference },
  ) => {
    const orderItemsResult = await client.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.stock, p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       FOR UPDATE OF p`,
      [order.id],
    );

    const orderItems = orderItemsResult.rows;

    if (orderItems.length === 0) {
      throw { status: 400, message: "La orden no tiene items para confirmar" };
    }

    const stockIssues = orderItems
      .filter((item) => Number(item.stock) < Number(item.quantity))
      .map((item) => ({
        productId: item.product_id,
        name: item.name,
        available: Number(item.stock),
        requested: Number(item.quantity),
      }));

    if (stockIssues.length > 0) {
      throw {
        status: 409,
        message: "Stock insuficiente para algunos productos",
        details: stockIssues,
      };
    }

    for (const item of orderItems) {
      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.product_id],
      );
    }

    await client.query(
      `UPDATE orders
       SET status = $1,
           payment_reference = $2,
           paid_at = NOW()
       WHERE id = $3`,
      [ORDER_STATUS.PAID, paymentReference, order.id],
    );

    await client.query(
      `DELETE FROM cart_items
       WHERE user_id = $1`,
      [userId],
    );
  };

  const confirmMercadoPagoPayment = async ({
    client,
    paymentId,
    expectedOrderId = null,
    expectedUserId = null,
  }) => {
    if (!paymentId) {
      throw {
        status: 400,
        message: "paymentId es obligatorio",
      };
    }

    const payment = new Payment(mercadopagoClient);
    const paymentInfo = await payment.get({ id: paymentId });

    const referenceData = parseExternalReference(
      paymentInfo.external_reference,
    );

    if (!referenceData) {
      throw {
        status: 409,
        message: "El pago no tiene una referencia de orden válida",
      };
    }

    if (expectedOrderId && referenceData.orderId !== Number(expectedOrderId)) {
      throw {
        status: 409,
        message: "El pago no corresponde a la orden actual",
      };
    }

    if (expectedUserId && referenceData.userId !== Number(expectedUserId)) {
      throw {
        status: 409,
        message: "El pago no corresponde al usuario actual",
      };
    }

    const orderResult = await client.query(
      `
      SELECT id, user_id, status, payment_reference
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [referenceData.orderId],
    );

    if (!orderResult.rowCount) {
      throw {
        status: 404,
        message: "No se encontró la orden asociada al pago",
      };
    }

    const order = orderResult.rows[0];
    const paymentStatus = String(paymentInfo.status || "").trim();
    const paymentReference = String(paymentId);

    if (order.status === ORDER_STATUS.PAID) {
      return {
        ok: true,
        alreadyProcessed: true,
        orderId: order.id,
        paymentStatus,
        paid: true,
        paymentId: paymentInfo.id,
      };
    }

    if (paymentStatus === "approved") {
      await finalizeOrderWithStockValidation(client, {
        order,
        userId: order.user_id,
        paymentReference,
      });

      return {
        ok: true,
        alreadyProcessed: false,
        orderId: order.id,
        paymentStatus,
        paid: true,
        paymentId: paymentInfo.id,
      };
    }

    if (paymentStatus === "pending" || paymentStatus === "in_process") {
      await client.query(
        `
        UPDATE orders
        SET status = $1,
            payment_reference = $2
        WHERE id = $3
        `,
        [ORDER_STATUS.PENDING, paymentReference, order.id],
      );

      return {
        ok: true,
        orderId: order.id,
        paymentStatus,
        paid: false,
        paymentId: paymentInfo.id,
      };
    }

    await client.query(
      `
      UPDATE orders
      SET status = $1,
          payment_reference = $2
      WHERE id = $3
      `,
      [ORDER_STATUS.REJECTED, paymentReference, order.id],
    );

    return {
      ok: true,
      orderId: order.id,
      paymentStatus,
      paid: false,
      paymentId: paymentInfo.id,
    };
  };

  return {
    finalizeOrderWithStockValidation,
    confirmMercadoPagoPayment,
  };
};

module.exports = createOrdersWorkflow;
