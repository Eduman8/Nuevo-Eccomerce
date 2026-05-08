import { getShippingMethodLabel } from "../utils/orderLabels";
import { HOME_DELIVERY_FIXED_COST, PICKUP_LOCATION_LABEL } from "./checkout.config";

function ShippingStep({ shippingMethod, onChange, cashSelected = false, contactInfo, onContactChange }) {
  const options = [
    {
      value: "pickup",
      label: getShippingMethodLabel("pickup"),
      price: "$0",
      badge: "Recomendado",
      description: `Retirás tu pedido en ${PICKUP_LOCATION_LABEL}.`,
    },
    {
      value: "home_delivery",
      label: getShippingMethodLabel("home_delivery"),
      price: `$${HOME_DELIVERY_FIXED_COST.toLocaleString("es-AR")}`,
      description: "Sujeto a disponibilidad y coordinación con la tienda.",
    },
  ];

  return (
    <section className="checkout-step">
      <h3>1. Método de entrega</h3>
      <div className="checkout-delivery-cards">
        {options.map((option) => {
          const disabled = cashSelected && option.value === "home_delivery";

          return (
            <label
              key={option.value}
              className={`checkout-delivery-card ${shippingMethod === option.value ? "checkout-delivery-card-active" : ""} ${disabled ? "checkout-delivery-card-disabled" : ""}`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={option.value}
                checked={shippingMethod === option.value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
              />
              <span className="checkout-delivery-card-content">
                <span className="checkout-delivery-card-header">
                  <strong>{option.label}</strong>
                  {option.badge && <span className="checkout-badge">{option.badge}</span>}
                </span>
                <span>{option.description}</span>
                <strong>{option.price}</strong>
              </span>
            </label>
          );
        })}
      </div>

      {cashSelected && (
        <p className="checkout-notice checkout-notice-warning">
          El pago en efectivo está disponible solo para retiro en local.
        </p>
      )}

      {shippingMethod === "pickup" && (
        <div className="checkout-pickup-info">
          <p>Retirás tu pedido en {PICKUP_LOCATION_LABEL}.</p>
          <p>Coordinaremos el retiro cuando tu pedido esté confirmado.</p>
          <div className="checkout-grid">
            <input
              placeholder="Nombre de contacto"
              value={contactInfo.name}
              onChange={(e) => onContactChange("name", e.target.value)}
            />
            <input
              placeholder="Teléfono de contacto"
              value={contactInfo.phone}
              onChange={(e) => onContactChange("phone", e.target.value)}
            />
          </div>
          <input
            placeholder="Nota opcional"
            value={contactInfo.note}
            onChange={(e) => onContactChange("note", e.target.value)}
          />
        </div>
      )}
    </section>
  );
}

export default ShippingStep;
