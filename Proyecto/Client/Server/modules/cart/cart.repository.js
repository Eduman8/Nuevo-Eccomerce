const createCartRepository = (pool) => ({
  getExistingItem: async ({ userId, productId }) => {
    const result = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [userId, productId],
    );
    return result.rows;
  },

  getProductById: async (productId) => {
    const result = await pool.query(
      "SELECT id, name, stock, active FROM products WHERE id = $1",
      [productId],
    );
    return result.rows[0] || null;
  },

  increaseQuantity: async ({ quantity, userId, productId }) => {
    const result = await pool.query(
      "UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
      [quantity, userId, productId],
    );
    return result.rows[0];
  },

  createItem: async ({ userId, productId, quantity }) => {
    const result = await pool.query(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [userId, productId, quantity],
    );
    return result.rows[0];
  },

  getByUserId: async (userId) => {
    const result = await pool.query(
      `SELECT c.*, p.name, p.price, p.stock, p.active
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1`,
      [userId],
    );

    return result.rows;
  },

  deleteById: async (id) => {
    await pool.query("DELETE FROM cart_items WHERE id = $1", [id]);
  },

  getItemById: async (id) => {
    const itemResult = await pool.query(
      "SELECT id, quantity, product_id FROM cart_items WHERE id = $1",
      [id],
    );

    return itemResult.rows[0] || null;
  },

  updateQuantityById: async ({ id, quantity }) => {
    const updated = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *",
      [quantity, id],
    );

    return updated.rows[0] || null;
  },

  decreaseQuantityById: async (id) => {
    const updated = await pool.query(
      "UPDATE cart_items SET quantity = quantity - 1 WHERE id = $1 RETURNING *",
      [id],
    );

    return updated.rows[0];
  },

  deleteByUserId: async (userId) => {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
  },
});

module.exports = createCartRepository;
