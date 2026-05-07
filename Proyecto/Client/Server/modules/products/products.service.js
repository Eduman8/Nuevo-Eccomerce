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

const normalizeImageUrl = (image, { required = false, fieldName = "imageUrl" } = {}) => {
  const normalized = normalizeOptionalString(image);

  if (!normalized) {
    if (required) {
      throw { status: 400, payload: { error: `${fieldName} es obligatorio y no puede estar vacío` } };
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
    throw { status: 400, payload: { error: `${fieldName} debe ser una URL válida` } };
  }
};

const normalizeImages = (images) => {
  if (images === undefined) return undefined;

  if (!Array.isArray(images)) {
    throw { status: 400, payload: { error: "images debe ser un array" } };
  }

  const normalizedImages = images
    .map((image) => normalizeOptionalString(image))
    .filter(Boolean);

  if (normalizedImages.length > 3) {
    throw { status: 400, payload: { error: "images permite un máximo de 3 imágenes" } };
  }

  return normalizedImages.map((image) =>
    normalizeImageUrl(image, { fieldName: "images" }),
  );
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

  const images = normalizeImages(input.images);
  const hasImagesInput = images !== undefined;
  const primaryImage = hasImagesInput && images.length > 0
    ? images[0]
    : input.image ?? input.imageUrl ?? input.image_url ?? fallback.image ?? fallback.image_url;

  return {
    name,
    description: normalizeOptionalString(input.description ?? fallback.description),
    price: normalizePrice(input.price ?? fallback.price),
    category,
    categoryId,
    image: normalizeImageUrl(primaryImage, {
      required: requireImage && !(hasImagesInput && images.length > 0),
    }),
    ...(hasImagesInput ? { images } : {}),
    stock: normalizeStock(input.stock ?? fallback.stock),
    active: normalizeActive(input.active, fallback.active ?? true),
  };
};

const ALLOWED_PUBLIC_SORTS = new Set([
  "newest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
]);

const getSingleQueryValue = (query, fieldName) => {
  const value = query[fieldName];
  if (Array.isArray(value)) {
    throw { status: 400, payload: { error: `${fieldName} no permite múltiples valores` } };
  }

  return value;
};

const normalizeOptionalQueryString = (query, fieldName) => {
  const value = getSingleQueryValue(query, fieldName);
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeOptionalQueryPrice = (query, fieldName) => {
  const value = getSingleQueryValue(query, fieldName);
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw { status: 400, payload: { error: `${fieldName} debe ser un número mayor o igual a 0` } };
  }

  return Number(parsed.toFixed(2));
};

const normalizeOptionalQueryCategoryId = (query) => {
  const value = getSingleQueryValue(query, "categoryId");
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw { status: 400, payload: { error: "categoryId debe ser un entero positivo" } };
  }

  return parsed;
};

const normalizeOptionalQueryBoolean = (query, fieldName) => {
  const value = getSingleQueryValue(query, fieldName);
  if (value === undefined || value === null || value === "") return false;

  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;

  throw { status: 400, payload: { error: `${fieldName} debe ser true o false` } };
};

const normalizePublicProductFilters = (query = {}) => {
  const search = normalizeOptionalQueryString(query, "search");
  const categoryId = normalizeOptionalQueryCategoryId(query);
  const minPrice = normalizeOptionalQueryPrice(query, "minPrice");
  const maxPrice = normalizeOptionalQueryPrice(query, "maxPrice");
  const inStock = normalizeOptionalQueryBoolean(query, "inStock");
  const sort = normalizeOptionalQueryString(query, "sort") || "newest";

  if (search.length > 120) {
    throw { status: 400, payload: { error: "search permite un máximo de 120 caracteres" } };
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw { status: 400, payload: { error: "minPrice no puede ser mayor que maxPrice" } };
  }

  if (!ALLOWED_PUBLIC_SORTS.has(sort)) {
    throw {
      status: 400,
      payload: {
        error: "sort inválido. Valores permitidos: newest, price_asc, price_desc, name_asc, name_desc",
      },
    };
  }

  return { search, categoryId, minPrice, maxPrice, inStock, sort };
};

const createProductsService = (productsRepository) => ({
  getPublicProducts: async (query = {}) =>
    productsRepository.getPublic(normalizePublicProductFilters(query)),

  getProductById: async (id) => {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    const product = await productsRepository.getById(productId);
    if (!product) {
      throw { status: 404, payload: { error: "Producto no encontrado" } };
    }

    return product;
  },

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
