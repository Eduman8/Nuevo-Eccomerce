const createProductsRepository = (pool) => ({
  getAll: async () => {
    const result = await pool.query("SELECT * FROM products");
    return result.rows;
  },
  create: async ({ name, description, price, category, image, stock }) => {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, image, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, category, image, stock],
    );
    return result.rows[0];
  },
  deleteById: async (id) => {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id],
    );
    return result.rows[0] || null;
  },
  updateCategoryById: async ({ id, category }) => {
    const result = await pool.query(
      "UPDATE products SET category = $1 WHERE id = $2 RETURNING *",
      [category, id],
    );
    return result.rows[0] || null;
  },
});

module.exports = createProductsRepository;
