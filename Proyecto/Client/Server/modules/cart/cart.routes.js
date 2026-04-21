const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createCartRepository = require("./cart.repository");
const createCartService = require("./cart.service");
const createCartController = require("./cart.controller");

const createCartRouter = ({ pool }) => {
  const router = express.Router();
  const cartRepository = createCartRepository(pool);
  const cartService = createCartService(cartRepository);
  const cartController = createCartController(cartService);

  router.post("/", asyncHandler(cartController.createCartItem));
  router.get("/user/:userId", asyncHandler(cartController.getCartByUser));
  router.delete("/:id", asyncHandler(cartController.deleteCartItem));
  router.patch("/:id/decrease", asyncHandler(cartController.decreaseCartItem));
  router.delete("/user/:userId", asyncHandler(cartController.clearCartByUser));

  return router;
};

module.exports = createCartRouter;
