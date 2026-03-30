const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");

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

  res.json({ message: "Usuario eliminado" });
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
    const { cart, userId } = req.body;

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
        [orderId, item.id, item.quantity, item.price],
      );
    }

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

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});
