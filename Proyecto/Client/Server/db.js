const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "harta_db",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT || 5432),
});

module.exports = pool;
