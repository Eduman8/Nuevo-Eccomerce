const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createProductsRepository = require("./products.repository");
const createProductsService = require("./products.service");
const createProductsController = require("./products.controller");
const requireAuth = require("../../middlewares/requireAuth");
const requireAdmin = require("../../middlewares/requireAdmin");

const createProductsRouter = ({ pool }) => {
  const router = express.Router();
  const productsRepository = createProductsRepository(pool);
  const productsService = createProductsService(productsRepository);
  const productsController = createProductsController(productsService);

  router.get("/products", asyncHandler(productsController.getProducts));
  router.post("/", requireAuth, requireAdmin, controller.create);
  router.patch("/:id", requireAuth, requireAdmin, controller.update);
  router.delete("/:id", requireAuth, requireAdmin, controller.remove);

  return router;
};

module.exports = createProductsRouter;
