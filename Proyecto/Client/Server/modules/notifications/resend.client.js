const createResendClient = ({ apiKey }) => {
  if (!apiKey) return null;

  return {
    emails: {
      send: async ({ from, to, subject, text }) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            text,
          }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMessage = payload?.message || `HTTP ${response.status}`;
          const error = new Error(`Resend error: ${errorMessage}`);
          error.status = response.status;
          error.payload = payload;
          throw error;
        }

        return payload;
      },
    },
  };
};

module.exports = createResendClient;
