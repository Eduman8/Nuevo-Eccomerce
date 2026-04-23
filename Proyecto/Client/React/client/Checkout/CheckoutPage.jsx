import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../Hooks/useCart";
import AddressStep from "./AddressStep";
import ShippingStep from "./ShippingStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import { getOrderStatusLabel } from "../utils/orderLabels";
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
  const [orderSummary, setOrderSummary] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [loadingAction, setLoadingAction] = useState("");
  const [mpConfirmed, setMpConfirmed] = useState(false);

  const isProcessing = loadingAction !== "";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("payment_status");
    const status = params.get("status") || params.get("collection_status");
    const paymentId = params.get("payment_id") || params.get("collection_id");
    const orderId = params.get("order_id") || params.get("external_reference");

    if (!paymentStatus && !status) {
      return;
    }

    const normalizedStatus = String(paymentStatus || status || "").toLowerCase();
    const isApprovedReturn =
      normalizedStatus === "success" || normalizedStatus === "approved";

    if (normalizedStatus === "pending" || normalizedStatus === "in_process") {
      setNotice({
        type: "warning",
        message: "Tu pago está pendiente de acreditación. Te avisaremos cuando se confirme.",
      });
      setSuccess("");
      setError("");
      return;
    }

    if (
      normalizedStatus === "failure" ||
      normalizedStatus === "rejected" ||
      normalizedStatus === "cancelled"
    ) {
      setError("El pago fue rechazado o cancelado. Podés intentarlo nuevamente.");
      setSuccess("");
      setNotice({ type: "", message: "" });
      return;
    }

    if (!isApprovedReturn || !paymentId || !orderId || !user || mpConfirmed) {
      return;
    }

    const orderIdValue = String(orderId).includes(":")
      ? Number(String(orderId).split(":user:")[0].replace("order:", ""))
      : Number(orderId);

    if (!orderIdValue) {
      setError("No se pudo identificar la orden a confirmar.");
      return;
    }

    const confirmMercadoPago = async () => {
      try {
        setLoadingAction("confirm_mp");
        setError("");
        setSuccess("");
        setNotice({ type: "info", message: "Confirmando tu pago con Mercado Pago..." });

        const result = await confirmMercadoPagoOrder({
          orderId: orderIdValue,
          paymentId,
        });

        setSuccess(`Pago aprobado y orden confirmada (#${result.orderId}).`);
        setNotice({ type: "", message: "" });
        setMpConfirmed(true);
        setTimeout(() => navigate("/orders"), 1200);
      } catch (err) {
        setError(err.message || "Ocurrió un error inesperado al confirmar tu pago.");
      } finally {
        setLoadingAction("");
      }
    };

    confirmMercadoPago();
  }, [location.search, user, confirmMercadoPagoOrder, navigate, mpConfirmed]);

  const shippingCost = useMemo(
    () => (shippingMethod === "home_delivery" ? 3000 : 0),
    [shippingMethod],
  );

  useEffect(() => {
    if (paymentMethod === "cash" && shippingMethod === "home_delivery") {
      setShippingMethod("pickup");
    }
  }, [paymentMethod, shippingMethod]);

  if (!user) {
    return (
      <div className="checkout-page">
        <h1>Finalizar compra</h1>
        <p>Debes iniciar sesión para continuar.</p>
      </div>
    );
  }

  if (cart.length === 0 && !orderSummary) {
    return (
      <div className="checkout-page">
        <h1>Finalizar compra</h1>
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
      setNotice({ type: "", message: "" });
      validateForm();
      setLoadingAction("create_order");

      const pendingOrder = await createPendingOrder({
        shippingAddress: address,
        shippingMethod,
        paymentMethod,
      });

      setOrderSummary(pendingOrder);
      setSuccess("Orden creada correctamente. Ahora podés continuar con el pago.");
      setNotice({ type: "", message: "" });
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado al crear la orden.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleMercadoPagoCheckout = async () => {
    try {
      setError("");
      setSuccess("");

      if (!orderSummary?.order?.id) {
        throw new Error("Primero debes crear la orden pendiente.");
      }

      setLoadingAction("start_mp");
      setNotice({ type: "info", message: "Preparando el pago. Serás redirigido a Mercado Pago..." });

      const preference = await createMercadoPagoPreference(orderSummary.order.id);

      if (!preference?.init_point) {
        throw new Error("No se recibió el link de pago de Mercado Pago.");
      }

      window.location.href = preference.init_point;
    } catch (err) {
      setNotice({ type: "", message: "" });
      setError(err.message || "Ocurrió un error inesperado al iniciar el pago.");
      setLoadingAction("");
    }
  };

  const handleConfirmCashOrder = async () => {
    try {
      setError("");
      setSuccess("");
      setNotice({ type: "", message: "" });

      if (!orderSummary?.order?.id) {
        throw new Error("Primero debes crear la orden pendiente.");
      }

      setLoadingAction("confirm_cash");
      const shippingReference = `checkout:${orderSummary.order.id}`;

      const result = await confirmCashOrder({
        orderId: orderSummary.order.id,
        shippingReference,
      });

      const normalizedStatus = String(result?.status || "").toLowerCase();

      if (normalizedStatus.includes("pending")) {
        setNotice({
          type: "warning",
          message: "La compra quedó pendiente de validación. Te notificaremos cuando se confirme.",
        });
      } else {
        setNotice({ type: "", message: "" });
      }

      setSuccess(`Compra confirmada. Estado final: ${getOrderStatusLabel(result.status)}.`);
      setTimeout(() => navigate("/orders"), 1000);
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado al confirmar la compra.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="checkout-page">
      <h1>Finalizar compra</h1>
      <p>Subtotal carrito: ${total.toFixed(2)}</p>
      <p>Envío estimado: ${shippingCost.toFixed(2)}</p>
      {paymentMethod === "cash" && <p className="checkout-notice checkout-notice-info">Pago a acordar con el vendedor</p>}

      <AddressStep address={address} onChange={updateAddress} />
      <ShippingStep
        shippingMethod={shippingMethod}
        onChange={setShippingMethod}
        cashSelected={paymentMethod === "cash"}
      />
      <PaymentStep
        paymentMethod={paymentMethod}
        onMethodChange={setPaymentMethod}
        disabled={isProcessing}
      />

      {!orderSummary ? (
        <button onClick={handleCreateOrder} disabled={isProcessing}>
          {loadingAction === "create_order" ? "Creando orden..." : "Crear orden pendiente"}
        </button>
      ) : paymentMethod === "mercadopago" ? (
        <button onClick={handleMercadoPagoCheckout} disabled={isProcessing}>
          {loadingAction === "start_mp" ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
        </button>
      ) : (
        <ConfirmationStep
          orderSummary={orderSummary}
          onConfirmCash={handleConfirmCashOrder}
          loading={isProcessing}
        />
      )}

      {notice.message && <p className={`checkout-notice checkout-notice-${notice.type}`}>{notice.message}</p>}
      {error && <p className="checkout-error">{error}</p>}
      {success && <p className="checkout-success">{success}</p>}
    </div>
  );
}

export default CheckoutPage;
