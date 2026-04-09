const createCartService = (cartRepository) => ({
  addToCart: async ({ userId, productId, quantity }) => {
    const existing = await cartRepository.getExistingItem({ userId, productId });

    if (existing.length > 0) {
      return cartRepository.increaseQuantity({ quantity, userId, productId });
    }

    return cartRepository.createItem({ userId, productId, quantity });
  },

  getCartByUser: async (userId) => cartRepository.getByUserId(userId),

  deleteCartItem: async (id) => {
    await cartRepository.deleteById(id);
  },

  decreaseCartItem: async (id) => {
    const item = await cartRepository.getItemById(id);

    if (!item) {
      throw { status: 404, payload: { error: "Item no encontrado" } };
    }

    if (item.quantity <= 1) {
      await cartRepository.deleteById(id);
      return { message: "Item eliminado del carrito" };
    }

    return cartRepository.decreaseQuantityById(id);
  },

  clearCartByUser: async (userId) => {
    await cartRepository.deleteByUserId(userId);
  },
});

module.exports = createCartService;
