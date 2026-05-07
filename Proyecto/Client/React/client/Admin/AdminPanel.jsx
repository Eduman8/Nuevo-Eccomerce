import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNotification } from "../Notifications/NotificationProvider";
import {
  buildAuthHeaders,
  clearStoredAuth,
  isUnauthorizedResponse,
  SESSION_EXPIRED_MESSAGE,
} from "../utils/authSession";
import "./AdminPanel.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const emptyImages = ["", "", ""];

const initialForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  images: [...emptyImages],
  stock: "0",
  active: true,
};

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const getProductImages = (product = {}) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const fallbackImage = product.image_url || product.image || "";
  const normalizedImages = images
    .map((image) => String(image || "").trim())
    .filter(Boolean);

  if (normalizedImages.length > 0) {
    return normalizedImages.slice(0, 3);
  }

  return fallbackImage ? [String(fallbackImage).trim()] : [];
};

const toImageInputs = (images = []) => {
  const normalizedImages = images
    .map((image) => String(image || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return [...normalizedImages, ...emptyImages].slice(0, 3);
};

const normalizeImageInputs = (images = []) =>
  images
    .map((image) => String(image || "").trim())
    .filter(Boolean);

const imageFieldLabels = [
  "Imagen principal",
  "Imagen secundaria (opcional)",
  "Imagen terciaria (opcional)",
];

function AdminProductsPage({ onSessionExpired }) {
  const [products, setProducts] = useState([]);
  const [draftsById, setDraftsById] = useState({});
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingById, setSavingById] = useState({});
  const [deletingById, setDeletingById] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const { success, warning, error: notifyError, info } = useNotification();

  const notifySessionExpired = () => {
    clearStoredAuth();
    onSessionExpired?.();
    warning(SESSION_EXPIRED_MESSAGE);
  };

  const withAdminAuth = ({ includeJson = false, headers = {} } = {}) =>
    buildAuthHeaders({
      ...(includeJson ? { "Content-Type": "application/json" } : {}),
      ...headers,
    });

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError("");

    try {
      const response = await fetch(`${API_BASE_URL}/categories/admin`, {
        headers: withAdminAuth(),
      });
      const payload = await response.json().catch(() => []);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        setCategories([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudieron cargar las categorías.");
      }

      setCategories(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error(error);
      setCategories([]);
      setCategoriesError(error.message || "No se pudieron cargar las categorías.");
      notifyError(error.message || "No se pudieron cargar las categorías.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin`, {
        headers: withAdminAuth(),
      });

      const payload = await response.json().catch(() => []);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        setProducts([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudieron cargar los productos.");
      }

      const normalized = Array.isArray(payload) ? payload : [];
      setProducts(normalized);
      setDraftsById(
        normalized.reduce((acc, product) => {
          acc[product.id] = {
            name: product.name || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            categoryId: String(product.category_id || ""),
            images: toImageInputs(getProductImages(product)),
            stock: String(product.stock ?? 0),
            active: Boolean(product.active),
          };
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "No se pudieron cargar los productos.");
      notifyError(error.message || "No se pudieron cargar los productos.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreateImageChange = (index, value) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const handleDraftChange = (productId, event) => {
    const { name, value, type, checked } = event.target;
    setDraftsById((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleDraftImageChange = (productId, index, value) => {
    setDraftsById((prev) => {
      const draft = prev[productId] || {};
      const images = [...(draft.images || emptyImages)];
      images[index] = value;

      return {
        ...prev,
        [productId]: {
          ...draft,
          images,
        },
      };
    });
  };

  const summary = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const noStock = products.filter((p) => Number(p.stock || 0) <= 0).length;

    return { total, active, inactive: total - active, noStock };
  }, [products]);

  const createProduct = async (event) => {
    event.preventDefault();

    const normalizedImages = normalizeImageInputs(form.images);

    if (!form.categoryId) {
      notifyError("Seleccioná una categoría para crear el producto.");
      return;
    }

    if (normalizedImages.length === 0) {
      notifyError("La imagen principal es obligatoria para crear un producto.");
      return;
    }

    if (normalizedImages.some((image) => !isValidHttpUrl(image))) {
      notifyError("Todas las imágenes deben ser URLs válidas (http/https).");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin`, {
        method: "POST",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify({
          ...form,
          image: normalizedImages[0],
          images: normalizedImages,
          categoryId: form.categoryId,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo crear el producto.");
      }

      success("Producto creado correctamente.");
      setForm(initialForm);
      await loadProducts();
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo crear el producto.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveProduct = async (productId) => {
    const draft = draftsById[productId] || {};
    const normalizedImages = normalizeImageInputs(draft.images || emptyImages);

    if (!draft.categoryId) {
      notifyError("Seleccioná una categoría para guardar el producto.");
      return;
    }

    if (normalizedImages.length === 0) {
      notifyError("La imagen principal no puede quedar vacía al editar el producto.");
      return;
    }

    if (normalizedImages.some((image) => !isValidHttpUrl(image))) {
      notifyError("Todas las imágenes deben ser URLs válidas (http/https).");
      return;
    }

    setSavingById((prev) => ({ ...prev, [productId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin/${productId}`, {
        method: "PATCH",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify({
          ...draft,
          image: normalizedImages[0],
          images: normalizedImages,
          categoryId: draft.categoryId,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar el producto.");
      }

      setProducts((prev) => prev.map((product) => (product.id === productId ? payload : product)));
      setDraftsById((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          images: toImageInputs(getProductImages(payload || {})),
        },
      }));
      success(`Producto #${productId} actualizado.`);
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo guardar el producto.");
    } finally {
      setSavingById((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const deleteOrDeactivate = async (product) => {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar o desactivar ${product.name}?`,
    );
    if (!confirmed) {
      info("Operación cancelada.");
      return;
    }

    setDeletingById((prev) => ({ ...prev, [product.id]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin/${product.id}`, {
        method: "DELETE",
        headers: withAdminAuth(),
      });

      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo eliminar el producto.");
      }

      success(payload?.message || "Producto actualizado.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo eliminar el producto.");
    } finally {
      setDeletingById((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <h1>Administración de productos</h1>
          <p>Gestioná catálogo, stock, precios y estado sin afectar pedidos históricos.</p>
        </div>
        <div className="admin-products-header-actions">
          <Link to="/admin/categories" className="admin-products-link">
            Ir a categorías
          </Link>
          <Link to="/admin/orders" className="admin-products-link">
            Ir a pedidos
          </Link>
        </div>
      </header>

      <div className="admin-products-kpis">
        <span>Total: {summary.total}</span>
        <span>Activos: {summary.active}</span>
        <span>Inactivos: {summary.inactive}</span>
        <span>Sin stock: {summary.noStock}</span>
      </div>

      <form className="admin-products-create" onSubmit={createProduct}>
        <h2>Crear producto</h2>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleCreateChange} required />
        <input name="price" type="number" min="0" step="0.01" placeholder="Precio" value={form.price} onChange={handleCreateChange} required />
        <input name="stock" type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={handleCreateChange} required />
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleCreateChange}
          required
          disabled={loadingCategories || categories.length === 0}
        >
          <option value="">{loadingCategories ? "Cargando categorías..." : "Seleccioná categoría"}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id} disabled={!category.active}>
              {category.name}{!category.active ? " (inactiva)" : ""}
            </option>
          ))}
        </select>
        <div className="admin-image-fields">
          {imageFieldLabels.map((label, index) => (
            <label key={label} className="admin-image-field">
              <span>{label}</span>
              <input
                type="url"
                placeholder={index === 0 ? "https://frente.jpg" : "https://opcional.jpg"}
                value={form.images[index] || ""}
                onChange={(event) => handleCreateImageChange(index, event.target.value)}
                required={index === 0}
              />
            </label>
          ))}
        </div>
        <div className="admin-image-previews" aria-label="Vista previa de imágenes del producto">
          {normalizeImageInputs(form.images).map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt={`Vista previa ${index + 1}`} />
          ))}
        </div>
        <textarea name="description" placeholder="Descripción" value={form.description} onChange={handleCreateChange} rows={2} />
        <label className="admin-checkbox">
          <input type="checkbox" name="active" checked={form.active} onChange={handleCreateChange} />
          Producto activo
        </label>
        <button type="submit" disabled={submitting || loadingCategories || categories.length === 0}>
          {submitting ? "Guardando..." : "Crear producto"}
        </button>
      </form>

      {loadingCategories && <p className="admin-state">Cargando categorías...</p>}
      {!loadingCategories && categoriesError && <p className="admin-state admin-state-error">{categoriesError}</p>}
      {!loadingCategories && !categoriesError && categories.length === 0 && <p className="admin-state">No hay categorías para asociar productos.</p>}

      {loading && <p className="admin-state">Cargando productos...</p>}
      {!loading && errorMessage && <p className="admin-state admin-state-error">{errorMessage}</p>}
      {!loading && !errorMessage && products.length === 0 && <p className="admin-state">No hay productos.</p>}

      {!loading && !errorMessage && products.length > 0 && (
        <div className="admin-products-list">
          {products.map((product) => {
            const draft = draftsById[product.id] || {};
            const draftImages = draft.images || toImageInputs(getProductImages(product));
            const previewImage = normalizeImageInputs(draftImages)[0] || "https://via.placeholder.com/120x120?text=Sin+Imagen";
            const hasStock = Number(draft.stock ?? product.stock ?? 0) > 0;
            const isActive = Boolean(draft.active);

            return (
              <article key={product.id} className="admin-product-row">
                <img src={previewImage} alt={draft.name || product.name} />
                <div className="admin-product-fields">
                  <div className="admin-product-title-row">
                    <h3>{draft.name || product.name}</h3>
                    {!isActive && <span className="badge badge-inactive">Inactivo</span>}
                    {!hasStock && <span className="badge badge-stock">Sin stock</span>}
                  </div>

                  <div className="admin-product-grid">
                    <input name="name" value={draft.name || ""} onChange={(event) => handleDraftChange(product.id, event)} />
                    <input name="price" type="number" min="0" step="0.01" value={draft.price || ""} onChange={(event) => handleDraftChange(product.id, event)} />
                    <input name="stock" type="number" min="0" step="1" value={draft.stock || "0"} onChange={(event) => handleDraftChange(product.id, event)} />
                    <select
                      name="categoryId"
                      value={draft.categoryId || ""}
                      onChange={(event) => handleDraftChange(product.id, event)}
                      disabled={loadingCategories || categories.length === 0}
                    >
                      <option value="">Categoría sin asociar</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} disabled={!category.active}>
                          {category.name}{!category.active ? " (inactiva)" : ""}
                        </option>
                      ))}
                    </select>
                    <div className="admin-image-fields admin-image-fields--compact">
                      {imageFieldLabels.map((label, index) => (
                        <label key={label} className="admin-image-field">
                          <span>{label}</span>
                          <input
                            type="url"
                            value={draftImages[index] || ""}
                            placeholder={index === 0 ? "https://frente.jpg" : "https://opcional.jpg"}
                            onChange={(event) => handleDraftImageChange(product.id, index, event.target.value)}
                            required={index === 0}
                          />
                        </label>
                      ))}
                    </div>
                    <textarea name="description" rows={2} value={draft.description || ""} onChange={(event) => handleDraftChange(product.id, event)} />
                    <label className="admin-checkbox">
                      <input type="checkbox" name="active" checked={isActive} onChange={(event) => handleDraftChange(product.id, event)} />
                      Activo
                    </label>
                  </div>
                </div>

                <div className="admin-product-actions">
                  <button type="button" onClick={() => saveProduct(product.id)} disabled={Boolean(savingById[product.id] || deletingById[product.id])}>
                    {savingById[product.id] ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => deleteOrDeactivate(product)}
                    disabled={Boolean(deletingById[product.id] || savingById[product.id])}
                  >
                    {deletingById[product.id] ? "Procesando..." : "Eliminar / desactivar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminProductsPage;
