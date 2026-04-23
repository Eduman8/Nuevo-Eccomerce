const { createHttpError } = require("../../utils/httpError");

const createCartController = (cartService) => ({
  createCartItem: async (req, res, next) => {
    const { userId, productId, quantity } = req.body;

    try {
      const item = await cartService.addToCart({ userId, productId, quantity });
      res.json(item);
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
          payload: { error: "Error en carrito" },
          logError: err,
        }),
      );
    }
  },

  getCartByUser: async (req, res, next) => {
    const { userId } = req.params;

    try {
      const items = await cartService.getCartByUser(userId);
      res.json(items);
    } catch (err) {
      return next(
        createHttpError({
          status: 500,
          payload: { error: "Error al obtener carrito" },
          logError: err,
        }),
      );
    }
  },

  deleteCartItem: async (req, res) => {
    const { id } = req.params;

    await cartService.deleteCartItem(id);

    res.send("Item eliminado del carrito");
  },

  decreaseCartItem: async (req, res, next) => {
    const { id } = req.params;

    try {
      const item = await cartService.decreaseCartItem(id);
      return res.json(item);
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
          payload: { error: "Error al actualizar carrito" },
          logError: err,
        }),
      );
    }
  },

  clearCartByUser: async (req, res) => {
    const { userId } = req.params;
    await cartService.clearCartByUser(userId);
    res.send("Carrito vaciado");
  },
});

module.exports = createCartController;
