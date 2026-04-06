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

  const refreshCart = () => {
    if (!user) return Promise.resolve([]);

    return fetch(`http://localhost:3000/cart/${user.id}`)
      .then((res) => res.json())
      .then((items) => {
        setCart(items);
        return items;
      });
  };

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

  const createPendingOrder = async (checkoutData) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para continuar.");
    }

    const response = await fetch("http://localhost:3000/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        ...checkoutData,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo iniciar la compra.");
    }

    return payload;
  };

  const createMercadoPagoPreference = async (orderId) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para pagar.");
    }

    const response = await fetch(
      `http://localhost:3000/orders/${orderId}/checkout-pro-preference`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo crear la preferencia de pago.");
    }

    return payload;
  };

  const confirmCashOrder = async ({ orderId, shippingReference }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const response = await fetch(`http://localhost:3000/orders/${orderId}/confirm-cash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        shippingReference,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo confirmar la compra en efectivo.");
    }

    await refreshCart();

    return payload;
  };

  const confirmMercadoPagoOrder = async ({ orderId, paymentId }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const response = await fetch(
      `http://localhost:3000/orders/${orderId}/confirm-mercadopago`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          paymentId,
        }),
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo confirmar el pago de Mercado Pago.");
    }

    await refreshCart();

    return payload;
  };

  const checkout = () => {
    alert("Ahora el checkout se realiza desde la pantalla /checkout.");
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
        createPendingOrder,
        createMercadoPagoPreference,
        confirmCashOrder,
        confirmMercadoPagoOrder,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
