function ShippingStep({ shippingMethod, onChange }) {
  const options = [
    { value: "standard", label: "Standard (2-5 días) - $4.99" },
    { value: "express", label: "Express (24hs) - $9.99" },
    { value: "pickup", label: "Retiro en tienda - $0" },
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
