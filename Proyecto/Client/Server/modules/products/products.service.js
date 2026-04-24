const normalizeString = (value) => String(value || "").trim();

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizePrice = (price) => {
  const parsed = Number(price);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw { status: 400, payload: { error: "price debe ser un número mayor o igual a 0" } };
  }

  return Number(parsed.toFixed(2));
};

const normalizeStock = (stock) => {
  const parsed = Number(stock);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw { status: 400, payload: { error: "stock debe ser un entero mayor o igual a 0" } };
  }

  return parsed;
};

const normalizeImageUrl = (image, { required = false } = {}) => {
  const normalized = normalizeOptionalString(image);

  if (!normalized) {
    if (required) {
      throw { status: 400, payload: { error: "imageUrl es obligatorio y no puede estar vacío" } };
    }

    return "";
  }

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid");
    }
    return normalized;
  } catch {
    throw { status: 400, payload: { error: "imageUrl debe ser una URL válida" } };
  }
};

const normalizeCategory = (category) => {
  const normalized = normalizeString(category).toLowerCase();
  if (!normalized) {
    throw { status: 400, payload: { error: "category es obligatorio" } };
  }
  return normalized;
};

const normalizeActive = (active, fallback = true) => {
  if (active === undefined || active === null) return fallback;
  if (typeof active === "boolean") return active;

  throw { status: 400, payload: { error: "active debe ser boolean" } };
};

const validateAndBuildPayload = (input, fallback = {}, { requireImage = false } = {}) => {
  const name = normalizeString(input.name ?? fallback.name);
  if (!name) {
    throw { status: 400, payload: { error: "name es obligatorio" } };
  }

  return {
    name,
    description: normalizeOptionalString(input.description ?? fallback.description),
    price: normalizePrice(input.price ?? fallback.price),
    category: normalizeCategory(input.category ?? fallback.category),
    image: normalizeImageUrl(input.image ?? input.imageUrl ?? fallback.image, {
      required: requireImage,
    }),
    stock: normalizeStock(input.stock ?? fallback.stock),
    active: normalizeActive(input.active, fallback.active ?? true),
  };
};

const createProductsService = (productsRepository) => ({
  getPublicProducts: async () => productsRepository.getPublic(),

  getAdminProducts: async () => productsRepository.getAllForAdmin(),

  createProduct: async (input) => {
    const payload = validateAndBuildPayload(input, { stock: 0, active: true }, {
      requireImage: true,
    });
    return productsRepository.create(payload);
  },

  updateProduct: async (id, input) => {
    const existingProduct = await productsRepository.getById(id);
    if (!existingProduct) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    const payload = validateAndBuildPayload(input, existingProduct, {
      requireImage: true,
    });
    return productsRepository.updateById({ id, ...payload });
  },

  deleteOrDeactivateProduct: async (id) => {
    const product = await productsRepository.getById(id);
    if (!product) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    const hasOrders = await productsRepository.hasOrdersByProductId(id);

    if (hasOrders) {
      const updated = await productsRepository.updateById({
        id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        image: product.image,
        stock: product.stock,
        active: false,
      });

      return {
        mode: "deactivated",
        product: updated,
      };
    }

    const deleted = await productsRepository.deleteById(id);
    return {
      mode: "deleted",
      product: deleted,
    };
  },
});

module.exports = createProductsService;
