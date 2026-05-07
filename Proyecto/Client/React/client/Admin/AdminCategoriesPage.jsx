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
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/120x120?text=Sin+Imagen";

const initialForm = {
  name: "",
  image_url: "",
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

function AdminCategoriesPage({ onSessionExpired }) {
  const [categories, setCategories] = useState([]);
  const [draftsById, setDraftsById] = useState({});
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingById, setSavingById] = useState({});
  const [deletingById, setDeletingById] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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

  const handleForbidden = () => {
    const message = "No tenés permisos de administrador para gestionar categorías.";
    setErrorMessage(message);
    notifyError(message);
  };

  const normalizeCategories = (payload) => (Array.isArray(payload) ? payload : []);

  const syncDrafts = (items) => {
    setDraftsById(
      items.reduce((acc, category) => {
        acc[category.id] = {
          name: category.name || "",
          image_url: category.image_url || "",
          active: Boolean(category.active),
        };
        return acc;
      }, {}),
    );
  };

  const loadCategories = async () => {
    setLoading(true);
    setErrorMessage("");

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

      if (response.status === 403) {
        handleForbidden();
        setCategories([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudieron cargar las categorías.");
      }

      const normalized = normalizeCategories(payload);
      setCategories(normalized);
      syncDrafts(normalized);
    } catch (error) {
      console.error(error);
      setCategories([]);
      setErrorMessage(error.message || "No se pudieron cargar las categorías.");
      notifyError(error.message || "No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const summary = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((category) => category.active).length;
    return { total, active, inactive: total - active };
  }, [categories]);

  const validateImageUrl = (imageUrl) => {
    const normalizedImage = String(imageUrl || "").trim();

    if (normalizedImage && !isValidHttpUrl(normalizedImage)) {
      notifyError("La imagen debe ser una URL válida (http/https) o quedar vacía.");
      return null;
    }

    return normalizedImage;
  };

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDraftChange = (categoryId, event) => {
    const { name, value, type, checked } = event.target;
    setDraftsById((prev) => ({
      ...prev,
      [categoryId]: {
        ...(prev[categoryId] || {}),
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const createCategory = async (event) => {
    event.preventDefault();

    const name = String(form.name || "").trim();
    const imageUrl = validateImageUrl(form.image_url);

    if (!name) {
      notifyError("El nombre es obligatorio para crear una categoría.");
      return;
    }

    if (imageUrl === null) return;

    setSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/categories/admin`, {
        method: "POST",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify({ name, image_url: imageUrl, active: form.active }),
      });
      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (response.status === 403) {
        handleForbidden();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo crear la categoría.");
      }

      const message = "Categoría creada correctamente.";
      setSuccessMessage(message);
      success(message);
      setForm(initialForm);
      await loadCategories();
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo crear la categoría.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveCategory = async (categoryId) => {
    const draft = draftsById[categoryId] || {};
    const name = String(draft.name || "").trim();
    const imageUrl = validateImageUrl(draft.image_url);

    if (!name) {
      notifyError("El nombre de la categoría no puede quedar vacío.");
      return;
    }

    if (imageUrl === null) return;

    setSavingById((prev) => ({ ...prev, [categoryId]: true }));
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/categories/admin/${categoryId}`, {
        method: "PATCH",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify({ name, image_url: imageUrl, active: Boolean(draft.active) }),
      });
      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (response.status === 403) {
        handleForbidden();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar la categoría.");
      }

      setCategories((prev) => prev.map((category) => (category.id === categoryId ? payload : category)));
      setDraftsById((prev) => ({
        ...prev,
        [categoryId]: {
          name: payload.name || "",
          image_url: payload.image_url || "",
          active: Boolean(payload.active),
        },
      }));
      const message = `Categoría #${categoryId} actualizada.`;
      setSuccessMessage(message);
      success(message);
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo guardar la categoría.");
    } finally {
      setSavingById((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  const deleteOrDeactivate = async (category) => {
    const confirmed = window.confirm(`¿Seguro que querés desactivar ${category.name}?`);
    if (!confirmed) {
      info("Operación cancelada.");
      return;
    }

    setDeletingById((prev) => ({ ...prev, [category.id]: true }));
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/categories/admin/${category.id}`, {
        method: "DELETE",
        headers: withAdminAuth(),
      });
      const payload = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (response.status === 403) {
        handleForbidden();
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo desactivar la categoría.");
      }

      const updatedCategory = payload?.category;
      if (updatedCategory) {
        setCategories((prev) =>
          prev.map((item) => (item.id === category.id ? updatedCategory : item)),
        );
        setDraftsById((prev) => ({
          ...prev,
          [category.id]: {
            name: updatedCategory.name || "",
            image_url: updatedCategory.image_url || "",
            active: Boolean(updatedCategory.active),
          },
        }));
      }

      const message = payload?.message || "Categoría desactivada.";
      setSuccessMessage(message);
      success(message);
    } catch (error) {
      console.error(error);
      notifyError(error.message || "No se pudo desactivar la categoría.");
    } finally {
      setDeletingById((prev) => ({ ...prev, [category.id]: false }));
    }
  };

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <h1>Administración de categorías</h1>
          <p>Gestioná nombre, imagen y estado de las categorías del catálogo.</p>
        </div>
        <div className="admin-products-header-actions">
          <Link to="/admin" className="admin-products-link">
            Ir a productos
          </Link>
          <Link to="/admin/orders" className="admin-products-link">
            Ir a pedidos
          </Link>
        </div>
      </header>

      <div className="admin-products-kpis">
        <span>Total: {summary.total}</span>
        <span>Activas: {summary.active}</span>
        <span>Inactivas: {summary.inactive}</span>
      </div>

      <form className="admin-products-create admin-categories-create" onSubmit={createCategory}>
        <h2>Crear categoría</h2>
        <input name="name" placeholder="Nombre" value={form.name} onChange={handleCreateChange} required />
        <input name="image_url" type="url" placeholder="URL de imagen (opcional)" value={form.image_url} onChange={handleCreateChange} />
        <label className="admin-checkbox">
          <input type="checkbox" name="active" checked={form.active} onChange={handleCreateChange} />
          Categoría activa
        </label>
        <button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Crear categoría"}</button>
      </form>

      {successMessage && <p className="admin-state admin-state-success">{successMessage}</p>}
      {loading && <p className="admin-state">Cargando categorías...</p>}
      {!loading && errorMessage && <p className="admin-state admin-state-error">{errorMessage}</p>}
      {!loading && !errorMessage && categories.length === 0 && <p className="admin-state">No hay categorías creadas.</p>}

      {!loading && !errorMessage && categories.length > 0 && (
        <div className="admin-products-list">
          {categories.map((category) => {
            const draft = draftsById[category.id] || {};
            const isActive = Boolean(draft.active);
            const imageUrl = draft.image_url || PLACEHOLDER_IMAGE;

            return (
              <article key={category.id} className="admin-product-row admin-category-row">
                <img src={imageUrl} alt={draft.name || category.name || "Categoría"} />
                <div className="admin-product-fields">
                  <div className="admin-product-title-row">
                    <h3>{draft.name || category.name}</h3>
                    {!isActive && <span className="badge badge-inactive">Inactiva</span>}
                  </div>

                  <div className="admin-product-grid admin-category-grid">
                    <input name="name" value={draft.name || ""} onChange={(event) => handleDraftChange(category.id, event)} required />
                    <input name="image_url" type="url" value={draft.image_url || ""} placeholder="URL de imagen" onChange={(event) => handleDraftChange(category.id, event)} />
                    <label className="admin-checkbox">
                      <input type="checkbox" name="active" checked={isActive} onChange={(event) => handleDraftChange(category.id, event)} />
                      Activa
                    </label>
                  </div>
                </div>

                <div className="admin-product-actions">
                  <button type="button" onClick={() => saveCategory(category.id)} disabled={Boolean(savingById[category.id] || deletingById[category.id])}>
                    {savingById[category.id] ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => deleteOrDeactivate(category)}
                    disabled={Boolean(deletingById[category.id] || savingById[category.id] || !isActive)}
                  >
                    {deletingById[category.id] ? "Procesando..." : "Desactivar"}
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

export default AdminCategoriesPage;
