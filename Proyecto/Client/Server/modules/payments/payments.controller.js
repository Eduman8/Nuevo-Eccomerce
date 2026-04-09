const mercadoPagoWebhook = (
  pool,
  mercadopagoClient,
  hasValidMercadoPagoTokenFormat,
  MP_ACCESS_TOKEN,
  extractMercadoPagoTopic,
  extractMercadoPagoPaymentId,
  confirmMercadoPagoPayment,
) => async (req, res) => {
  if (!mercadopagoClient || !hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN)) {
    return res.sendStatus(200);
  }

  const topic = extractMercadoPagoTopic(req);
  const dataId = extractMercadoPagoPaymentId(req);

  if (topic !== "payment" || !dataId) {
    return res.sendStatus(200);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await confirmMercadoPagoPayment({
      client,
      paymentId: dataId,
    });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error procesando webhook de Mercado Pago", err.message);
  } finally {
    client.release();
  }

  return res.sendStatus(200);
};

const mercadoPagoStatus = (
  mercadopagoClient,
  hasValidMercadoPagoTokenFormat,
  MP_ACCESS_TOKEN,
  BACKEND_BASE_URL,
  FRONTEND_BASE_URL,
) => async (_req, res) => {
  const configured = Boolean(mercadopagoClient);

  return res.json({
    configured,
    tokenSource: process.env.MP_ACCESS_TOKEN
      ? "MP_ACCESS_TOKEN"
      : process.env.MERCADOPAGO_ACCESS_TOKEN
        ? "MERCADOPAGO_ACCESS_TOKEN"
        : null,
    tokenFormatValid: configured ? hasValidMercadoPagoTokenFormat(MP_ACCESS_TOKEN) : false,
    backendBaseUrl: BACKEND_BASE_URL,
    frontendBaseUrl: FRONTEND_BASE_URL,
  });
};

module.exports = {
  mercadoPagoWebhook,
  mercadoPagoStatus,
};
