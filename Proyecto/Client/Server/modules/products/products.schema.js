const ensureProductsSchema = async (pool) => {
  try {
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS category_id INTEGER;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'products_category_id_fkey'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT products_category_id_fkey
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await pool.query(`
      UPDATE products
      SET active = TRUE
      WHERE active IS NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
    `);

    await pool.query(`
      UPDATE products p
      SET category_id = c.id
      FROM categories c
      WHERE p.category_id IS NULL
        AND LOWER(TRIM(p.category)) = LOWER(TRIM(c.name));
    `);
  } catch (error) {
    console.error("No se pudo verificar esquema de productos", error.message);
  }
};

module.exports = ensureProductsSchema;
