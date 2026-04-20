const createAuthController = (authService) => ({
  authWithGoogle: async (req, res) => {
    const { credential } = req.body || {};

    if (!credential) {
      return res.status(400).json({ error: "credential requerido" });
    }

    try {
      const result = await authService.loginWithGoogle(credential);
      return res.json(result);
    } catch (error) {
      if (error.code === "INVALID_GOOGLE_TOKEN") {
        return res.status(401).json({ error: "Token de Google inválido" });
      }

      throw error;
    }
  },
});

module.exports = createAuthController;
