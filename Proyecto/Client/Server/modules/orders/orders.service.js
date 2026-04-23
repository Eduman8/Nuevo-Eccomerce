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
  REJECTED: "rejected",
};

const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS);
const TERMINAL_ORDER_STATUSES = new Set([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
]);
const ALREADY_CONFIRMED_STATUSES = new Set([
  ORDER_STATUS.PAID,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
]);
const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: new Set([
    ORDER_STATUS.PAID,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
  ]),
  [ORDER_STATUS.PAID]: new Set([ORDER_STATUS.SHIPPED]),
  [ORDER_STATUS.SHIPPED]: new Set([ORDER_STATUS.DELIVERED]),
  [ORDER_STATUS.DELIVERED]: new Set(),
  [ORDER_STATUS.CANCELLED]: new Set(),
  [ORDER_STATUS.REJECTED]: new Set(),
};

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

const assertOrderOwnership = (order, userId) => {
  if (!order) {
    throw { status: 404, message: "Orden no encontrada" };
  }

  if (String(order.user_id) !== String(userId)) {
    throw { status: 403, message: "No autorizado para esta orden" };
  }
};

const assertPaymentMethod = (order, expectedPaymentMethod, message) => {
  if (order.payment_method !== expectedPaymentMethod) {
    throw {
      status: 400,
      message,
    };
  }
};

const assertConfirmableOrder = (order) => {
  if (ALREADY_CONFIRMED_STATUSES.has(order.status)) {
    throw {
      status: 409,
      message: `La orden ya fue confirmada y no puede reconfirmarse en estado ${order.status}`,
    };
  }

  if (TERMINAL_ORDER_STATUSES.has(order.status)) {
    throw {
      status: 409,
      message: `No se puede confirmar una orden en estado terminal ${order.status}`,
    };
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw {
      status: 409,
      message: `La orden no puede confirmarse en estado ${order.status}`,
    };
  }
};


const mapShippingAddress = (shippingAddress) => {
  const parsed = parseJsonIfNeeded(shippingAddress);

  if (!parsed || typeof parsed !== "object") {
    return {
      raw: parsed,
      address: null,
      addressNumber: null,
      city: null,
      province: null,
      postalCode: null,
    };
  }

  const streetValue = String(parsed.street || parsed.address || "").trim();
  const streetMatch = streetValue.match(/^(.*?)(?:\s+(\d+[\w-]*))?$/);
  const baseAddress = String(streetMatch?.[1] || "").trim() || null;
  const addressNumber = String(parsed.addressNumber || parsed.address_number || streetMatch?.[2] || "").trim() || null;

  return {
    raw: parsed,
    address: baseAddress,
    addressNumber,
    city: parsed.city || null,
    province: parsed.province || parsed.state || null,
    postalCode: parsed.postalCode || parsed.postal_code || parsed.zipCode || null,
  };
};

const assertValidOrderTransition = ({ currentStatus, nextStatus }) => {
  if (currentStatus === nextStatus) {
    throw {
      status: 409,
      message: `La orden ya se encuentra en estado ${currentStatus}`,
    };
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus] || new Set();
  if (!allowedTransitions.has(nextStatus)) {
    throw {
      status: 409,
      message: `Transición inválida de estado: ${currentStatus} -> ${nextStatus}`,
    };
  }
};

