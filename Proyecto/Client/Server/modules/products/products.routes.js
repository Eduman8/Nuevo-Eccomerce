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

  router.get("/", asyncHandler(productsController.getPublicProducts));

  router.get(
    "/admin",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.getAdminProducts),
  );

  router.post(
    "/admin",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.createProduct),
  );

  router.patch(
    "/admin/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.updateProduct),
  );

  router.delete(
    "/admin/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.removeProduct),
  );

  return router;
};

module.exports = createProductsRouter;
