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
const ADMIN_ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "rejected"];

function AdminOrdersPage({ onSessionExpired }) {
  const [orders, setOrders] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [statusUpdatingByOrderId, setStatusUpdatingByOrderId] = useState({});
  const [deletingByOrderId, setDeletingByOrderId] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { success, warning, error: notifyError } = useNotification();

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

        const normalizedOrders = Array.isArray(data) ? data : [];
        setOrders(normalizedOrders);
        setSelectedStatuses(
          normalizedOrders.reduce((acc, order) => {
            acc[order.id] = order.status;
            return acc;
          }, {}),
        );
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

  const handleStatusSelection = (orderId, nextStatus) => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [orderId]: nextStatus,
    }));
  };

  const handleStatusUpdate = async (orderId) => {
    const nextStatus = selectedStatuses[orderId];
    if (!nextStatus) return;

    setStatusUpdatingByOrderId((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        clearStoredAuth();
        onSessionExpired?.();
        warning(SESSION_EXPIRED_MESSAGE);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar el estado del pedido.");
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: data.status } : order)),
      );
      setSelectedStatuses((prev) => ({ ...prev, [orderId]: data.status }));
      success(`Estado del pedido #${orderId} actualizado.`);
    } catch (err) {
      console.error(err);
      notifyError(err.message || "No se pudo actualizar el estado del pedido.");
    } finally {
      setStatusUpdatingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar el pedido #${orderId}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingByOrderId((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (isUnauthorizedResponse(response)) {
        clearStoredAuth();
        onSessionExpired?.();
        warning(SESSION_EXPIRED_MESSAGE);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar el pedido.");
      }

      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      setSelectedStatuses((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      success(data?.message || `Pedido #${orderId} eliminado correctamente.`);
    } catch (err) {
      console.error(err);
      notifyError(err.message || "No se pudo eliminar el pedido.");
    } finally {
      setDeletingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <section className="admin-orders-page">
      <header className="admin-orders-header">
        <h1>Pedidos (Admin)</h1>
        <p>Supervisá estado, envío y datos de compra sin afectar la lógica operativa.</p>
      </header>

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
              <p>
                <span className="admin-order-label">Fecha:</span>{" "}
                <span className="admin-order-value">{new Date(order.date).toLocaleString()}</span>
              </p>
              <p>
                <span className="admin-order-label">Estado:</span>{" "}
                <span className={`admin-order-status admin-order-status-${order.status}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </p>
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

              <div className="admin-order-actions">
                <div className="admin-order-status-controls">
                  <label htmlFor={`status-${order.id}`}>Estado del pedido</label>
                  <div className="admin-order-status-form">
                    <select
                      id={`status-${order.id}`}
                      value={selectedStatuses[order.id] || order.status}
                      onChange={(event) => handleStatusSelection(order.id, event.target.value)}
                      disabled={Boolean(statusUpdatingByOrderId[order.id] || deletingByOrderId[order.id])}
                    >
                      {ADMIN_ORDER_STATUSES.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {getOrderStatusLabel(statusValue)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id)}
                      disabled={
                        Boolean(statusUpdatingByOrderId[order.id] || deletingByOrderId[order.id]) ||
                        (selectedStatuses[order.id] || order.status) === order.status
                      }
                    >
                      {statusUpdatingByOrderId[order.id] ? "Guardando..." : "Guardar estado"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-order-delete-btn"
                  onClick={() => handleDeleteOrder(order.id)}
                  disabled={Boolean(deletingByOrderId[order.id] || statusUpdatingByOrderId[order.id])}
                >
                  {deletingByOrderId[order.id] ? "Eliminando..." : "Eliminar pedido"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminOrdersPage;
