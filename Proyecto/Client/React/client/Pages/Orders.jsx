import { useEffect, useState } from "react";
import "./orders.css";

function Orders({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3000/api/orders/user/${user.id}`)
      .then((res) => res.json())
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
      .catch((err) => console.error(err));
  }, [user]);

  return (
    <div className="order-card">
      <h1>Mis pedidos</h1>

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
    </div>
  );
}

export default Orders;
