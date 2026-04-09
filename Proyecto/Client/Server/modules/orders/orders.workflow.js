const { Payment } = require("mercadopago");
const { parseExternalReference } = require("../payments/mercadopago.helpers");

const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
};

const createOrdersWorkflow = ({ mercadopagoClient }) => {
  const finalizeOrderWithStockValidation = async (
    client,
    { order, userId, paymentReference },
  ) => {
    const cartResult = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = $1
     FOR UPDATE OF p`,
      [userId],
    );

    const cart = cartResult.rows;

    if (cart.length === 0) {
      throw { status: 400, message: "No hay items para confirmar" };
    }

    const stockIssues = cart
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

    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price],
      );

      await client.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
        item.quantity,
        item.product_id,
      ]);
    }

    await client.query(
      `UPDATE orders
     SET status = $1,
         payment_reference = $2,
         paid_at = NOW()
     WHERE id = $3`,
      [ORDER_STATUS.PAID, paymentReference, order.id],
    );

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
  };

  const confirmMercadoPagoPayment = async ({
    client,
    paymentId,
    expectedOrderId = null,
    expectedUserId = null,
  }) => {
    const payment = new Payment(mercadopagoClient);
    const paymentInfo = await payment.get({ id: paymentId });

    const referenceData = parseExternalReference(paymentInfo.external_reference);

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
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [referenceData.orderId, referenceData.userId],
    );

    if (orderResult.rows.length === 0) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    const order = orderResult.rows[0];

    if (order.payment_method !== "mercadopago") {
      throw {
        status: 400,
        message: "La orden no fue creada con método Mercado Pago",
      };
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return {
        order,
        paymentInfo,
        alreadyProcessed: true,
      };
    }

    if (paymentInfo.status !== "approved") {
      throw {
        status: 409,
        message: `El pago no está aprobado. Estado actual: ${paymentInfo.status}`,
      };
    }

    await finalizeOrderWithStockValidation(client, {
      order,
      userId: referenceData.userId,
      paymentReference: `mp:${paymentInfo.id}`,
    });

    return {
      order,
      paymentInfo,
      alreadyProcessed: false,
    };
  };

  return {
    finalizeOrderWithStockValidation,
    confirmMercadoPagoPayment,
  };
};

module.exports = createOrdersWorkflow;
