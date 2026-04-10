const createOrdersRepository = (pool) => ({
  getCartWithPricesByUserId: async (userId) => {
    const cartResult = await pool.query(
      `SELECT c.*, p.price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId],
    );

    return cartResult.rows;
  },

  createOrder: async ({
    total,
    userId,
    status,
    shippingMethod,
    shippingCost,
    shippingAddress,
    paymentMethod,
    client = null,
  }) => {
    const executor = client || pool;

    const result = await executor.query(
      `INSERT INTO orders
      (user_id, total, status, shipping_method, shipping_cost, shipping_address, payment_method)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
      [
        userId,
        total,
        status,
        shippingMethod,
        shippingCost,
        shippingAddress,
        paymentMethod,
      ],
    );

    return result.rows[0];
  },

  getOrderByIdAndUserId: async ({ orderId, userId }) => {
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId],
    );

    return orderResult.rows[0] || null;
  },

  getCartItemsForPreferenceByUserId: async (userId) => {
    const cartResult = await pool.query(
      `SELECT c.quantity, p.name, p.price
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [userId],
    );

    return cartResult.rows;
  },

  updateOrderPreferenceId: async ({ preferenceId, orderId }) => {
    await pool.query("UPDATE orders SET mp_preference_id = $1 WHERE id = $2", [
      preferenceId,
      orderId,
    ]);
  },

  connect: async () => pool.connect(),

  updateOrderStatusById: async ({ status, orderId }) => {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, orderId],
    );

    return result.rows[0] || null;
  },

  getOrdersByUserId: async (userId) => {
    const result = await pool.query(
      `
      SELECT
      o.id AS order_id,
      o.total,
      o.created_at,
      o.status,
      o.shipping_method,
      o.shipping_cost,
      o.shipping_address,
      o.payment_method,
      oi.quantity,
      oi.price,
      p.name
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.id DESC
      `,
      [userId],
    );

    return result.rows;
  },
});

module.exports = createOrdersRepository;
