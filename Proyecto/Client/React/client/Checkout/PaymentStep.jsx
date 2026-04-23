function PaymentStep({ paymentMethod, onMethodChange, disabled = false }) {
  return (
    <section className="checkout-step">
      <h3>3. Pago</h3>
      <div className="checkout-options">
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="mercadopago"
            checked={paymentMethod === "mercadopago"}
            onChange={(e) => onMethodChange(e.target.value)}
            disabled={disabled}
          />
          Mercado Pago
        </label>
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={(e) => onMethodChange(e.target.value)}
            disabled={disabled}
          />
          Efectivo
        </label>
      </div>
    </section>
  );
}

export default PaymentStep;
