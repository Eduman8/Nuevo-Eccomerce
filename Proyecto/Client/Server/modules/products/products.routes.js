const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createProductsRepository = require("./products.repository");
const createProductsService = require("./products.service");
const createProductsController = require("./products.controller");

const createProductsRouter = ({ pool }) => {
  const router = express.Router();
  const productsRepository = createProductsRepository(pool);
  const productsService = createProductsService(productsRepository);
  const productsController = createProductsController(productsService);

  router.get("/products", asyncHandler(productsController.getProducts));
  router.post("/products", asyncHandler(productsController.createProduct));
  router.delete("/products/:id", asyncHandler(productsController.deleteProduct));
  router.patch("/products/:id", asyncHandler(productsController.updateProductCategory));

  return router;
};

module.exports = createProductsRouter;
