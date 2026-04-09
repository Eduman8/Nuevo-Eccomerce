const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const {
  mercadoPagoWebhook,
  mercadoPagoStatus,
} = require("./payments.controller");

const createPaymentsRouter = ({
  pool,
  mercadopagoClient,
  hasValidMercadoPagoTokenFormat,
  MP_ACCESS_TOKEN,
  BACKEND_BASE_URL,
  FRONTEND_BASE_URL,
  extractMercadoPagoTopic,
  extractMercadoPagoPaymentId,
  confirmMercadoPagoPayment,
}) => {
  const router = express.Router();

  router.all(
    "/payments/mercadopago/webhook",
    asyncHandler(mercadoPagoWebhook(
      pool,
      mercadopagoClient,
      hasValidMercadoPagoTokenFormat,
      MP_ACCESS_TOKEN,
      extractMercadoPagoTopic,
      extractMercadoPagoPaymentId,
      confirmMercadoPagoPayment,
    )),
  );

  router.get(
    "/payments/mercadopago/status",
    asyncHandler(mercadoPagoStatus(
      mercadopagoClient,
      hasValidMercadoPagoTokenFormat,
      MP_ACCESS_TOKEN,
      BACKEND_BASE_URL,
      FRONTEND_BASE_URL,
    )),
  );

  return router;
};

module.exports = createPaymentsRouter;
