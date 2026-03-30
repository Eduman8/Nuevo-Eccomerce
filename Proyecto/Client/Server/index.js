const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const { products } = require("./db");
app.use(express.json());
app.use(cors());

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});
app.get("/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products");
  res.json(result.rows);
});
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  const result = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email],
  );

  res.json(result.rows[0]);
});
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM users WHERE id = $1", [id]);

  res.send("Usuario eliminado");
});

app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const result = await pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
    [name, email, id],
  );
  res.json(result.rows[0]);
});

app.post("/orders", async (req, res) => {
  try {
    const { userId } = req.body;

    const cartResult = await pool.query(
      `SELECT c.*, p.price 
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId],
    );

    const cart = cartResult.rows;

    if (cart.length === 0) {
      return res.status(400).json({ error: "Carrito vacío" });
    }

    const total = cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    const orderResult = await pool.query(
      "INSERT INTO orders (total, user_id) VALUES ($1, $2) RETURNING *",
      [total, userId],
    );

    const orderId = orderResult.rows[0].id;

    for (let item of cart) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price],
      );
    }

    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);

    res.json({ message: "Orden creada", orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear orden" });
  }
});
app.post("/auth/google", async (req, res) => {
  const { name, email, googleId } = req.body;

  let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  if (user.rows.length === 0) {
    user = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email],
    );
  }

  res.json(user.rows[0]);
});
app.post("/cart", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [userId, productId],
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *",
        [quantity, userId, productId],
      );
      return res.json(updated.rows[0]);
    }

    const result = await pool.query(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [userId, productId, quantity],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en carrito" });
  }
});

app.get("/cart/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, p.name, p.price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener carrito" });
  }
});

app.delete("/cart/:id", async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM cart_items WHERE id = $1", [id]);

  res.send("Item eliminado del carrito");
});

app.delete("/cart/user/:userId", async (req, res) => {
  const { userId } = req.params;
  await pool.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
  res.send("Carrito vaciado");
});

app.get("/orders/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
      o.id AS order_id,
      o.total,
      o.created_at,
      oi.quantity,
      oi.price,
      p.name
      FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.id DESC
      `,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});
app.patch("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  try {
    const result = await pool.query(
      "UPDATE products SET category = $1 WHERE id = $2 RETURNING *",
      [category, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});
app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});
