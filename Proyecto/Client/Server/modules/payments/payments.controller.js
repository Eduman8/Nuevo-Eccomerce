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
    const getOrderNotificationContext = async (orderId) => {
      const result = await pool.query(
        `
        SELECT
          o.id AS order_id,
          o.status,
          o.total,
          o.payment_method,
          u.name AS buyer_name,
          u.email AS buyer_email
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE o.id = $1
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
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
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

      if (confirmation.paid && !confirmation.alreadyProcessed) {
        const notificationOrder = await getOrderNotificationContext(
          confirmation.orderId,
        );

        if (notificationOrder) {
          await notificationService?.notifyMercadoPagoApprovedForCustomer({
            order: notificationOrder,
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
