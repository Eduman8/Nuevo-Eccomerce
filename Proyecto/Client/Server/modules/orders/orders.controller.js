const { createHttpError } = require("../../utils/httpError");

const createOrdersController = (ordersService) => ({
  createOrder: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const result = await ordersService.createOrder(userId, req.body);
      return res.status(201).json(result);
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



  startMercadoPagoCheckout: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const result = await ordersService.startMercadoPagoCheckout(userId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: {
            error: err.message || "Error al iniciar checkout con Mercado Pago",
            details: err.details,
          },
          logError: err,
        }),
      );
    }
  },

  confirmCashOrderFromCheckout: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const result = await ordersService.confirmCashOrderFromCheckout(userId, req.body);
      return res.status(201).json(result);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: {
            error: err.message || "Error al confirmar compra en efectivo",
            details: err.details,
          },
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
          logError: err,
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
    const userId = req.user?.id;

    try {
      const order = await ordersService.updateOrderStatus({
        orderId,
        status,
        userId,
      });
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

  updateOrderStatusAsAdmin: async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      const order = await ordersService.updateOrderStatusAsAdmin({
        orderId,
        status,
      });
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
          payload: { error: "Error al actualizar estado de la orden" },
          logError: err,
        }),
      );
    }
  },

  deleteOrderAsAdmin: async (req, res, next) => {
    const { orderId } = req.params;

    try {
      const result = await ordersService.deleteOrderAsAdmin(orderId);
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
          payload: { error: "Error al eliminar la orden" },
          logError: err,
        }),
      );
    }
  },


  getAdminOrders: async (_req, res, next) => {
    try {
      const orders = await ordersService.getAdminOrders();
      return res.json(orders);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: { error: err.message || "Error al obtener órdenes de admin" },
          logError: err,
        }),
      );
    }
  },
  getOrdersByUser: async (req, res, next) => {
    const userId = req.user?.id;

    try {
      const orders = await ordersService.getOrdersByUser(userId);
      return res.json(orders);
    } catch (err) {
      return next(
        createHttpError({
          status: err.status || 500,
          payload: { error: err.message || "Error al obtener órdenes" },
          logError: err,
        }),
      );
    }
  },
});

module.exports = createOrdersController;
