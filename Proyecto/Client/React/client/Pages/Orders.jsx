import { useEffect, useState } from "react";
import "./Orders.css";

const shippingLabel = {
  home_delivery: "Envío a domicilio",
  pickup: "Retirar en local",
};

const paymentLabel = {
  mercadopago: "Mercado Pago",
  cash: "Efectivo",
};

function Orders({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3000/orders/${user.id}`)
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

  if (!user) return <p>Iniciá sesión para ver tus pedidos</p>;

  return (
    <div className="order-card">
      <h1>Mis pedidos</h1>

      {orders.length === 0 ? (
        <p>No tenés pedidos todavía</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
          <div
            key={order.id}
            className="order-item"
          >
            <h3>Pedido #{order.id}</h3>
            <p>Total: ${order.total}</p>
            <p>Estado: {order.status}</p>
            <p>Método de envío: {shippingLabel[order.shippingMethod] || "-"}</p>
            <p>Costo de envío: ${order.shippingCost || 0}</p>
            <p>Método de pago: {paymentLabel[order.paymentMethod] || "-"}</p>
            {order.shippingAddress?.street && (
              <p>
                Dirección: {order.shippingAddress.street}, {order.shippingAddress.city}
              </p>
            )}

            {order.items.length === 0 ? (
              <p>Orden pendiente sin items confirmados todavía.</p>
            ) : (
              order.items.map((item, index) => (
                <div key={index}>
                  {item.name} - {item.quantity} x ${item.price}
                </div>
              ))
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
