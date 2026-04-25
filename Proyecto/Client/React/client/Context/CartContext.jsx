import { useState, useEffect, useRef } from "react";
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
  const stockMessageTimeoutRef = useRef(null);
  const { info, success, warning, error: notifyError } = useNotification();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  const normalizeCartPayload = (payload) =>
    Array.isArray(payload) ? payload : [];

  const getSafeCartItems = (items) =>
    normalizeCartPayload(items).filter(
      (item) =>
        Boolean(item) &&
        ((item.id !== null &&
          item.id !== undefined &&
          item.id !== "" &&
          item.id !== "undefined") ||
          (item.product_id !== null &&
            item.product_id !== undefined &&
            item.product_id !== "" &&
            item.product_id !== "undefined")),
    );

  const parseJsonResponse = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const notifyStockAdjustments = (previousCart, nextCart) => {
    if (!Array.isArray(previousCart) || !Array.isArray(nextCart)) return;

    const nextByProduct = new Map(
      nextCart.map((item) => [String(item.product_id), item]),
    );

    for (const prevItem of previousCart) {
      const current = nextByProduct.get(String(prevItem.product_id));

      if (!current) {
        warning(`${prevItem.name} fue removido del carrito porque no tiene stock.`);
        continue;
      }

      if (Number(current.quantity) < Number(prevItem.quantity)) {
        warning(
          `Ajustamos ${prevItem.name} a ${current.quantity} unidad(es) por stock disponible.`,
        );
      }
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
      const requestError = new Error(payload?.error || defaultErrorMessage);
      requestError.status = res.status;
      requestError.payload = payload || null;
      throw requestError;
    }

    return payload;
  };

  const clearStockMessageTimeout = () => {
    if (stockMessageTimeoutRef.current) {
      clearTimeout(stockMessageTimeoutRef.current);
      stockMessageTimeoutRef.current = null;
    }
  };

  const showTransientStockMessage = (message) => {
    setCartError(message);
    clearStockMessageTimeout();
    stockMessageTimeoutRef.current = setTimeout(() => {
      setCartError((currentMessage) => (currentMessage === message ? "" : currentMessage));
      stockMessageTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(
    () => () => {
      clearStockMessageTimeout();
    },
    [],
  );

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
      .then((payload) => getSafeCartItems(payload))
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

  const safeCart = getSafeCartItems(cart);
  const cartCount = safeCart.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const total = safeCart.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.quantity),
    0,
  );

  const refreshCart = ({ suppressStockNotifications = false } = {}) => {
    if (!user) return Promise.resolve([]);

    setCartLoading(true);

    return requestJson(
      `${API_BASE_URL}/cart/user/${user.id}`,
      {},
      "No se pudo actualizar el carrito.",
    )
      .then((payload) => getSafeCartItems(payload))
      .then((items) => {
        if (!suppressStockNotifications) {
          notifyStockAdjustments(cart, items);
        }
        setCart(items);
        clearStockMessageTimeout();
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

    if (product?.active === false) {
      warning("Este producto está inactivo y no se puede comprar.");
      return;
    }

    if (Number(product?.stock || 0) <= 0) {
      warning("Producto agotado.");
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
      .catch(async (err) => {
        console.error(err);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const fallbackMessage =
            err.message || "No se pudo agregar el producto al carrito.";

          if (err.status === 409) {
            const nextCart = await refreshCart();
            const availableStock = Number(err.payload?.availableStock);
            const hasAvailableStock = Number.isFinite(availableStock);
            const stockMessage = hasAvailableStock
              ? `Stock insuficiente. Disponible: ${availableStock}`
              : fallbackMessage;

            showTransientStockMessage(stockMessage);

            if (nextCart.length === 0) {
              warning(`${stockMessage}. El producto fue removido del carrito.`);
            } else {
              warning(stockMessage);
            }
            return;
          }

          setCartError(fallbackMessage);
          notifyError(fallbackMessage);
        }
      })
      .finally(() => {
        setIsMutatingCart(false);
      });
  };

  const removeFromCart = (cartItemId) => {
    const cartItemIdAsString = String(cartItemId);
    setIsMutatingCart(true);
    setCartError("");
    setCart((previousCart) => {
      const nextCart = getSafeCartItems(previousCart).filter(
        (item) => String(item?.id) !== cartItemIdAsString,
      );
      console.log("[cart] item eliminado (optimista):", cartItemId);
      console.log("[cart] estado local post-eliminación:", nextCart);
      return nextCart;
    });

    requestJson(
      `${API_BASE_URL}/cart/${cartItemId}`,
      { method: "DELETE" },
      "No se pudo eliminar el producto del carrito.",
    )
      .then((payload) => {
        console.log("[cart] respuesta backend eliminar:", payload);
        return payload;
      })
      .then(async () => {
        await refreshCart({ suppressStockNotifications: true });
        clearStockMessageTimeout();
        setCartError("");
        success("Producto eliminado del carrito.");
      })
      .catch((err) => {
        console.error(err);
        const backendMessage = String(err?.message || "").toLowerCase();
        const isIdempotentNotFound =
          err?.status === 404 || backendMessage.includes("item no encontrado");

        if (isIdempotentNotFound) {
          setCart((previousCart) => {
            const nextCart = getSafeCartItems(previousCart).filter(
              (item) => String(item?.id) !== cartItemIdAsString,
            );
            console.log(
              "[cart] backend indicó item inexistente; tratado como éxito idempotente:",
              cartItemId,
            );
            console.log("[cart] estado local post-eliminación idempotente:", nextCart);
            return nextCart;
          });
          clearStockMessageTimeout();
          setCartError("");
          return;
        }

        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const message =
            err.message || "No se pudo eliminar el producto del carrito.";
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
      .then(async () => {
        await refreshCart({ suppressStockNotifications: true });
        clearStockMessageTimeout();
        setCartError("");
        info("Cantidad actualizada.");
      })
      .catch((err) => {
        console.error(err);
        if (err.message !== SESSION_EXPIRED_MESSAGE) {
          const message =
            err.message || "No se pudo actualizar la cantidad del producto.";
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
      "No se pudo validar el checkout.",
    );
  };

  const createMercadoPagoPreference = async (checkoutData) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para pagar.");
    }

    const payload = await requestJson(
      `${API_BASE_URL}/orders/checkout/mercadopago`,
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
      "No se pudo iniciar el pago con Mercado Pago.",
    );

    return payload;
  };

  const confirmCashOrder = async ({
    shippingAddress,
    shippingMethod,
    paymentMethod,
    shippingReference,
  }) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para confirmar.");
    }

    const payload = await requestJson(
      `${API_BASE_URL}/orders/checkout/cash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          shippingAddress,
          shippingMethod,
          paymentMethod,
          shippingReference,
        }),
      },
      "No se pudo confirmar la compra en efectivo.",
    );

    await refreshCart({ suppressStockNotifications: true });
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

    await refreshCart({ suppressStockNotifications: true });
    return payload;
  };

  const checkout = () => {
    info("Realizando el proceso de compra...");
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
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
