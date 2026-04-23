const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const requireAuth = require("../../middlewares/requireAuth");
const requireAdmin = require("../../middlewares/requireAdmin");
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
  BACKEND_BASE_URL,
}) => {
  const router = express.Router();
  const ordersRepository = createOrdersRepository(pool);

  const ordersService = createOrdersService({
    ordersRepository,
    mercadopagoClient,
    MP_ACCESS_TOKEN,
    FRONTEND_BASE_URL,
    BACKEND_BASE_URL,
    confirmMercadoPagoPayment,
    finalizeOrderWithStockValidation,
  });

  const ordersController = createOrdersController(ordersService);

  router.use(requireAuth);

  router.post("/", asyncHandler(ordersController.createOrder));

  router.get("/my-orders", asyncHandler(ordersController.getOrdersByUser));

  router.get(
    "/admin/orders",
    requireAdmin,
    asyncHandler(ordersController.getAdminOrders),
  );

  router.post(
    "/:orderId/checkout-pro-preference",
    asyncHandler(ordersController.createCheckoutProPreference),
  );

  router.post(
    "/:orderId/confirm-cash",
    asyncHandler(ordersController.confirmCashOrder),
  );

  router.post(
    "/:orderId/confirm-mercadopago",
    asyncHandler(ordersController.confirmMercadoPagoOrder),
  );

  router.patch(
    "/:orderId/status",
    asyncHandler(ordersController.updateOrderStatus),
  );

  return router;
};

module.exports = createOrdersRouter;
