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

const normalizeOptionalCategory = (category) => {
  const normalized = normalizeString(category);
  return normalized ? normalized.toLowerCase() : "";
};

const normalizeCategoryId = (categoryId, fallbackCategoryId) => {
  const value = categoryId ?? fallbackCategoryId;
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw { status: 400, payload: { error: "categoryId debe ser un entero positivo" } };
  }

  return parsed;
};

const normalizeActive = (active, fallback = true) => {
  if (active === undefined || active === null) return fallback;
  if (typeof active === "boolean") return active;

  throw { status: 400, payload: { error: "active debe ser boolean" } };
};

const validateAndBuildPayload = async (
  input,
  fallback = {},
  { requireImage = false, productsRepository, allowInactiveCategory = false } = {},
) => {
  const name = normalizeString(input.name ?? fallback.name);
  if (!name) {
    throw { status: 400, payload: { error: "name es obligatorio" } };
  }

  const categoryId = normalizeCategoryId(
    input.categoryId ?? input.category_id,
    fallback.category_id ?? fallback.categoryId,
  );

  let category = normalizeOptionalCategory(input.category ?? fallback.category);

  if (categoryId) {
    const categoryRecord = await productsRepository.getCategoryById(categoryId);
    if (!categoryRecord) {
      throw { status: 400, payload: { error: "categoryId no corresponde a una categoría existente" } };
    }

    if (!categoryRecord.active && !allowInactiveCategory) {
      throw { status: 400, payload: { error: "La categoría seleccionada está inactiva" } };
    }

    category = normalizeCategory(categoryRecord.name);
  } else {
    category = normalizeCategory(category);
  }

  return {
    name,
    description: normalizeOptionalString(input.description ?? fallback.description),
    price: normalizePrice(input.price ?? fallback.price),
    category,
    categoryId,
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
    const payload = await validateAndBuildPayload(input, { stock: 0, active: true }, {
      requireImage: true,
      productsRepository,
    });
    return productsRepository.create(payload);
  },

  updateProduct: async (id, input) => {
    const existingProduct = await productsRepository.getById(id);
    if (!existingProduct) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    const payload = await validateAndBuildPayload(input, existingProduct, {
      requireImage: true,
      productsRepository,
      allowInactiveCategory: true,
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
        categoryId: product.category_id,
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
