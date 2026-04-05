import { useEffect, useState } from "react";
import "./AdminPanel.css";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: "",
};

function AdminPanel({ user }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setMessage("No se pudieron cargar los productos.");
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
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear producto");
      }

      setProducts((prev) => [data, ...prev]);
      setForm(initialForm);
      setMessage("Producto creado correctamente.");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const shouldDelete = window.confirm(
      "¿Seguro que querés borrar este producto?",
    );
    if (!shouldDelete) return;

    try {
      const response = await fetch(`http://localhost:3000/products/${productId}`, {
        method: "DELETE",
        headers: {
          "x-user-email": user?.email || "",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo eliminar el producto");
      }

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setMessage("Producto eliminado.");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
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

      {message && <p className="admin-message">{message}</p>}

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
                onClick={() => handleDeleteProduct(product.id)}
              >
                Borrar
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
