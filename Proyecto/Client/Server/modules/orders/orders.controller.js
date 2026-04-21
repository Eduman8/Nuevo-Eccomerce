const { createHttpError } = require("../../utils/httpError");

const createOrdersController = (ordersService) => ({
  createOrder: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const result = await ordersService.createOrder(userId, req.body);
      res.status(201).json(result);
    } catch (err) {
      if (err.status && err.message) {
        return next(
          createHttpError({
            status: err.status,
            payload: { error: err.message },
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al crear orden" },
          logError: err,
        }),
      );
    }
  },

  createCheckoutProPreference: async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user?.id;

    try {
      const result = await ordersService.createCheckoutProPreference(
        orderId,
        userId,
      );
      return res.json(result);
    } catch (err) {
      if (err.status && err.message) {
        return next(
          createHttpError({
            status: err.status,
            payload: { error: err.message },
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al crear preferencia de pago" },
          logError: err,
        }),
      );
    }
  },

  confirmCashOrder: async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const { shippingReference } = req.body;

    try {
      const result = await ordersService.confirmCashOrder(
        orderId,
        userId,
        shippingReference,
      );

      return res.json(result);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: {
            error: err.message || "Error al confirmar orden en efectivo",
            details: err.details,
          },
        }),
      );
    }
  },

  confirmMercadoPagoOrder: async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const { paymentId } = req.body;

    try {
      const result = await ordersService.confirmMercadoPagoOrder(
        orderId,
        userId,
        paymentId,
      );

      return res.json(result);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: {
            error: err.message || "Error al confirmar orden con Mercado Pago",
            details: err.details,
          },
          logError: err,
        }),
      );
    }
  },

  updateOrderStatus: async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      const order = await ordersService.updateOrderStatus({ orderId, status });
      return res.json(order);
    } catch (err) {
      if (err.status && err.message) {
        return next(
          createHttpError({
            status: err.status,
            payload: { error: err.message },
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al actualizar estado" },
          logError: err,
        }),
      );
    }
  },

  getOrdersByUser: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const orders = await ordersService.getOrdersByUser(userId);
      res.json(orders);
    } catch (err) {
      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al obtener órdenes" },
          logError: err,
        }),
      );
    }
  },
});

module.exports = createOrdersController;
