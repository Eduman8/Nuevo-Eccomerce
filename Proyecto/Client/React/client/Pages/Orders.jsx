import { useEffect, useState } from "react";
import { useNotification } from "../Notifications/NotificationProvider";
import {
  buildAuthHeaders,
  clearStoredAuth,
  isUnauthorizedResponse,
  SESSION_EXPIRED_MESSAGE,
} from "../utils/authSession";
import "./Orders.css";

function Orders({ user, onSessionExpired }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { warning, error: notifyError } = useNotification();

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      setLoadError("");
      return;
    }

    setLoading(true);
    setLoadError("");

    fetch("http://localhost:3000/api/orders/my-orders", {
      headers: buildAuthHeaders(),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (isUnauthorizedResponse(res)) {
          clearStoredAuth();
          onSessionExpired?.();
          warning(SESSION_EXPIRED_MESSAGE);
          return [];
        }

        if (!res.ok) {
          throw new Error(data?.error || "No se pudieron cargar tus pedidos.");
        }

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        const grouped = {};

        data.forEach((item) => {
          if (!grouped[item.order_id]) {
            grouped[item.order_id] = {
              id: item.order_id,
              total: item.total,
              status: item.status,
              shippingMethod: item.shipping_method,
              shippingCost: item.shipping_cost,
              shippingAddress: item.shipping_address,
              paymentMethod: item.payment_method,
              items: [],
            };
          }

          if (item.name) {
            grouped[item.order_id].items.push({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            });
          }
        });

        setOrders(Object.values(grouped));
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        const message = err.message || "No se pudieron cargar tus pedidos.";
        setLoadError(message);
        notifyError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, onSessionExpired, warning, notifyError]);

  return (
    <div className="order-card">
      <h1>Mis pedidos</h1>

      {loading && <p className="order-state">Cargando pedidos...</p>}

      {!loading && loadError && <p className="order-state order-state-error">{loadError}</p>}

      {!loading && !loadError && orders.length === 0 && (
        <p className="order-state">Todavía no tenés pedidos realizados.</p>
      )}

      {!loading && !loadError && orders.length > 0 && (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <p>
                <strong>Pedido #{order.id}</strong>
              </p>
              <p>Total: ${order.total}</p>
              <p>Estado: {order.status}</p>
              <p>Método de envío: {order.shippingMethod}</p>
              <p>Costo de envío: ${order.shippingCost}</p>
              <p>Método de pago: {order.paymentMethod}</p>

              {order.shippingAddress &&
                typeof order.shippingAddress === "object" && (
                  <p>
                    Dirección: {order.shippingAddress.street},{" "}
                    {order.shippingAddress.city}
                  </p>
                )}

              {order.items.length > 0 && (
                <div>
                  <p>
                    <strong>Productos:</strong>
                  </p>
                  {order.items.map((item, index) => (
                    <p key={index}>
                      {item.name} - {item.quantity} x ${item.price}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
