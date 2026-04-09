const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createOrdersRepository = require("./orders.repository");
const createOrdersService = require("./orders.service");
const createOrdersController = require("./orders.controller");

const createOrdersRouter = ({
  pool,
  mercadopagoClient,
  MP_ACCESS_TOKEN,
  confirmMercadoPagoPayment,
  finalizeOrderWithStockValidation,
  FRONTEND_BASE_URL,
}) => {
  const router = express.Router();
  const ordersRepository = createOrdersRepository(pool);
  const ordersService = createOrdersService({
    ordersRepository,
    mercadopagoClient,
    MP_ACCESS_TOKEN,
    FRONTEND_BASE_URL,
    confirmMercadoPagoPayment,
    finalizeOrderWithStockValidation,
  });
  const ordersController = createOrdersController(ordersService);

  router.post("/orders", asyncHandler(ordersController.createOrder));
  router.post(
    "/orders/:orderId/checkout-pro-preference",
    asyncHandler(ordersController.createCheckoutProPreference),
  );
  router.post(
    "/orders/:orderId/confirm-cash",
    asyncHandler(ordersController.confirmCashOrder),
  );
  router.post(
    "/orders/:orderId/confirm-mercadopago",
    asyncHandler(ordersController.confirmMercadoPagoOrder),
  );
  router.patch(
    "/orders/:orderId/status",
    asyncHandler(ordersController.updateOrderStatus),
  );
  router.get("/orders/:userId", asyncHandler(ordersController.getOrdersByUser));

  return router;
};

module.exports = createOrdersRouter;
