const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig } = require("mercadopago");

const app = express();

const pool = require("./db/pool");
const env = require("./config/env");

const createUsersRouter = require("./modules/users/users.routes");
const createProductsRouter = require("./modules/products/products.routes");
const createAuthRouter = require("./modules/auth/auth.routes");
const createCartRouter = require("./modules/cart/cart.routes");
const createOrdersRouter = require("./modules/orders/orders.routes");
const createPaymentsRouter = require("./modules/payments/payments.routes");

const createOrdersWorkflow = require("./modules/orders/orders.workflow");
const ensureOrderSchema = require("./modules/orders/orders.schema");
const ensureProductsSchema = require("./modules/products/products.schema");
const errorHandler = require("./middlewares/errorHandler");

const {
  hasValidMercadoPagoTokenFormat,
  extractMercadoPagoTopic,
  extractMercadoPagoPaymentId,
} = require("./modules/payments/mercadopago.helpers");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const MP_ACCESS_TOKEN = env.MP_ACCESS_TOKEN;
const PORT = env.PORT;
const FRONTEND_BASE_URL = env.FRONTEND_BASE_URL;
const BACKEND_BASE_URL = env.BACKEND_BASE_URL;
const ADMIN_EMAILS = env.ADMIN_EMAILS || [];

const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).trim().toLowerCase());
};

const mercadopagoClient = MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN })
  : null;

const { finalizeOrderWithStockValidation, confirmMercadoPagoPayment } =
  createOrdersWorkflow({
    mercadopagoClient,
  });

app.use("/api/users", createUsersRouter({ pool }));
app.use("/api/products", createProductsRouter({ pool }));
app.use("/api/auth", createAuthRouter({ pool, isAdminEmail }));
app.use("/api/cart", createCartRouter({ pool }));
app.use(
  "/api/orders",
  createOrdersRouter({
    pool,
    mercadopagoClient,
    MP_ACCESS_TOKEN,
    FRONTEND_BASE_URL,
    BACKEND_BASE_URL,
    confirmMercadoPagoPayment,
    finalizeOrderWithStockValidation,
  }),
);
app.use(
  "/api/payments",
  createPaymentsRouter({
    pool,
    mercadopagoClient,
    hasValidMercadoPagoTokenFormat,
    MP_ACCESS_TOKEN,
    BACKEND_BASE_URL,
    FRONTEND_BASE_URL,
    extractMercadoPagoTopic,
    extractMercadoPagoPaymentId,
    confirmMercadoPagoPayment,
  }),
);

app.use(errorHandler);

Promise.all([ensureOrderSchema(pool), ensureProductsSchema(pool)])
  .then(() => {
    app.listen(PORT, () => {
      if (!MP_ACCESS_TOKEN) {
        console.warn(
          "[Mercado Pago] No hay access token configurado. Definí MP_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN.",
        );
      } else if (!hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)) {
        console.warn(
          "[Mercado Pago] Access token con formato inválido. Debe comenzar con TEST- o APP_USR-.",
        );
      }

      console.log(`Servidor en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "[Startup Error] No se pudo inicializar el schema de orders:",
      error,
    );
    process.exit(1);
  });
