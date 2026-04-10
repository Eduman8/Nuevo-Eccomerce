const mercadoPagoWebhook =
  (
    pool,
    mercadopagoClient,
    hasValidMercadoPagoTokenFormat,
    MP_ACCESS_TOKEN,
    extractMercadoPagoTopic,
    extractMercadoPagoPaymentId,
    confirmMercadoPagoPayment,
  ) =>
  async (req, res) => {
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
        body: req.body,
        query: req.query,
      });
      return res.sendStatus(200);
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await confirmMercadoPagoPayment({
        client,
        paymentId,
      });

      await client.query("COMMIT");
      return res.sendStatus(200);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error procesando webhook de Mercado Pago", {
        message: err.message,
        stack: err.stack,
        paymentId,
        topic,
        body: req.body,
        query: req.query,
      });
      return res.sendStatus(500);
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
