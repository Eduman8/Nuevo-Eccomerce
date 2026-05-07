const PRODUCT_SELECT_FIELDS = `
  p.id,
  p.name,
  p.description,
  p.price,
  COALESCE(c.name, p.category) AS category,
  p.category_id,
  c.name AS category_name,
  c.image_url AS category_image_url,
  p.image,
  p.stock,
  p.active,
  p.created_at,
  p.updated_at
`;

const PRODUCT_RETURN_FIELDS = `
  id,
  name,
  description,
  price,
  category,
  category_id,
  image,
  stock,
  active,
  created_at,
  updated_at
`;

const selectProductById = async (pool, id) => {
  const result = await pool.query(
    `SELECT ${PRODUCT_SELECT_FIELDS}
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id],
  );

  return result.rows[0] || null;
};

const createProductsRepository = (pool) => ({
  getPublic: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.active = TRUE
       ORDER BY p.id DESC`,
    );

    return result.rows;
  },

  getAllForAdmin: async () => {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT_FIELDS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.id DESC`,
    );

    return result.rows;
  },

  getById: async (id) => selectProductById(pool, id),

  getCategoryById: async (categoryId) => {
    const result = await pool.query(
      `SELECT id, name, image_url, active
       FROM categories
       WHERE id = $1`,
      [categoryId],
    );

    return result.rows[0] || null;
  },

  create: async ({ name, description, price, category, categoryId, image, stock, active }) => {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, category_id, image, stock, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [name, description, price, category, categoryId, image, stock, active],
    );

    return selectProductById(pool, result.rows[0].id);
  },

  updateById: async ({ id, name, description, price, category, categoryId, image, stock, active }) => {
    const result = await pool.query(
      `UPDATE products
       SET
         name = $1,
         description = $2,
         price = $3,
         category = $4,
         category_id = $5,
         image = $6,
         stock = $7,
         active = $8,
         updated_at = NOW()
       WHERE id = $9
       RETURNING id`,
      [name, description, price, category, categoryId, image, stock, active, id],
    );

    if (!result.rows[0]) return null;
    return selectProductById(pool, result.rows[0].id);
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
       RETURNING ${PRODUCT_RETURN_FIELDS}`,
      [id],
    );

    return result.rows[0] || null;
  },
});

module.exports = createProductsRepository;
