const PRODUCT_SELECT_FIELDS = `
  id,
  name,
  description,
  price,
  category,
  image,
  stock,
  active,
  created_at,
  updated_at
`;

const createProductsRepository = (pool) => ({
  getPublic: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products
       WHERE active = TRUE
       ORDER BY id DESC`,
    );

    return result.rows;
  },

  getAllForAdmin: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products
       ORDER BY id DESC`,
    );

    return result.rows;
  },

  getById: async (id) => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  },

  create: async ({ name, description, price, category, image, stock, active }) => {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, image, stock, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PRODUCT_SELECT_FIELDS}`,
      [name, description, price, category, image, stock, active],
    );

    return result.rows[0];
  },

  updateById: async ({ id, name, description, price, category, image, stock, active }) => {
    const result = await pool.query(
      `UPDATE products
       SET
         name = $1,
         description = $2,
         price = $3,
         category = $4,
         image = $5,
         stock = $6,
         active = $7,
         updated_at = NOW()
       WHERE id = $8
       RETURNING ${PRODUCT_SELECT_FIELDS}`,
      [name, description, price, category, image, stock, active, id],
    );

    return result.rows[0] || null;
  },

  hasOrdersByProductId: async (productId) => {
    const result = await pool.query(
      "SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1",
      [productId],
    );

    return result.rowCount > 0;
  },

  deleteById: async (id) => {
    const result = await pool.query(
      `DELETE FROM products
       WHERE id = $1
       RETURNING ${PRODUCT_SELECT_FIELDS}`,
      [id],
    );

    return result.rows[0] || null;
  },
});

module.exports = createProductsRepository;
