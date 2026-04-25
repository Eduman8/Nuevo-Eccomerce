const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const getMercadoPagoAccessToken = () => {
  const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
  return token ? String(token).trim() : "";
};

const env = {
  MP_ACCESS_TOKEN: getMercadoPagoAccessToken(),
  PORT: Number(process.env.PORT || 3000),
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || "http://localhost:3000",
  RESEND_API_KEY: process.env.RESEND_API_KEY
    ? String(process.env.RESEND_API_KEY).trim()
    : "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  EMAIL_ADMIN_TO: (process.env.EMAIL_ADMIN_TO || process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  DB_USER: process.env.DB_USER || "postgres",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "harta_db",
  DB_PASSWORD: process.env.DB_PASSWORD || "kjkszpj23",
  DB_PORT: Number(process.env.DB_PORT || 5432),
};

module.exports = env;
