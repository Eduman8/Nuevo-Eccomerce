import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children, user }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }

    fetch(`http://localhost:3000/cart/${user.id}`)
      .then((res) => res.json())
      .then(setCart)
      .catch(console.error);
  }, [user]);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const addToCart = (product) => {
    if (!user) return alert("Tenés que iniciar sesión");

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
      .then(setCart)
      .catch(console.error);
  };

  const refreshCart = () =>
    fetch(`http://localhost:3000/cart/${user.id}`)
      .then((res) => res.json())
      .then(setCart);

  const removeFromCart = (cartItemId) => {
    fetch(`http://localhost:3000/cart/${cartItemId}`, {
      method: "DELETE",
    })
      .then(refreshCart)
      .catch(console.error);
  };

  const decreaseFromCart = (cartItemId) => {
    fetch(`http://localhost:3000/cart/${cartItemId}/decrease`, {
      method: "PATCH",
    })
      .then(refreshCart)
      .catch(console.error);
  };

  const checkout = () => {
    if (!user) return;

    fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(() => {
        alert("Compra realizada");
        setCart([]);
      })
      .catch(console.error);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        removeFromCart,
        checkout,
        decreaseFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
