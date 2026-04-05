import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../Hooks/useCart";
import { useNotification } from "../Notifications/NotificationProvider";
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
  country: "",
};

function CheckoutPage({ user }) {
  const navigate = useNavigate();
  const { cart, total, createPendingOrder, confirmOrder } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentToken, setPaymentToken] = useState("");
  const [shippingReference, setShippingReference] = useState("");
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const { success, error: notifyError, info } = useNotification();

  const shippingCost = useMemo(() => {
    if (shippingMethod === "express") return 9.99;
    if (shippingMethod === "standard") return 4.99;
    return 0;
  }, [shippingMethod]);

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
    if (!address.street || !address.city || !address.zipCode || !address.country) {
      throw new Error("Completa los campos obligatorios de dirección.");
    }

    if (paymentToken.trim().length < 6) {
      throw new Error("Ingresa un token de pago válido (mínimo 6 caracteres).");
    }
  };

  const handleCreateOrder = async () => {
    try {
      validateForm();
      setLoading(true);

      const pendingOrder = await createPendingOrder({
        shippingAddress: address,
        shippingMethod,
        paymentMethod,
      });

      setOrderSummary(pendingOrder);
      success("Orden creada en estado pending. Falta confirmarla.");
      info("Revisá el resumen y confirmá el pago para finalizar la compra.");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      if (!orderSummary?.order?.id) {
        throw new Error("Primero debes crear la orden pendiente.");
      }

      if (shippingReference.trim().length < 3) {
        throw new Error("La referencia de envío debe tener al menos 3 caracteres.");
      }

      setLoading(true);

      const result = await confirmOrder({
        orderId: orderSummary.order.id,
        paymentToken,
        shippingReference,
      });

      success(`Compra confirmada. Estado final: ${result.status}.`);
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err) {
      notifyError(err.message);
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
      <PaymentStep
        paymentMethod={paymentMethod}
        paymentToken={paymentToken}
        onMethodChange={setPaymentMethod}
        onTokenChange={setPaymentToken}
      />

      {!orderSummary ? (
        <button onClick={handleCreateOrder} disabled={loading}>
          {loading ? "Creando orden..." : "Crear orden pendiente"}
        </button>
      ) : (
        <ConfirmationStep
          orderSummary={orderSummary}
          shippingReference={shippingReference}
          onShippingReferenceChange={setShippingReference}
          onConfirm={handleConfirmOrder}
          loading={loading}
        />
      )}
    </div>
  );
}

export default CheckoutPage;
