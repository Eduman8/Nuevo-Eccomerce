import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../Hooks/useCart";
import AddressStep from "./AddressStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import "./Checkout.css";

const initialAddress = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
};

function CheckoutPage({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cart,
    total,
    createPendingOrder,
    createMercadoPagoPreference,
    confirmCashOrder,
    confirmMercadoPagoOrder,
  } = useCart();

  const [address, setAddress] = useState(initialAddress);
  const [shippingMethod, setShippingMethod] = useState("home_delivery");
  const [paymentMethod, setPaymentMethod] = useState("mercadopago");
  const [shippingReference, setShippingReference] = useState("");
  const [orderSummary, setOrderSummary] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mpConfirmed, setMpConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment_status");
    const status = params.get("status") || params.get("collection_status");
    const paymentId = params.get("payment_id") || params.get("collection_id");
    const orderId = params.get("order_id") || params.get("external_reference");
    const isApprovedReturn = paymentStatus === "success" || status === "approved";

    if (!isApprovedReturn || !paymentId || !orderId || !user || mpConfirmed) {
      return;
    }

    const orderIdValue = String(orderId).includes(":")
      ? Number(String(orderId).split(":user:")[0].replace("order:", ""))
      : Number(orderId);

    if (!orderIdValue) {
      return;
    }

    const confirmMercadoPago = async () => {
      try {
        setLoading(true);
        const result = await confirmMercadoPagoOrder({
          orderId: orderIdValue,
          paymentId,
        });
        setSuccess(`Pago aprobado y orden confirmada (#${result.orderId}).`);
        setMpConfirmed(true);
        setTimeout(() => navigate("/orders"), 1200);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    confirmMercadoPago();
  }, [location.search, user, confirmMercadoPagoOrder, navigate, mpConfirmed]);

  const shippingCost = useMemo(
    () => (shippingMethod === "home_delivery" ? 3000 : 0),
    [shippingMethod],
  );

  if (!user) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>Debes iniciar sesión para continuar.</p>
      </div>
    );
  }

  if (cart.length === 0 && !orderSummary) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>No hay productos en el carrito.</p>
      </div>
    );
  }

  const updateAddress = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!address.street || !address.city || !address.zipCode) {
      throw new Error("Completa los campos obligatorios de dirección.");
    }
  };

  const handleCreateOrder = async () => {
    try {
      setError("");
      setSuccess("");
      validateForm();
      setLoading(true);

      const pendingOrder = await createPendingOrder({
        shippingAddress: address,
        shippingMethod,
        paymentMethod,
      });

      setOrderSummary(pendingOrder);
      setSuccess("Orden creada en estado pending.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMercadoPagoCheckout = async () => {
    try {
      setError("");
      setSuccess("");

      if (!orderSummary?.order?.id) {
        throw new Error("Primero debes crear la orden pendiente.");
      }

      setLoading(true);

      const preference = await createMercadoPagoPreference(orderSummary.order.id);

      if (!preference?.init_point) {
        throw new Error("No se recibió el link de pago de Mercado Pago.");
      }

      window.location.href = preference.init_point;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleConfirmCashOrder = async () => {
    try {
      setError("");
      setSuccess("");

      if (!orderSummary?.order?.id) {
        throw new Error("Primero debes crear la orden pendiente.");
      }

      if (shippingReference.trim().length < 3) {
        throw new Error("La referencia de envío debe tener al menos 3 caracteres.");
      }

      setLoading(true);

      const result = await confirmCashOrder({
        orderId: orderSummary.order.id,
        shippingReference,
      });

      setSuccess(`Compra confirmada. Estado final: ${result.status}.`);
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <p>Subtotal carrito: ${total.toFixed(2)}</p>
      <p>Envío estimado: ${shippingCost.toFixed(2)}</p>

      <AddressStep address={address} onChange={updateAddress} />
      <ShippingStep shippingMethod={shippingMethod} onChange={setShippingMethod} />
      <PaymentStep paymentMethod={paymentMethod} onMethodChange={setPaymentMethod} />

      {!orderSummary ? (
        <button onClick={handleCreateOrder} disabled={loading}>
          {loading ? "Creando orden..." : "Crear orden pendiente"}
        </button>
      ) : paymentMethod === "mercadopago" ? (
        <button onClick={handleMercadoPagoCheckout} disabled={loading}>
          {loading ? "Redirigiendo..." : "Pagar con Mercado Pago"}
        </button>
      ) : (
        <ConfirmationStep
          orderSummary={orderSummary}
          shippingReference={shippingReference}
          onShippingReferenceChange={setShippingReference}
          onConfirmCash={handleConfirmCashOrder}
          loading={loading}
        />
      )}

      {error && <p className="checkout-error">{error}</p>}
      {success && <p className="checkout-success">{success}</p>}
    </div>
  );
}

export default CheckoutPage;
