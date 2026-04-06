const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const dotenv = require("dotenv");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

dotenv.config();

app.use(express.json());
app.use(cors());

const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:3000";

const mercadopagoClient = MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN })
  : null;

const normalizeShippingMethod = (value) => {
  const allowed = ["home_delivery", "pickup"];
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : null;
};

const parseJsonIfNeeded = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

const parseExternalReference = (externalReference) => {
  const [orderPart, userPart] = String(externalReference || "").split(":user:");

  if (!orderPart || !userPart || !orderPart.startsWith("order:")) {
    return null;
  }

  return {
    orderId: Number(orderPart.replace("order:", "")),
    userId: Number(userPart),
  };
};

async function ensureOrderSchema() {
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
}

async function finalizeOrderWithStockValidation(client, { order, userId, paymentReference }) {
  const cartResult = await client.query(
    `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id = $1
     FOR UPDATE OF p`,
    [userId],
  );

  const cart = cartResult.rows;

  if (cart.length === 0) {
    throw { status: 400, message: "No hay items para confirmar" };
  }

  const stockIssues = cart
    .filter((item) => Number(item.stock) < Number(item.quantity))
    .map((item) => ({
      productId: item.product_id,
      name: item.name,
      available: Number(item.stock),
      requested: Number(item.quantity),
    }));

  if (stockIssues.length > 0) {
    throw {
      status: 409,
      message: "Stock insuficiente para algunos productos",
      details: stockIssues,
    };
  }

  for (const item of cart) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [order.id, item.product_id, item.quantity, item.price],
    );

    await client.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
      item.quantity,
      item.product_id,
    ]);
  }

  await client.query(
    `UPDATE orders
     SET status = $1,
         payment_reference = $2,
         paid_at = NOW()
     WHERE id = $3`,
    [ORDER_STATUS.PAID, paymentReference, order.id],
  );

  await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
}

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

app.get("/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products");
  res.json(result.rows);
});

app.post("/products", async (req, res) => {
  const { name, description, price, category, image, stock } = req.body;

  if (!name || !price || !category || !image) {
    return res.status(400).json({
      error: "name, price, category e image son obligatorios",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, image, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name.trim(),
        description?.trim() || "",
        Number(price),
        category.trim().toLowerCase(),
        image.trim(),
        Number(stock) || 0,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado", product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
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
    const { userId, shippingAddress, shippingMethod, paymentMethod } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId es obligatorio" });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      return res.status(400).json({
        error: "Dirección incompleta. Requerido: street, city, zipCode",
      });
    }

    const normalizedShippingMethod = normalizeShippingMethod(shippingMethod);
    if (!normalizedShippingMethod) {
      return res.status(400).json({ error: "Método de envío inválido" });
    }

    const normalizedPaymentMethod = String(paymentMethod || "").trim().toLowerCase();
    if (!["mercadopago", "cash"].includes(normalizedPaymentMethod)) {
      return res.status(400).json({ error: "Método de pago inválido" });
    }

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

    const subtotal = cart.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.quantity),
      0,
    );

    const shippingCost = normalizedShippingMethod === "home_delivery" ? 3000 : 0;
    const total = Number((subtotal + shippingCost).toFixed(2));

    const orderResult = await pool.query(
      `INSERT INTO orders (total, user_id, status, shipping_method, shipping_cost, shipping_address, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING *`,
      [
        total,
        userId,
        ORDER_STATUS.PENDING,
        normalizedShippingMethod,
        shippingCost,
        JSON.stringify({ ...shippingAddress, country: "Argentina" }),
        normalizedPaymentMethod,
      ],
    );

    res.status(201).json({
      message: "Orden pendiente creada",
      order: orderResult.rows[0],
      breakdown: { subtotal, shippingCost, total },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear orden" });
  }
});

