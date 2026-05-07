const { createHttpError } = require("../../utils/httpError");

const handleServiceError = (next, error, fallbackMessage) => {
  if (error.status) {
    return next(
      createHttpError({
        status: error.status,
        payload: error.payload || { error: error.message || fallbackMessage },
      }),
    );
  }

  return next(
    createHttpError({
      status: 500,
      payload: { error: fallbackMessage },
      logError: error,
    }),
  );
};

const createCategoriesController = (categoriesService) => ({
  getPublicCategories: async (req, res, next) => {
    try {
      const categories = await categoriesService.getPublicCategories();
      res.json(categories);
    } catch (error) {
      handleServiceError(next, error, "Error al listar categorías");
    }
  },

  getAdminCategories: async (req, res, next) => {
    try {
      const categories = await categoriesService.getAdminCategories();
      res.json(categories);
    } catch (error) {
      handleServiceError(next, error, "Error al listar categorías para admin");
    }
  },

  createCategory: async (req, res, next) => {
    try {
      const category = await categoriesService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      handleServiceError(next, error, "Error al crear categoría");
    }
  },

  updateCategory: async (req, res, next) => {
    try {
      const category = await categoriesService.updateCategory(req.params.id, req.body);
      res.json(category);
    } catch (error) {
      handleServiceError(next, error, "Error al actualizar categoría");
    }
  },

  removeCategory: async (req, res, next) => {
    try {
      const category = await categoriesService.deactivateCategory(req.params.id);
      res.json({
        message: "Categoría desactivada",
        mode: "deactivated",
        category,
      });
    } catch (error) {
      handleServiceError(next, error, "Error al desactivar categoría");
    }
  },
});

module.exports = createCategoriesController;
