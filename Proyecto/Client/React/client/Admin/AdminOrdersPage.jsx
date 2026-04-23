import { useEffect, useState } from "react";
import { useNotification } from "../Notifications/NotificationProvider";
import {
  buildAuthHeaders,
  clearStoredAuth,
  isUnauthorizedResponse,
  SESSION_EXPIRED_MESSAGE,
} from "../utils/authSession";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getShippingMethodLabel,
} from "../utils/orderLabels";
import "./AdminOrdersPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

function AdminOrdersPage({ onSessionExpired }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { warning, error: notifyError } = useNotification();

  useEffect(() => {
    const fetchAdminOrders = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`${API_BASE_URL}/orders/admin/orders`, {
          headers: buildAuthHeaders(),
        });

        const data = await response.json().catch(() => null);

        if (isUnauthorizedResponse(response)) {
          clearStoredAuth();
          onSessionExpired?.();
          warning(SESSION_EXPIRED_MESSAGE);
          setOrders([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data?.error || "No se pudieron cargar los pedidos de administración.");
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        const message = err.message || "No se pudieron cargar los pedidos de administración.";
        setLoadError(message);
        notifyError(message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminOrders();
  }, [onSessionExpired, warning, notifyError]);

  return (
    <section className="admin-orders-page">
      <h1>Pedidos (Admin)</h1>

      {loading && <p className="admin-orders-state">Cargando pedidos...</p>}

      {!loading && loadError && (
        <p className="admin-orders-state admin-orders-state-error">{loadError}</p>
      )}

      {!loading && !loadError && orders.length === 0 && (
        <p className="admin-orders-state">No hay pedidos para mostrar.</p>
      )}

      {!loading && !loadError && orders.length > 0 && (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="admin-order-card">
              <h2>Pedido #{order.id}</h2>
              <p>Fecha: {new Date(order.date).toLocaleString()}</p>
              <p>Estado: {getOrderStatusLabel(order.status)}</p>
              <p>Total: ${Number(order.total || 0).toFixed(2)}</p>
              <p>Costo de envío: ${Number(order.shippingCost || 0).toFixed(2)}</p>
              <p>Método de pago: {getPaymentMethodLabel(order.paymentMethod)}</p>
              <p>Método de envío: {getShippingMethodLabel(order.shippingMethod)}</p>

              <div className="admin-order-block">
                <h3>Comprador</h3>
                <p>Nombre: {order.buyer?.name || "-"}</p>
                <p>Email: {order.buyer?.email || "-"}</p>
              </div>

              <div className="admin-order-block">
                <h3>Dirección</h3>
                <p>Dirección: {order.shippingAddress?.address || "-"}</p>
                <p>Número / altura: {order.shippingAddress?.addressNumber || "-"}</p>
                <p>Ciudad: {order.shippingAddress?.city || "-"}</p>
                <p>Provincia: {order.shippingAddress?.province || "-"}</p>
                <p>Código postal: {order.shippingAddress?.postalCode || "-"}</p>
              </div>

              <div className="admin-order-block">
                <h3>Productos</h3>
                {order.items?.length ? (
                  <div className="admin-order-items">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="admin-order-item-row">
                        <span>{item.productName}</span>
                        <span>Cant: {item.quantity}</span>
                        <span>Unit: ${Number(item.unitPrice || 0).toFixed(2)}</span>
                        <span>Subtotal: ${Number(item.subtotal || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Sin items.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminOrdersPage;
