const createNotificationService = ({ emailService }) => {
  const runSafely = async (label, fn, meta = {}) => {
    try {
      return await fn();
    } catch (error) {
      console.error(`[Notification] ${label} failed`, {
        message: error.message,
        stack: error.stack,
        ...meta,
      });

      return { ok: false, error: error.message };
    }
  };

  return {
    notifyOrderCreatedForAdmin: async ({ order }) =>
      runSafely(
        "notifyOrderCreatedForAdmin",
        () => emailService.sendNewOrderForAdmin({ order }),
        { orderId: order?.orderId },
      ),

    notifyCashPendingForCustomer: async ({ order }) =>
      runSafely(
        "notifyCashPendingForCustomer",
        () => emailService.sendCashPendingToCustomer({ order }),
        { orderId: order?.orderId, buyerEmail: order?.buyerEmail },
      ),

    notifyMercadoPagoApprovedForCustomer: async ({ order, paymentId }) =>
      runSafely(
        "notifyMercadoPagoApprovedForCustomer",
        () => emailService.sendMercadoPagoApprovedToCustomer({ order, paymentId }),
        { orderId: order?.orderId, buyerEmail: order?.buyerEmail, paymentId },
      ),
  };
};

module.exports = createNotificationService;
