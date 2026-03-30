const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "harta_db",
  password: "kjkszpj23",
  port: 5432,
});

module.exports = pool;
