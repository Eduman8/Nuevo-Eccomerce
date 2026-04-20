const authService = require("./auth.service");

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "credential requerido" });
    }

    const result = await authService.loginWithGoogle(credential);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { googleLogin };
