import { useEffect, useState } from "react";

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
              items: [],
            };
          }

          grouped[item.order_id].items.push({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          });
        });

        setOrders(Object.values(grouped));
      })
      .catch((err) => console.error(err));
  }, [user]);

  if (!user) return <p>Iniciá sesión para ver tus pedidos</p>;

  return (
    <div>
      <h1>Mis pedidos</h1>

      {orders.length === 0 ? (
        <p>No tenés pedidos todavía</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ccc",
              margin: "10px",
              padding: "10px",
            }}
          >
            <h3>Pedido #{order.id}</h3>
            <p>Total: ${order.total}</p>

            {order.items.map((item, index) => (
              <div key={index}>
                {item.name} - {item.quantity} x ${item.price}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;
