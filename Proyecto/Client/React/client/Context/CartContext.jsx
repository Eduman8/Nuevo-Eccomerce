import { useState, useEffect } from "react";
import { CartContext } from "./cartContext";
import { useNotification } from "../Notifications/NotificationProvider";
import {
  buildAuthHeaders,
  clearStoredAuth,
  isUnauthorizedResponse,
  SESSION_EXPIRED_MESSAGE,
} from "../utils/authSession";

export function CartProvider({ children, user, onSessionExpired }) {
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");
  const [isMutatingCart, setIsMutatingCart] = useState(false);
  const { info, success, warning, error: notifyError } = useNotification();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  const normalizeCartPayload = (payload) =>
    Array.isArray(payload) ? payload : [];

  const parseJsonResponse = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const requestJson = async (
    url,
    options = {},
    defaultErrorMessage = "Ocurrió un error de red.",
  ) => {
    const headers = buildAuthHeaders(options.headers || {});
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const payload = await parseJsonResponse(res);

    if (isUnauthorizedResponse(res)) {
      clearStoredAuth();
      setCart([]);
      setCartError(SESSION_EXPIRED_MESSAGE);
      onSessionExpired?.();
      warning(SESSION_EXPIRED_MESSAGE);
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    if (!res.ok) {
      throw new Error(payload?.error || defaultErrorMessage);
    }

    return payload;
  };

  useEffect(() => {
    if (!user) {
      setCart([]);
      setCartError("");
      setCartLoading(false);
      return;
    }

    setCartLoading(true);
    setCartError("");

    requestJson(
      `${API_BASE_URL}/cart/user/${user.id}`,
      {},
      "No se pudo cargar el carrito.",
    )
      .then((payload) => normalizeCartPayload(payload))
      .then(setCart)
      .catch((err) => {
        console.error(err);
        setCart([]);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          setCartError(err.message || "No se pudo cargar el carrito.");
        }
      })
      .finally(() => {
        setCartLoading(false);
      });
  }, [user, API_BASE_URL, onSessionExpired, warning]);

  const safeCart = Array.isArray(cart) ? cart : [];
  const total = safeCart.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0,
  );

  const refreshCart = () => {
    if (!user) return Promise.resolve([]);

    setCartLoading(true);

    return requestJson(
      `${API_BASE_URL}/cart/user/${user.id}`,
      {},
      "No se pudo actualizar el carrito.",
    )
      .then((payload) => normalizeCartPayload(payload))
      .then((items) => {
        setCart(items);
        setCartError("");
        return items;
      })
      .catch((err) => {
        console.error(err);
        setCart([]);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          setCartError(err.message || "No se pudo actualizar el carrito.");
        }
        return [];
      })
      .finally(() => {
        setCartLoading(false);
      });
  };

  const addToCart = (product) => {
    if (!user) {
      warning("Tenés que iniciar sesión para agregar productos al carrito.");
      return;
    }

    setIsMutatingCart(true);
    setCartError("");

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
      .then(() => {
        success("Producto agregado al carrito.");
      })
      .catch((err) => {
        console.error(err);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const message = err.message || "No se pudo agregar el producto al carrito.";
          setCartError(message);
          notifyError(message);
        }
      })
      .finally(() => {
        setIsMutatingCart(false);
      });
  };

  const removeFromCart = (cartItemId) => {
    setIsMutatingCart(true);
    setCartError("");

    requestJson(
      `${API_BASE_URL}/cart/${cartItemId}`,
      { method: "DELETE" },
      "No se pudo eliminar el producto del carrito.",
    )
      .then(refreshCart)
      .then(() => {
        success("Producto eliminado del carrito.");
      })
      .catch((err) => {
        console.error(err);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const message = err.message || "No se pudo eliminar el producto del carrito.";
          setCartError(message);
          notifyError(message);
        }
      })
      .finally(() => {
        setIsMutatingCart(false);
      });
  };

  const decreaseFromCart = (cartItemId) => {
    setIsMutatingCart(true);
    setCartError("");

    requestJson(
      `${API_BASE_URL}/cart/${cartItemId}/decrease`,
      { method: "PATCH" },
      "No se pudo actualizar la cantidad del producto.",
    )
      .then(refreshCart)
      .then(() => {
        info("Cantidad actualizada.");
      })
      .catch((err) => {
        console.error(err);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const message = err.message || "No se pudo actualizar la cantidad del producto.";
          setCartError(message);
          notifyError(message);
        }
      })
      .finally(() => {
        setIsMutatingCart(false);
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
        cartLoading,
        cartError,
        isMutatingCart,
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
