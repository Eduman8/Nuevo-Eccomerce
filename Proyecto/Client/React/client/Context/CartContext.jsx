import { createContext, useState, useEffect } from "react";
import { useNotification } from "../Notifications/NotificationProvider";

export const CartContext = createContext();

export function CartProvider({ children, user }) {
  const [cart, setCart] = useState([]);
  const { info, warning, error: notifyError } = useNotification();

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
    if (!user) {
      warning("Tenés que iniciar sesión para agregar productos al carrito.");
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
      .then(setCart)
      .catch((err) => {
        console.error(err);
        notifyError("No se pudo agregar el producto al carrito.");
      });
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
      .catch((err) => {
        console.error(err);
        notifyError("No se pudo eliminar el producto del carrito.");
      });
  };

  const decreaseFromCart = (cartItemId) => {
    fetch(`http://localhost:3000/cart/${cartItemId}/decrease`, {
      method: "PATCH",
    })
      .then(refreshCart)
      .catch((err) => {
        console.error(err);
        notifyError("No se pudo actualizar la cantidad del producto.");
      });
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

  const confirmOrder = async ({ orderId, paymentToken, shippingReference }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const response = await fetch(`http://localhost:3000/orders/${orderId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        paymentToken,
        shippingReference,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No se pudo confirmar el pago.");
    }

    await refreshCart();

    return payload;
  };

  const checkout = () => {
    info("Te redirigimos al checkout para finalizar tu compra.");
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
        confirmOrder,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
