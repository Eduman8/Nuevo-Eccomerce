const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createAuthRepository = require("./auth.repository");
const createAuthService = require("./auth.service");
const createAuthController = require("./auth.controller");

const createAuthRouter = ({ pool, isAdminEmail }) => {
  const router = express.Router();
  const authRepository = createAuthRepository(pool);
  const authService = createAuthService({ authRepository, isAdminEmail });
  const authController = createAuthController(authService);

  router.post("/auth/google", asyncHandler(authController.authWithGoogle));

  return router;
};

module.exports = createAuthRouter;
