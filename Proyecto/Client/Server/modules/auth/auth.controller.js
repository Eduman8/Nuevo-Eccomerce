const { createHttpError } = require("../../utils/httpError");

const createAuthController = (authService) => ({
  authWithGoogle: async (req, res, next) => {
    const { name, email } = req.body;

    try {
      const user = await authService.authWithGoogle({ name, email });
      res.json(user);
    } catch (err) {
      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al autenticar con Google" },
          logError: err,
        }),
      );
    }
  },
});

module.exports = createAuthController;
