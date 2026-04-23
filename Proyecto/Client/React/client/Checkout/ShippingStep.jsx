function ShippingStep({ shippingMethod, onChange, cashSelected = false }) {
  const options = [
    { value: "home_delivery", label: "Envío a domicilio - $3.000" },
    { value: "pickup", label: "Retirar en local - $0" },
  ];

  return (
    <section className="checkout-step">
      <h3>2. Método de envío</h3>
      <div className="checkout-options">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="shippingMethod"
              value={option.value}
              checked={shippingMethod === option.value}
              disabled={cashSelected && option.value === "home_delivery"}
              onChange={(e) => onChange(e.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </section>
  );
}

export default ShippingStep;
