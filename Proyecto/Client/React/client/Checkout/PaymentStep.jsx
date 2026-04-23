import { getPaymentMethodLabel } from "../utils/orderLabels";

function PaymentStep({ paymentMethod, onMethodChange, disabled = false }) {
  const options = [
    { value: "mercadopago", label: getPaymentMethodLabel("mercadopago") },
    { value: "cash", label: getPaymentMethodLabel("cash") },
  ];

  return (
    <section className="checkout-step">
      <h3>3. Pago</h3>
      <div className="checkout-options">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="paymentMethod"
              value={option.value}
              checked={paymentMethod === option.value}
              onChange={(e) => onMethodChange(e.target.value)}
              disabled={disabled}
            />
            {option.label}
          </label>
        ))}
      </div>
    </section>
  );
}

export default PaymentStep;
