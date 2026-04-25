const formatCurrencyArs = (amount) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const buildOrderBaseText = ({ orderId, buyerName, buyerEmail, total, paymentMethod, status }) =>
  [
    `Orden: #${orderId}`,
    `Cliente: ${buyerName || "N/A"}`,
    `Email: ${buyerEmail || "N/A"}`,
    `Total: ${formatCurrencyArs(total)}`,
    `Método de pago: ${paymentMethod || "N/A"}`,
    `Estado: ${status || "N/A"}`,
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
      subject: `Nueva compra recibida #${order.orderId}`,
      text: `Se creó una nueva compra válida.\n\n${buildOrderBaseText(order)}`,
    });
  };

  const sendCashPendingToCustomer = async ({ order }) => {
    if (!order.buyerEmail) {
      return { skipped: true, reason: "missing_customer_email" };
    }

    return send({
      to: order.buyerEmail,
      subject: `Recibimos tu pedido #${order.orderId}`,
      text: [
        `Hola ${order.buyerName || ""},`,
        "",
        "Recibimos tu pedido en efectivo y quedó pendiente de confirmación.",
        "Te avisaremos cuando se confirme.",
        "",
        buildOrderBaseText(order),
      ].join("\n"),
    });
  };

  const sendMercadoPagoApprovedToCustomer = async ({ order, paymentId }) => {
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
        "Tu compra ya figura como pagada.",
        "",
        buildOrderBaseText({ ...order, status: "paid" }),
        `Referencia de pago: ${paymentId}`,
      ].join("\n"),
    });
  };

  return {
    sendNewOrderForAdmin,
    sendCashPendingToCustomer,
    sendMercadoPagoApprovedToCustomer,
  };
};

module.exports = createEmailService;
