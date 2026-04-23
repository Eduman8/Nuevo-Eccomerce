import { useEffect, useState } from "react";
import { useNotification } from "../Notifications/NotificationProvider";
import {
  buildAuthHeaders,
  clearStoredAuth,
  isUnauthorizedResponse,
  SESSION_EXPIRED_MESSAGE,
} from "../utils/authSession";
import "./AdminPanel.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: "",
};

const API_BASE_URL = "http://localhost:3000/api";

function AdminPanel({ user, onSessionExpired }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const { success, error: notifyError, warning } = useNotification();

  const notifySessionExpired = () => {
    clearStoredAuth();
    onSessionExpired?.();
    warning(SESSION_EXPIRED_MESSAGE);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      notifyError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        }),
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Error al crear producto");
      }

      setProducts((prev) => [data, ...prev]);
      setForm(initialForm);
      success("Producto creado correctamente.");
    } catch (error) {
      console.error(error);
      notifyError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: buildAuthHeaders({
          "x-user-email": user?.email || "",
        }),
      });

      if (isUnauthorizedResponse(response)) {
        notifySessionExpired();
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar el producto");
      }

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      success("Producto eliminado.");
    } catch (error) {
      console.error(error);
      notifyError(error.message);
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <div className="admin-container">
      <h1>Panel Admin</h1>
      <p>Gestioná productos: crear, listar y borrar.</p>

      <form className="admin-form" onSubmit={handleCreateProduct}>
        <input
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Nombre del producto"
          required
        />
        <input
          name="description"
          value={form.description}
          onChange={handleInputChange}
          placeholder="Descripción"
        />
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleInputChange}
          placeholder="Precio"
          required
        />
        <input
          name="category"
          value={form.category}
          onChange={handleInputChange}
          placeholder="Categoría (ej: tazas)"
          required
        />
        <input
          name="image"
          value={form.image}
          onChange={handleInputChange}
          placeholder="URL de imagen"
          required
        />
        <input
          name="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={handleInputChange}
          placeholder="Stock"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Agregar producto"}
        </button>
      </form>

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <div className="admin-products">
          {products.map((product) => (
            <article key={product.id} className="admin-product-card">
              <img src={product.image} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p>
                  <strong>${product.price}</strong> · {product.category}
                </p>
                <p>Stock: {product.stock ?? 0}</p>
              </div>
              <button
                className="danger-btn"
                onClick={() => setProductToDelete(product)}
              >
                Borrar
              </button>
            </article>
          ))}
        </div>
      )}

      {productToDelete && (
        <div className="admin-confirm-overlay" role="dialog" aria-modal="true">
          <div className="admin-confirm-modal">
            <h3>Confirmar eliminación</h3>
            <p>
              ¿Seguro que querés borrar <strong>{productToDelete.name}</strong>?
            </p>
            <div className="admin-confirm-actions">
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  warning("Eliminación cancelada.");
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleDeleteProduct(productToDelete.id)}
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
