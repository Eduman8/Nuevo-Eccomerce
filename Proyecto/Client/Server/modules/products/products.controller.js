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

const createProductsController = (productsService) => ({
  getPublicProducts: async (req, res, next) => {
    try {
      const products = await productsService.getPublicProducts();
      res.json(products);
    } catch (error) {
      handleServiceError(next, error, "Error al listar productos");
    }
  },

  getAdminProducts: async (req, res, next) => {
    try {
      const products = await productsService.getAdminProducts();
      res.json(products);
    } catch (error) {
      handleServiceError(next, error, "Error al listar productos para admin");
    }
  },

  createProduct: async (req, res, next) => {
    try {
      const product = await productsService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      handleServiceError(next, error, "Error al crear producto");
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const product = await productsService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      handleServiceError(next, error, "Error al actualizar producto");
    }
  },

  removeProduct: async (req, res, next) => {
    try {
      const result = await productsService.deleteOrDeactivateProduct(req.params.id);
      const message =
        result.mode === "deactivated"
          ? "Producto desactivado porque tiene pedidos asociados"
          : "Producto eliminado";

      res.json({ message, mode: result.mode, product: result.product });
    } catch (error) {
      handleServiceError(next, error, "Error al eliminar producto");
    }
  },
});

module.exports = createProductsController;
