const ensureOrderSchema = async (pool) => {
  try {
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(30),
      ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS shipping_address JSONB,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30),
      ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(255);
    `);
  } catch (err) {
    console.error("No se pudo verificar esquema de órdenes", err.message);
  }
};

module.exports = ensureOrderSchema;
