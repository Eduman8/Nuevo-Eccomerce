const normalizeString = (value) => String(value || "").trim();

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeImageUrl = (imageUrl) => {
  const normalized = normalizeOptionalString(imageUrl);

  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid");
    }
    return normalized;
  } catch {
    throw { status: 400, payload: { error: "image_url debe ser una URL válida" } };
  }
};

const normalizeActive = (active, fallback = true) => {
  if (active === undefined || active === null) return fallback;
  if (typeof active === "boolean") return active;

  throw { status: 400, payload: { error: "active debe ser boolean" } };
};

const validateAndBuildPayload = (input, fallback = {}) => {
  const name = normalizeString(input.name ?? fallback.name);

  if (!name) {
    throw { status: 400, payload: { error: "name es obligatorio" } };
  }

  return {
    name,
    imageUrl: normalizeImageUrl(input.image_url ?? input.imageUrl ?? fallback.image_url),
    active: normalizeActive(input.active, fallback.active ?? true),
  };
};

const createCategoriesService = (categoriesRepository) => ({
  getPublicCategories: async () => categoriesRepository.getActive(),

  getAdminCategories: async () => categoriesRepository.getAllForAdmin(),

  createCategory: async (input) => {
    const payload = validateAndBuildPayload(input, { active: true });
    return categoriesRepository.create(payload);
  },

  updateCategory: async (id, input) => {
    const existingCategory = await categoriesRepository.getById(id);
    if (!existingCategory) {
      throw { status: 404, payload: { error: "Categoría no encontrada" } };
    }

    const payload = validateAndBuildPayload(input, existingCategory);
    return categoriesRepository.updateById({ id, ...payload });
  },

  deactivateCategory: async (id) => {
    const category = await categoriesRepository.deactivateById(id);
    if (!category) {
      throw { status: 404, payload: { error: "Categoría no encontrada" } };
    }

    return category;
  },
});

module.exports = createCategoriesService;
