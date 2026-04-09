const hasValidMercadoPagoTokenFormat = (token) => /^TEST-|^APP_USR-/.test(String(token || ""));

const canUseMercadoPagoAutoReturn = (url) => {
  try {
    const parsed = new URL(String(url || ""));
    const isHttps = parsed.protocol === "https:";
    const isLocalhost =
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);

    return isHttps || isLocalhost;
  } catch {
    return false;
  }
};

const extractMercadoPagoPaymentId = (req) => {
  const fromQuery =
    req.query?.["data.id"] ||
    req.query?.data_id ||
    req.query?.id;

  const fromBody = req.body?.data?.id || req.body?.id;

  const resource = req.body?.resource || req.query?.resource;
  const fromResource = resource
    ? String(resource).match(/\/v1\/payments\/(\d+)/)?.[1]
    : null;

  return fromQuery || fromBody || fromResource || null;
};

const extractMercadoPagoTopic = (req) => {
  const directTopic = req.query?.type || req.query?.topic || req.body?.type || req.body?.topic;

  if (directTopic) {
    return String(directTopic).toLowerCase();
  }

  const action = String(req.body?.action || "").toLowerCase();
  if (action.startsWith("payment.")) {
    return "payment";
  }

  return null;
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

module.exports = {
  hasValidMercadoPagoTokenFormat,
  canUseMercadoPagoAutoReturn,
  extractMercadoPagoPaymentId,
  extractMercadoPagoTopic,
  parseExternalReference,
};
