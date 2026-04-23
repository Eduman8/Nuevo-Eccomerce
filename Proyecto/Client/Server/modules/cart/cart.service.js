const createCartService = (cartRepository) => ({
  addToCart: async ({ userId, productId, quantity }) => {
    const normalizedQuantity = Math.max(Number(quantity) || 1, 1);
    const product = await cartRepository.getProductById(productId);

    if (!product) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    const availableStock = Number(product.stock || 0);

    if (availableStock <= 0) {
      throw { status: 409, payload: { error: "Producto agotado" } };
    }

    const existing = await cartRepository.getExistingItem({ userId, productId });

    if (existing.length > 0) {
      const currentQuantity = Number(existing[0].quantity || 0);
      const requestedQuantity = currentQuantity + normalizedQuantity;

      if (requestedQuantity > availableStock) {
        throw {
          status: 409,
          payload: {
            error: `Stock insuficiente. Disponible: ${availableStock}`,
          },
        };
      }

      return cartRepository.increaseQuantity({
        quantity: normalizedQuantity,
        userId,
        productId,
      });
    }

    if (normalizedQuantity > availableStock) {
      throw {
        status: 409,
        payload: {
          error: `Stock insuficiente. Disponible: ${availableStock}`,
        },
      };
    }

    return cartRepository.createItem({ userId, productId, quantity: normalizedQuantity });
  },

  getCartByUser: async (userId) => {
    const items = await cartRepository.getByUserId(userId);

    for (const item of items) {
      const stock = Number(item.stock || 0);
      const quantity = Number(item.quantity || 0);

      if (stock <= 0) {
        await cartRepository.deleteById(item.id);
        continue;
      }

      if (quantity > stock) {
        await cartRepository.updateQuantityById({ id: item.id, quantity: stock });
      }
    }

    return cartRepository.getByUserId(userId);
  },

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
