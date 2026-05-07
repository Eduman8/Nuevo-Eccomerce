const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const createCategoriesRepository = require("./categories.repository");
const createCategoriesService = require("./categories.service");
const createCategoriesController = require("./categories.controller");
const requireAuth = require("../../middlewares/requireAuth");
const requireAdmin = require("../../middlewares/requireAdmin");

const createCategoriesRouter = ({ pool }) => {
  const router = express.Router();
  const categoriesRepository = createCategoriesRepository(pool);
  const categoriesService = createCategoriesService(categoriesRepository);
  const categoriesController = createCategoriesController(categoriesService);

  router.get(
    "/admin",
    requireAuth,
    requireAdmin,
    asyncHandler(categoriesController.getAdminCategories),
  );

  router.post(
    "/admin",
    requireAuth,
    requireAdmin,
    asyncHandler(categoriesController.createCategory),
  );

  router.patch(
    "/admin/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(categoriesController.updateCategory),
  );

  router.delete(
    "/admin/:id",
    requireAuth,
    requireAdmin,
    asyncHandler(categoriesController.removeCategory),
  );

  return router;
};

module.exports = createCategoriesRouter;
