const mercadoPagoWebhook =
  (
    pool,
    mercadopagoClient,
    hasValidMercadoPagoTokenFormat,
    MP_ACCESS_TOKEN,
    extractMercadoPagoTopic,
    extractMercadoPagoPaymentId,
    confirmMercadoPagoPayment,
    notificationService,
  ) =>
  async (req, res) => {
    const shouldNotifyPaymentConfirmed = (confirmation) =>
      confirmation?.paid === true && confirmation?.alreadyProcessed === false;

    const getOrderNotificationContext = async (orderId) => {
      const result = await pool.query(
        `
        SELECT
          o.id AS order_id,
          o.status,
          o.total,
          o.payment_method,
          o.shipping_method,
          o.shipping_address,
          o.contact_name,
          o.contact_phone,
          o.shipping_reference,
          u.name AS buyer_name,
          u.email AS buyer_email,
          COALESCE(
            json_agg(
              json_build_object(
                'productId', oi.product_id,
                'productName', p.name,
                'quantity', oi.quantity,
                'unitPrice', oi.price,
                'subtotal', (oi.quantity * oi.price)
              )
              ORDER BY oi.id ASC
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.id = $1
        GROUP BY o.id, u.name, u.email
        LIMIT 1
        `,
        [orderId],
      );

      const row = result.rows[0];
      if (!row) return null;

      return {
        orderId: row.order_id,
        status: row.status,
        total: row.total,
        paymentMethod: row.payment_method,
        shippingMethod: row.shipping_method,
        shippingAddress: row.shipping_address || null,
        contactName:
          row.contact_name ||
          row.shipping_address?.contactName ||
          row.shipping_address?.contact_name ||
          null,
        contactPhone:
          row.contact_phone ||
          row.shipping_address?.contactPhone ||
          row.shipping_address?.contact_phone ||
          null,
        shippingReference:
          row.shipping_reference ||
          row.shipping_address?.shippingReference ||
          row.shipping_address?.shipping_reference ||
          row.shipping_address?.reference ||
          row.shipping_address?.note ||
          null,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        items: Array.isArray(row.items) ? row.items : [],
      };
    };

    if (
      !mercadopagoClient ||
      !hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)
    ) {
      console.error(
        "Webhook Mercado Pago ignorado: cliente no configurado o token inválido",
      );
      return res.sendStatus(500);
    }

    const topic = extractMercadoPagoTopic(req);
    const rawPaymentId = extractMercadoPagoPaymentId(req);
    const paymentId = rawPaymentId ? String(rawPaymentId).trim() : null;

    if (topic !== "payment" || !paymentId) {
      console.warn("Webhook ignorado: topic o paymentId inválido", {
        topic,
        rawPaymentId,
        query: req.query,
        body: req.body,
      });

      return res.status(200).json({
        received: true,
        ignored: true,
        reason: "topic o paymentId inválido",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const confirmation = await confirmMercadoPagoPayment({
        client,
        paymentId,
      });

      await client.query("COMMIT");

      if (shouldNotifyPaymentConfirmed(confirmation)) {
        try {
          const notificationOrder = await getOrderNotificationContext(
            confirmation.orderId,
          );

          if (notificationOrder) {
            await notificationService?.notifyMercadoPagoApprovedForCustomer({
              order: notificationOrder,
              paymentId: confirmation.paymentId,
            });
          }
        } catch (error) {
          console.error("[Notification] notifyMercadoPagoApprovedForCustomer failed after webhook commit", {
            message: error.message,
            stack: error.stack,
            orderId: confirmation.orderId,
            paymentId: confirmation.paymentId,
          });
        }
      }

      console.log("Webhook procesado correctamente", {
        paymentId,
        topic,
        confirmation,
      });

      return res.status(200).json({
        received: true,
        processed: true,
        confirmation,
      });
    } catch (err) {
      await client.query("ROLLBACK");

      console.error("Error procesando webhook de Mercado Pago", {
        message: err.message,
        details: err.details,
        stack: err.stack,
        paymentId,
        topic,
        query: req.query,
        body: req.body,
      });

      return res.status(500).json({
        error: "Error procesando webhook de Mercado Pago",
        message: err.message,
        details: err.details,
      });
    } finally {
      client.release();
    }
  };

const mercadoPagoStatus =
  (
    mercadopagoClient,
    hasValidMercadoPagoTokenFormat,
    MP_ACCESS_TOKEN,
    BACKEND_BASE_URL,
    FRONTEND_BASE_URL,
  ) =>
  async (_req, res) => {
    const configured = Boolean(mercadopagoClient);

    return res.json({
      configured,
      tokenSource: process.env.MP_ACCESS_TOKEN
        ? "MP_ACCESS_TOKEN"
        : process.env.MERCADOPAGO_ACCESS_TOKEN
          ? "MERCADOPAGO_ACCESS_TOKEN"
          : null,
      tokenFormatValid: configured
        ? hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)
        : false,
      backendBaseUrl: BACKEND_BASE_URL,
      frontendBaseUrl: FRONTEND_BASE_URL,
    });
  };

module.exports = {
  mercadoPagoWebhook,
  mercadoPagoStatus,
};
