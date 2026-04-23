const ORDER_STATUS_LABELS = {
  pending: "Pendiente",
  paid: "Pagado",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  in_process: "En proceso",
  success: "Aprobado",
  failure: "Fallido",
};

const SHIPPING_METHOD_LABELS = {
  pickup: "Retiro en local",
  home_delivery: "Envío a domicilio",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  mercadopago: "Mercado Pago",
};

const formatFallbackLabel = (value) => {
  const parsed = String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!parsed) {
    return "-";
  }

  return parsed.charAt(0).toUpperCase() + parsed.slice(1);
};

const getLabelFromMap = (value, labelsMap) => {
  const normalized = String(value || "").toLowerCase().trim();
  return labelsMap[normalized] || formatFallbackLabel(value);
};

export const getOrderStatusLabel = (value) => getLabelFromMap(value, ORDER_STATUS_LABELS);

export const getShippingMethodLabel = (value) => getLabelFromMap(value, SHIPPING_METHOD_LABELS);

export const getPaymentMethodLabel = (value) => getLabelFromMap(value, PAYMENT_METHOD_LABELS);

