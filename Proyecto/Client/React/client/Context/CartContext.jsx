import { useState, useEffect } from "react";
import { CartContext } from "./cartContext";
import { useNotification } from "../Notifications/NotificationProvider";

export function CartProvider({ children, user }) {
  const [cart, setCart] = useState([]);
  const { info, warning, error: notifyError } = useNotification();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const normalizeCartPayload = (payload) => (Array.isArray(payload) ? payload : []);
  const parseJsonResponse = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };
  const requestJson = async (url, options = {}, defaultErrorMessage = "Ocurrió un error de red.") => {
    const res = await fetch(url, options);
    const payload = await parseJsonResponse(res);

    if (!res.ok) {
      throw new Error(payload?.error || defaultErrorMessage);
    }

    return payload;
  };

  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }

    requestJson(
      `${API_BASE_URL}/cart/${user.id}`,
      {},
      "No se pudo cargar el carrito.",
    )
      .then((payload) => normalizeCartPayload(payload))
      .then(setCart)
      .catch((err) => {
        console.error(err);
        setCart([]);
      });
  }, [user, API_BASE_URL]);

  const safeCart = Array.isArray(cart) ? cart : [];
  const total = safeCart.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0,
  );

  const addToCart = (product) => {
    if (!user) {
      warning("Tenés que iniciar sesión para agregar productos al carrito.");
      return;
    }

    requestJson(
      `${API_BASE_URL}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          quantity: 1,
        }),
      },
      "No se pudo agregar el producto al carrito.",
    )
      .then(refreshCart)
      .catch((err) => {
        console.error(err);
        notifyError("No se pudo agregar el producto al carrito.");
      });
  };

  const refreshCart = () => {
    if (!user) return Promise.resolve([]);

    return requestJson(
      `${API_BASE_URL}/cart/${user.id}`,
      {},
      "No se pudo actualizar el carrito.",
    )
      .then((payload) => normalizeCartPayload(payload))
      .then((items) => {
        setCart(items);
        return items;
      })
      .catch((err) => {
        console.error(err);
        setCart([]);
        return [];
      });
  };

  const removeFromCart = (cartItemId) => {
    requestJson(
      `${API_BASE_URL}/cart/${cartItemId}`,
      { method: "DELETE" },
      "No se pudo eliminar el producto del carrito.",
    )
      .then(refreshCart)
      .catch((err) => {
        console.error(err);
        notifyError("No se pudo eliminar el producto del carrito.");
      });
  };

  const decreaseFromCart = (cartItemId) => {
    requestJson(
      `${API_BASE_URL}/cart/${cartItemId}/decrease`,
      { method: "PATCH" },
      "No se pudo actualizar la cantidad del producto.",
    )
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

    return requestJson(
      `${API_BASE_URL}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...checkoutData,
        }),
      },
      "No se pudo iniciar la compra.",
    );
  };

  const createMercadoPagoPreference = async (orderId) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para pagar.");
    }

    return requestJson(
      `${API_BASE_URL}/orders/${orderId}/checkout-pro-preference`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      },
      "No se pudo crear la preferencia de pago.",
    );
  };

  const confirmCashOrder = async ({ orderId, shippingReference }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const payload = await requestJson(
      `${API_BASE_URL}/orders/${orderId}/confirm-cash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          shippingReference,
        }),
      },
      "No se pudo confirmar la compra en efectivo.",
    );

    await refreshCart();

    return payload;
  };

  const confirmMercadoPagoOrder = async ({ orderId, paymentId }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const payload = await requestJson(
      `${API_BASE_URL}/orders/${orderId}/confirm-mercadopago`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          paymentId
            ? {
              userId: user.id,
              paymentId,
            }
            : {
              userId: user.id,
            },
        ),
      },
      "No se pudo confirmar el pago de Mercado Pago.",
    );

    await refreshCart();

    return payload;
  };

  const checkout = () => {
    info("Ahora el checkout se realiza desde la pantalla /checkout.");
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
