const createProductsService = (productsRepository) => ({
  getProducts: async () => productsRepository.getAll(),

  createProduct: async ({ name, description, price, category, image, stock }) => {
    if (!name || !price || !category || !image) {
      throw {
        status: 400,
        payload: {
          error: "name, price, category e image son obligatorios",
        },
      };
    }

    return productsRepository.create({
      name: name.trim(),
      description: description?.trim() || "",
      price: Number(price),
      category: category.trim().toLowerCase(),
      image: image.trim(),
      stock: Number(stock) || 0,
    });
  },

  deleteProduct: async (id) => {
    const product = await productsRepository.deleteById(id);
    if (!product) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    return product;
  },

  updateProductCategory: async ({ id, category }) => {
    const product = await productsRepository.updateCategoryById({ id, category });
    if (!product) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    return product;
  },
});

module.exports = createProductsService;
