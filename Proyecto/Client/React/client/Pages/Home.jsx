import { useEffect, useState } from "react";
import ProductCard from "../ProductCard/productCard";
import Cart from "../Cart/cart";
import Login from "../Login/Login";

function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
        cart,
        userId: user.id,
      }),
    })
      .then((res) => res.json())
      .then((dbUser) => {
        setUser(dbUser);
      })
      .then(() => {
        alert("Compra realizada");
        setCart([]);
      });
  };

  return (
    <div>
      <h1>Tienda</h1>

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
      {!user ? <Login setUser={setUser} /> : <p>Bienvenido {user.name}</p>}
    </div>
  );
}

export default Home;