const createOrdersService = ({
  ordersRepository,
  mercadopagoClient,
  MP_ACCESS_TOKEN,
  FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL,
  BACKEND_BASE_URL = process.env.BACKEND_BASE_URL,
  confirmMercadoPagoPayment,
  finalizeOrderWithStockValidation,
}) => ({
  createOrder: async (
    userId,
    { shippingAddress, shippingMethod, paymentMethod },
  ) => {
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

    const client = await ordersRepository.connect();

    try {
      await client.query("BEGIN");

      const order = await ordersRepository.createOrder({
        total,
        userId,
        status: ORDER_STATUS.PENDING,
        shippingMethod: normalizedShippingMethod,
        shippingCost,
        shippingAddress: JSON.stringify({
          ...shippingAddress,
          country: "Argentina",
        }),
        paymentMethod: normalizedPaymentMethod,
        client,
      });

      for (const item of cart) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.price],
        );
      }

      await client.query("COMMIT");

      return {
        message: "Orden pendiente creada",
        order,
        breakdown: { subtotal, shippingCost, total },
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  createCheckoutProPreference: async (orderId, userId) => {
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

    if (!BACKEND_BASE_URL) {
      throw {
        status: 500,
        message: "BACKEND_BASE_URL no está configurado",
      };
    }

    const order = await ordersRepository.getOrderById(orderId);

    if (!order) {
      throw { status: 404, message: "Orden no encontrada" };
    }
    if (String(order.user_id) !== String(userId)) {
      throw { status: 403, message: "No autorizado para esta orden" };
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

    const cartItems =
      await ordersRepository.getCartItemsForPreferenceByUserId(userId);

    if (cartItems.length === 0) {
      throw { status: 400, message: "No hay productos en carrito" };
    }

    const preference = new Preference(mercadopagoClient);
    const externalReference = `order:${order.id}:user:${userId}`;
    const successBackUrl = `${FRONTEND_BASE_URL}/checkout/result?payment_status=success&order_id=${order.id}`;
    const pendingBackUrl = `${FRONTEND_BASE_URL}/checkout/result?payment_status=pending&order_id=${order.id}`;
    const failureBackUrl = `${FRONTEND_BASE_URL}/checkout/result?payment_status=failure&order_id=${order.id}`;
    if (!FRONTEND_BASE_URL) {
      throw {
        status: 500,
        message: "FRONTEND_BASE_URL no está configurado",
      };
    }

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
      notification_url: `${BACKEND_BASE_URL}/api/payments/mercadopago/webhook`,
    };

    // if (canUseMercadoPagoAutoReturn(successBackUrl)) {
    //   preferenceBody.auto_return = "approved";
    // }

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

  confirmCashOrder: async (orderId, userId, shippingReference) => {
    if (!userId || !shippingReference) {
      throw {
        status: 400,
        message: "shippingReference es obligatorio",
      };
    }

    const client = await ordersRepository.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      );

      if (orderResult.rows.length === 0) {
        throw { status: 404, message: "Orden no encontrada" };
      }

      const order = orderResult.rows[0];
      assertOrderOwnership(order, userId);
      assertPaymentMethod(
        order,
        "cash",
        "La orden no fue creada con método efectivo",
      );
      assertConfirmableOrder(order);

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

  confirmMercadoPagoOrder: async (orderId, userId, paymentId) => {
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

    if (!paymentId) {
      throw {
        status: 400,
        message: "paymentId es obligatorio",
      };
    }

    const client = await ordersRepository.connect();

    try {
      await client.query("BEGIN");
      const orderResult = await client.query(
        "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
        [orderId],
      );

      const order = orderResult.rows[0];
      assertOrderOwnership(order, userId);
      assertPaymentMethod(
        order,
        "mercadopago",
        "La orden no fue creada con método Mercado Pago",
      );
      assertConfirmableOrder(order);

      const confirmation = await confirmMercadoPagoPayment({
        client,
        paymentId,
        expectedOrderId: orderId,
        expectedUserId: userId,
      });

      await client.query("COMMIT");

      return {
        message: confirmation.alreadyProcessed
          ? "La orden ya estaba confirmada previamente"
          : confirmation.paid
            ? "Orden confirmada y pagada con Mercado Pago"
            : `Pago procesado con estado ${confirmation.paymentStatus}`,
        orderId: confirmation.orderId,
        status: confirmation.paid
          ? ORDER_STATUS.PAID
          : confirmation.paymentStatus === "pending" ||
              confirmation.paymentStatus === "in_process"
            ? ORDER_STATUS.PENDING
            : ORDER_STATUS.REJECTED,
        paymentId,
        paymentStatus: confirmation.paymentStatus,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  updateOrderStatus: async ({ orderId, status, userId }) => {
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw {
        status: 400,
        message: `Estado inválido. Usar: ${VALID_ORDER_STATUSES.join(", ")}`,
      };
    }

    const order = await ordersRepository.getOrderById(orderId);

    if (!order) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    assertOrderOwnership(order, userId);
    assertValidOrderTransition({
      currentStatus: order.status,
      nextStatus: status,
    });

    const updatedOrder = await ordersRepository.updateOrderStatusById({
      status,
      orderId,
    });

    return updatedOrder;
  },


  getAdminOrders: async () => {
    const rows = await ordersRepository.getAdminOrdersWithUsersAndItems();
    const groupedOrders = new Map();

    for (const row of rows) {
      if (!groupedOrders.has(row.order_id)) {
        const shipping = mapShippingAddress(row.shipping_address);

        groupedOrders.set(row.order_id, {
          id: row.order_id,
          date: row.created_at,
          status: row.status,
          total: Number(row.total),
          shippingCost: Number(row.shipping_cost || 0),
          paymentMethod: row.payment_method,
          shippingMethod: row.shipping_method,
          buyer: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email,
          },
          shippingAddress: shipping,
          items: [],
        });
      }

      if (row.product_id) {
        groupedOrders.get(row.order_id).items.push({
          productId: row.product_id,
          productName: row.product_name,
          quantity: Number(row.quantity),
          unitPrice: Number(row.unit_price),
          subtotal: Number(row.quantity) * Number(row.unit_price),
        });
      }
    }

    return Array.from(groupedOrders.values());
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
