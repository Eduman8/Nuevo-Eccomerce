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

  router.get("/", asyncHandler(productsController.getProducts));
  router.post(
    "/",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.create),
  );
  router.patch(
    "/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.update),
  );
  router.delete(
    "/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(productsController.remove),
  );

  return router;
};

module.exports = createProductsRouter;
