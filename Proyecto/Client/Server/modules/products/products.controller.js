const { createHttpError } = require("../../utils/httpError");

const createProductsController = (productsService) => ({
  getProducts: async (req, res) => {
    const products = await productsService.getProducts();
    res.json(products);
  },

  createProduct: async (req, res, next) => {
    try {
      const product = await productsService.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      if (err.status) {
        return next(
          createHttpError({
            status: err.status,
            payload: err.payload,
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al crear producto" },
          logError: err,
        }),
      );
    }
  },

  deleteProduct: async (req, res, next) => {
    const { id } = req.params;

    try {
      const product = await productsService.deleteProduct(id);
      res.json({ message: "Producto eliminado", product });
    } catch (err) {
      if (err.status) {
        return next(
          createHttpError({
            status: err.status,
            payload: err.payload,
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al eliminar producto" },
          logError: err,
        }),
      );
    }
  },

  updateProductCategory: async (req, res, next) => {
    const { id } = req.params;
    const { category } = req.body;

    try {
      const product = await productsService.updateProductCategory({ id, category });
      res.json(product);
    } catch (err) {
      if (err.status) {
        return next(
          createHttpError({
            status: err.status,
            payload: err.payload,
          }),
        );
      }

      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al actualizar producto" },
          logError: err,
        }),
      );
    }
  },
});

module.exports = createProductsController;
