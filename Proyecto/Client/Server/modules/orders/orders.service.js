const { Preference } = require("mercadopago");
const {
  hasValidMercadoPagoTokenFormat,
  canUseMercadoPagoAutoReturn,
} = require("../payments/mercadopago.helpers");

const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS);

const normalizeShippingMethod = (value) => {
  const allowed = ["home_delivery", "pickup"];
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return allowed.includes(normalized) ? normalized : null;
};

const parseJsonIfNeeded = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

const createOrdersService = ({
  ordersRepository,
  mercadopagoClient,
  MP_ACCESS_TOKEN,
  FRONTEND_BASE_URL,
  confirmMercadoPagoPayment,
  finalizeOrderWithStockValidation,
}) => ({
  createOrder: async ({ userId, shippingAddress, shippingMethod, paymentMethod }) => {
    if (!userId) {
      throw { status: 400, message: "userId es obligatorio" };
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.zipCode
    ) {
      throw {
        status: 400,
        message: "Dirección incompleta. Requerido: street, city, zipCode",
      };
    }

    const normalizedShippingMethod = normalizeShippingMethod(shippingMethod);
    if (!normalizedShippingMethod) {
      throw { status: 400, message: "Método de envío inválido" };
    }

    const normalizedPaymentMethod = String(paymentMethod || "")
      .trim()
      .toLowerCase();
    if (!["mercadopago", "cash"].includes(normalizedPaymentMethod)) {
      throw { status: 400, message: "Método de pago inválido" };
    }

    const cart = await ordersRepository.getCartWithPricesByUserId(userId);

    if (cart.length === 0) {
      throw { status: 400, message: "Carrito vacío" };
    }

    const subtotal = cart.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.quantity),
      0,
    );

    const shippingCost =
      normalizedShippingMethod === "home_delivery" ? 3000 : 0;
    const total = Number((subtotal + shippingCost).toFixed(2));

    const order = await ordersRepository.createOrder({
      total,
      userId,
      status: ORDER_STATUS.PENDING,
      shippingMethod: normalizedShippingMethod,
      shippingCost,
      shippingAddress: JSON.stringify({ ...shippingAddress, country: "Argentina" }),
      paymentMethod: normalizedPaymentMethod,
    });

    return {
      message: "Orden pendiente creada",
      order,
      breakdown: { subtotal, shippingCost, total },
    };
  },

  createCheckoutProPreference: async ({ orderId, userId }) => {
    if (!mercadopagoClient) {
      throw {
        status: 500,
        message:
          "Mercado Pago no configurado. Define MP_ACCESS_TOKEN (o MERCADOPAGO_ACCESS_TOKEN) en el backend.",
      };
    }

    if (!hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)) {
      throw {
        status: 500,
        message:
          "El access token de Mercado Pago tiene formato inválido. Debe comenzar con TEST- o APP_USR-.",
      };
    }

    const order = await ordersRepository.getOrderByIdAndUserId({ orderId, userId });

    if (!order) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw {
        status: 409,
        message: `La orden no puede pagarse en estado ${order.status}`,
      };
    }

    if (order.payment_method !== "mercadopago") {
      throw {
        status: 400,
        message: "La orden no fue creada con método Mercado Pago",
      };
    }

    const cartItems = await ordersRepository.getCartItemsForPreferenceByUserId(userId);

    if (cartItems.length === 0) {
      throw { status: 400, message: "No hay productos en carrito" };
    }

    const preference = new Preference(mercadopagoClient);

    const externalReference = `order:${order.id}:user:${userId}`;

    const successBackUrl = `${FRONTEND_BASE_URL}/checkout?payment_status=success&order_id=${order.id}`;
    const pendingBackUrl = `${FRONTEND_BASE_URL}/checkout?payment_status=pending&order_id=${order.id}`;
    const failureBackUrl = `${FRONTEND_BASE_URL}/checkout?payment_status=failure&order_id=${order.id}`;

    const preferenceBody = {
      items: [
        ...cartItems.map((item) => ({
          title: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.price),
          currency_id: "ARS",
        })),
        {
          title:
            order.shipping_method === "home_delivery"
              ? "Envío a domicilio"
              : "Retiro en local",
          quantity: 1,
          unit_price: Number(order.shipping_cost || 0),
          currency_id: "ARS",
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: successBackUrl,
        pending: pendingBackUrl,
        failure: failureBackUrl,
      },
      // notification_url: `${BACKEND_BASE_URL}/payments/mercadopago/webhook`,
    };

    if (canUseMercadoPagoAutoReturn(successBackUrl)) {
      // preferenceBody.auto_return = "approved";
    }

    const preferenceResult = await preference.create({
      body: preferenceBody,
    });

    await ordersRepository.updateOrderPreferenceId({
      preferenceId: preferenceResult.id,
      orderId: order.id,
    });

    return {
      init_point: preferenceResult.init_point,
      sandbox_init_point: preferenceResult.sandbox_init_point,
      preference_id: preferenceResult.id,
    };
  },

  confirmCashOrder: async ({ orderId, userId, shippingReference }) => {
    if (!userId || !shippingReference) {
      throw {
        status: 400,
        message: "userId y shippingReference son obligatorios",
      };
    }

    const client = await ordersRepository.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [orderId, userId],
      );

      if (orderResult.rows.length === 0) {
        throw { status: 404, message: "Orden no encontrada" };
      }

      const order = orderResult.rows[0];

      if (order.status !== ORDER_STATUS.PENDING) {
        throw {
          status: 409,
          message: `La orden no puede confirmarse en estado ${order.status}`,
        };
      }

      if (order.payment_method !== "cash") {
        throw {
          status: 400,
          message: "La orden no fue creada con método efectivo",
        };
      }

      if (String(shippingReference).trim().length < 3) {
        throw {
          status: 400,
          message: "Envío rechazado: referencia inválida",
        };
      }

      await finalizeOrderWithStockValidation(client, {
        order,
        userId,
        paymentReference: `cash:${shippingReference}`,
      });

      await client.query("COMMIT");

      return {
        message: "Orden confirmada en efectivo",
        orderId: order.id,
        status: ORDER_STATUS.PAID,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  confirmMercadoPagoOrder: async ({ orderId, userId, paymentId }) => {
    if (!mercadopagoClient) {
      throw {
        status: 500,
        message:
          "Mercado Pago no configurado. Define MP_ACCESS_TOKEN (o MERCADOPAGO_ACCESS_TOKEN) en el backend.",
      };
    }

    if (!hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)) {
      throw {
        status: 500,
        message:
          "El access token de Mercado Pago tiene formato inválido. Debe comenzar con TEST- o APP_USR-.",
      };
    }

    if (!userId) {
      throw {
        status: 400,
        message: "userId es obligatorio",
      };
    }

    const client = await ordersRepository.connect();

    try {
      await client.query("BEGIN");
      const confirmation = await confirmMercadoPagoPayment({
        client,
        paymentId,
        expectedOrderId: orderId,
        expectedUserId: userId,
      });

      await client.query("COMMIT");

      return {
        message: confirmation.alreadyProcessed
          ? `La orden ya estaba confirmada en estado ${confirmation.order.status}`
          : "Orden confirmada y pagada con Mercado Pago",
        orderId: confirmation.order.id,
        status: confirmation.alreadyProcessed
          ? confirmation.order.status
          : ORDER_STATUS.PAID,
        paymentId: confirmation.paymentInfo.id,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  updateOrderStatus: async ({ orderId, status }) => {
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw {
        status: 400,
        message: `Estado inválido. Usar: ${VALID_ORDER_STATUSES.join(", ")}`,
      };
    }

    const order = await ordersRepository.updateOrderStatusById({ status, orderId });

    if (!order) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    return order;
  },

  getOrdersByUser: async (userId) => {
    const rows = await ordersRepository.getOrdersByUserId(userId);
    return rows.map((row) => ({
      ...row,
      shipping_address: parseJsonIfNeeded(row.shipping_address),
    }));
  },
});

module.exports = createOrdersService;