app.post("/orders/:orderId/checkout-pro-preference", async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.body;

  if (!mercadopagoClient) {
    return res.status(500).json({
      error: "Mercado Pago no configurado. Falta MP_ACCESS_TOKEN en el backend.",
    });
  }

  try {
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const order = orderResult.rows[0];

    if (order.status !== ORDER_STATUS.PENDING) {
      return res.status(409).json({
        error: `La orden no puede pagarse en estado ${order.status}`,
      });
    }

    if (order.payment_method !== "mercadopago") {
      return res.status(400).json({
        error: "La orden no fue creada con método Mercado Pago",
      });
    }

    const cartResult = await pool.query(
      `SELECT c.quantity, p.name, p.price
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [userId],
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: "No hay productos en carrito" });
    }

    const preference = new Preference(mercadopagoClient);

    const externalReference = `order:${order.id}:user:${userId}`;

    const preferenceResult = await preference.create({
      body: {
        items: [
          ...cartResult.rows.map((item) => ({
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price),
            currency_id: "ARS",
          })),
          {
            title:
              order.shipping_method === "home_delivery"
                ? "Envío a domicilio"
                : "Retiro en local",
            quantity: 1,
            unit_price: Number(order.shipping_cost || 0),
            currency_id: "ARS",
          },
        ],
        external_reference: externalReference,
        back_urls: {
          success: `${FRONTEND_BASE_URL}/checkout?payment_status=success&order_id=${order.id}`,
          pending: `${FRONTEND_BASE_URL}/checkout?payment_status=pending&order_id=${order.id}`,
          failure: `${FRONTEND_BASE_URL}/checkout?payment_status=failure&order_id=${order.id}`,
        },
        auto_return: "approved",
        notification_url: `${BACKEND_BASE_URL}/payments/mercadopago/webhook`,
      },
    });

    await pool.query("UPDATE orders SET mp_preference_id = $1 WHERE id = $2", [
      preferenceResult.id,
      order.id,
    ]);

    return res.json({
      init_point: preferenceResult.init_point,
      sandbox_init_point: preferenceResult.sandbox_init_point,
      preference_id: preferenceResult.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear preferencia de pago" });
  }
});

app.post("/orders/:orderId/confirm-cash", async (req, res) => {
  const { orderId } = req.params;
  const { userId, shippingReference } = req.body;

  if (!userId || !shippingReference) {
    return res.status(400).json({
      error: "userId y shippingReference son obligatorios",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [orderId, userId],
    );

    if (orderResult.rows.length === 0) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    const order = orderResult.rows[0];

    if (order.status !== ORDER_STATUS.PENDING) {
      throw {
        status: 409,
        message: `La orden no puede confirmarse en estado ${order.status}`,
      };
    }

    if (order.payment_method !== "cash") {
      throw {
        status: 400,
        message: "La orden no fue creada con método efectivo",
      };
    }

    if (String(shippingReference).trim().length < 3) {
      throw {
        status: 400,
        message: "Envío rechazado: referencia inválida",
      };
    }

    await finalizeOrderWithStockValidation(client, {
      order,
      userId,
      paymentReference: `cash:${shippingReference}`,
    });

    await client.query("COMMIT");

    return res.json({
      message: "Orden confirmada en efectivo",
      orderId: order.id,
      status: ORDER_STATUS.PAID,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(err.status || 500).json({
      error: err.message || "Error al confirmar orden en efectivo",
      details: err.details,
    });
  } finally {
    client.release();
  }
});

app.post("/orders/:orderId/confirm-mercadopago", async (req, res) => {
  const { orderId } = req.params;
  const { userId, paymentId } = req.body;

  if (!mercadopagoClient) {
    return res.status(500).json({
      error: "Mercado Pago no configurado. Falta MP_ACCESS_TOKEN en el backend.",
    });
  }

  if (!userId || !paymentId) {
    return res.status(400).json({
      error: "userId y paymentId son obligatorios",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [orderId, userId],
    );

    if (orderResult.rows.length === 0) {
      throw { status: 404, message: "Orden no encontrada" };
    }

    const order = orderResult.rows[0];

    if (order.status !== ORDER_STATUS.PENDING) {
      throw {
        status: 409,
        message: `La orden no puede confirmarse en estado ${order.status}`,
      };
    }

    if (order.payment_method !== "mercadopago") {
      throw {
        status: 400,
        message: "La orden no fue creada con método Mercado Pago",
      };
    }

    const payment = new Payment(mercadopagoClient);
    const paymentInfo = await payment.get({ id: paymentId });

    const referenceData = parseExternalReference(paymentInfo.external_reference);

    if (!referenceData || referenceData.orderId !== Number(orderId) || referenceData.userId !== Number(userId)) {
      throw {
        status: 409,
        message: "El pago no corresponde a la orden actual",
      };
    }

    if (paymentInfo.status !== "approved") {
      throw {
        status: 409,
        message: `El pago no está aprobado. Estado actual: ${paymentInfo.status}`,
      };
    }

    await finalizeOrderWithStockValidation(client, {
      order,
      userId,
      paymentReference: `mp:${paymentInfo.id}`,
    });

    await client.query("COMMIT");

    return res.json({
      message: "Orden confirmada y pagada con Mercado Pago",
      orderId: order.id,
      status: ORDER_STATUS.PAID,
      paymentId: paymentInfo.id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(err.status || 500).json({
      error: err.message || "Error al confirmar orden con Mercado Pago",
      details: err.details,
    });
  } finally {
    client.release();
  }
});

app.post("/payments/mercadopago/webhook", async (req, res) => {
  // endpoint requerido para Checkout Pro; se confirma pago desde frontend con payment_id
  return res.sendStatus(200);
});

app.patch("/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Estado inválido. Usar: ${VALID_ORDER_STATUSES.join(", ")}`,
    });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, orderId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar estado" });
  }
});

app.post("/auth/google", async (req, res) => {
  const { name, email } = req.body;

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

app.patch("/cart/:id/decrease", async (req, res) => {
  const { id } = req.params;

  try {
    const itemResult = await pool.query(
      "SELECT id, quantity FROM cart_items WHERE id = $1",
      [id],
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    const currentQty = itemResult.rows[0].quantity;

    if (currentQty <= 1) {
      await pool.query("DELETE FROM cart_items WHERE id = $1", [id]);
      return res.json({ message: "Item eliminado del carrito" });
    }

    const updated = await pool.query(
      "UPDATE cart_items SET quantity = quantity - 1 WHERE id = $1 RETURNING *",
      [id],
    );

    return res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar carrito" });
  }
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

    const orders = result.rows.map((row) => ({
      ...row,
      shipping_address: parseJsonIfNeeded(row.shipping_address),
    }));

    res.json(orders);
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

ensureOrderSchema().finally(() => {
  app.listen(3000, () => {
    console.log("Servidor en puerto 3000");
  });
});
