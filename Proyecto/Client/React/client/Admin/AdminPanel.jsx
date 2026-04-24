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

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: "0",
  active: true,
};

function AdminProductsPage({ onSessionExpired }) {
  const [products, setProducts] = useState([]);
  const [draftsById, setDraftsById] = useState({});
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingById, setSavingById] = useState({});
  const [deletingById, setDeletingById] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
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
            category: product.category || "",
            image: product.image || "",
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
    loadProducts();
  }, []);

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

  const summary = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const noStock = products.filter((p) => Number(p.stock || 0) <= 0).length;

    return { total, active, inactive: total - active, noStock };
  }, [products]);

  const createProduct = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin`, {
        method: "POST",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify(form),
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
    setSavingById((prev) => ({ ...prev, [productId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/products/admin/${productId}`, {
        method: "PATCH",
        headers: withAdminAuth({ includeJson: true }),
        body: JSON.stringify(draftsById[productId]),
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
        <Link to="/admin/orders" className="admin-products-link">
          Ir a pedidos
        </Link>
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
        <input name="category" placeholder="Categoría" value={form.category} onChange={handleCreateChange} required />
        <input name="image" placeholder="URL de imagen" value={form.image} onChange={handleCreateChange} />
        <textarea name="description" placeholder="Descripción" value={form.description} onChange={handleCreateChange} rows={2} />
        <label className="admin-checkbox">
          <input type="checkbox" name="active" checked={form.active} onChange={handleCreateChange} />
          Producto activo
        </label>
        <button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Crear producto"}</button>
      </form>

      {loading && <p className="admin-state">Cargando productos...</p>}
      {!loading && errorMessage && <p className="admin-state admin-state-error">{errorMessage}</p>}
      {!loading && !errorMessage && products.length === 0 && <p className="admin-state">No hay productos.</p>}

      {!loading && !errorMessage && products.length > 0 && (
        <div className="admin-products-list">
          {products.map((product) => {
            const draft = draftsById[product.id] || {};
            const hasStock = Number(draft.stock ?? product.stock ?? 0) > 0;
            const isActive = Boolean(draft.active);

            return (
              <article key={product.id} className="admin-product-row">
                <img src={draft.image || "https://via.placeholder.com/120x120?text=Sin+Imagen"} alt={draft.name || product.name} />
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
                    <input name="category" value={draft.category || ""} onChange={(event) => handleDraftChange(product.id, event)} />
                    <input name="image" value={draft.image || ""} onChange={(event) => handleDraftChange(product.id, event)} />
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
