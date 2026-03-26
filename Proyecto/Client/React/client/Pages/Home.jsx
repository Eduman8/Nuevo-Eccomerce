import { useEffect, useState } from "react";
import ProductCard from "../ProductCard/productCard";
import Cart from "../Cart/cart";
import Login from "../Login/Login";
import { Link } from "react-router-dom";

function Home({ user, setUser }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  useEffect(() => {
    fetch("http://localhost:3000/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3000/cart/${user.id}`)
      .then((res) => res.json())
      .then((data) => setCart(data));
  }, [user]);

  const addToCart = (product) => {
    if (!user) {
      alert("Tenés que iniciar sesión");
      return;
    }

    fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        productId: product.id,
        quantity: 1,
      }),
    })
      .then(() => fetch(`http://localhost:3000/cart/${user.id}`))
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error(err));
  };

  const removeFromCart = (cartItemId) => {
    fetch(`http://localhost:3000/cart/${cartItemId}`, {
      method: "DELETE",
    })
      .then(() => fetch(`http://localhost:3000/cart/${user.id}`))
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error(err));
  };

  const checkout = () => {
    if (!user) {
      alert("Tenés que iniciar sesión");
      return;
    }

    fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Compra realizada");
        setCart([]);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h1>Tienda</h1>

      {!user ? (
        <Login setUser={setUser} />
      ) : (
        <p>
          Bienvenido {user.name}
          <button onClick={() => setUser(null)}>Cerrar sesión</button>
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart}
          />
        ))}
      </div>

      <Cart
        cart={cart}
        removeFromCart={removeFromCart}
        total={total}
        checkout={checkout}
      />
      <Link to="/orders">Ver mis pedidos</Link>
    </div>
  );
}

export default Home;
