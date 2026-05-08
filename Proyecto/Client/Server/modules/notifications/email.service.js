const PICKUP_LOCATION = "Retiro en #HARTA — Armstrong, Santa Fe";

const formatCurrencyArs = (amount) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const cleanText = (value) => String(value || "").trim();

const getAddressPart = (shippingAddress, keys) => {
  for (const key of keys) {
    const value = cleanText(shippingAddress?.[key]);
    if (value) return value;
  }

  return "";
};

const buildHomeDeliveryAddressLine = (shippingAddress) => {
  const street = getAddressPart(shippingAddress, ["street", "address"]);
  const number = getAddressPart(shippingAddress, [
    "addressNumber",
    "address_number",
    "number",
  ]);
  const city = getAddressPart(shippingAddress, ["city"]);
  const province = getAddressPart(shippingAddress, ["province", "state"]);
  const postalCode = getAddressPart(shippingAddress, [
    "postalCode",
    "postal_code",
    "zipCode",
  ]);

  return [
    [street, number].filter(Boolean).join(" "),
    city,
    province,
    postalCode ? `CP ${postalCode}` : "",
  ]
    .filter(Boolean)
    .join(", ");
};

const buildDeliveryText = (order) => {
  const lines = ["Entrega:"];
  const contactName = cleanText(order.contactName);
  const contactPhone = cleanText(order.contactPhone);
  const shippingReference = cleanText(order.shippingReference);

  if (order.shippingMethod === "pickup") {
    lines.push(PICKUP_LOCATION);
  } else if (order.shippingMethod === "home_delivery") {
    lines.push(
      buildHomeDeliveryAddressLine(order.shippingAddress) || "Dirección no disponible",
    );
  } else {
    lines.push("Método de entrega no disponible");
  }

  if (contactName) lines.push(`Contacto: ${contactName}`);
  if (contactPhone) lines.push(`Teléfono: ${contactPhone}`);
  if (shippingReference) lines.push(`Referencia: ${shippingReference}`);

  return lines.join("\n");
};

const buildItemsText = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Productos: detalle no disponible";
  }

  return [
    "Productos:",
    ...items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || item.unit_price || 0);
      const subtotal = Number(item.subtotal || quantity * unitPrice);
      return `- ${item.productName || item.product_name || "Producto"} x ${quantity} — ${formatCurrencyArs(subtotal)}`;
    }),
  ].join("\n");
};

const buildOrderBaseText = ({
  orderId,
  buyerName,
  buyerEmail,
  total,
  paymentMethod,
  status,
  ...order
}) =>
  [
    `Pedido: #${orderId}`,
    `Cliente: ${buyerName || "N/A"}`,
    `Email: ${buyerEmail || "N/A"}`,
    `Total: ${formatCurrencyArs(total)}`,
    `Método de pago: ${paymentMethod || "N/A"}`,
    `Estado: ${status || "N/A"}`,
    "",
    buildDeliveryText(order),
    "",
    buildItemsText(order.items),
  ].join("\n");

const createEmailService = ({ resendClient, fromEmail, adminRecipients = [] }) => {
  const isConfigured = Boolean(resendClient && fromEmail);

  const send = async ({ to, subject, text }) => {
    if (!isConfigured) {
      console.warn("[Email] Servicio no configurado. Se omite envío.", {
        hasResendClient: Boolean(resendClient),
        hasFromEmail: Boolean(fromEmail),
        to,
        subject,
      });
      return { skipped: true, reason: "email_service_not_configured" };
    }

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return { skipped: true, reason: "missing_recipient" };
    }

    const response = await resendClient.emails.send({
      from: fromEmail,
      to,
      subject,
      text,
    });

    return response;
  };

  const sendNewOrderForAdmin = async ({ order }) => {
    if (!adminRecipients.length) {
      return { skipped: true, reason: "missing_admin_recipients" };
    }

    return send({
      to: adminRecipients,
      subject: `Nuevo pedido recibido #${order.orderId}`,
      text: [
        "Se recibió un nuevo pedido.",
        order.paymentMethod === "mercadopago" && order.status !== "paid"
          ? "Importante: el pago con Mercado Pago todavía no está confirmado. No preparar como pagado hasta que la orden pase a paid."
          : null,
        "",
        buildOrderBaseText(order),
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });
  };

  const sendCashOrderReceivedEmail = async ({ order }) => {
    if (!order.buyerEmail) {
      return { skipped: true, reason: "missing_customer_email" };
    }

    return send({
      to: order.buyerEmail,
      subject: `Recibimos tu pedido #${order.orderId}`,
      text: [
        `Hola ${order.buyerName || ""},`,
        "",
        "Recibimos tu pedido. El pago queda pendiente y se realiza al retirar.",
        "",
        buildOrderBaseText({ ...order, status: "pending" }),
      ].join("\n"),
    });
  };

  const sendPaymentConfirmedEmail = async ({ order, paymentId }) => {
    if (!order.buyerEmail) {
      return { skipped: true, reason: "missing_customer_email" };
    }

    return send({
      to: order.buyerEmail,
      subject: `Pago confirmado para tu pedido #${order.orderId}`,
      text: [
        `Hola ${order.buyerName || ""},`,
        "",
        "¡Tu pago con Mercado Pago fue confirmado!",
        "Tu pedido ya figura como pagado.",
        "",
        buildOrderBaseText({ ...order, status: "paid" }),
        paymentId ? `Referencia de pago: ${paymentId}` : null,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    });
  };

  return {
    sendNewOrderForAdmin,
    sendCashOrderReceivedEmail,
    sendPaymentConfirmedEmail,
    sendCashPendingToCustomer: sendCashOrderReceivedEmail,
    sendMercadoPagoApprovedToCustomer: sendPaymentConfirmedEmail,
  };
};

module.exports = createEmailService;
