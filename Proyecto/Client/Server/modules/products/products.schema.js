const ensureProductsSchema = async (pool) => {
  try {
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    await pool.query(`
      UPDATE products
      SET active = TRUE
      WHERE active IS NULL;
    `);
  } catch (error) {
    console.error("No se pudo verificar esquema de productos", error.message);
  }
};

module.exports = ensureProductsSchema;
