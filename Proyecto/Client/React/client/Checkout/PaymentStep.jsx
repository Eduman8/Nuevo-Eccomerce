function PaymentStep({ paymentMethod, paymentToken, onMethodChange, onTokenChange }) {
  return (
    <section className="checkout-step">
      <h3>3. Pago</h3>
      <div className="checkout-options">
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={paymentMethod === "card"}
            onChange={(e) => onMethodChange(e.target.value)}
          />
          Tarjeta
        </label>
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="mercadopago"
            checked={paymentMethod === "mercadopago"}
            onChange={(e) => onMethodChange(e.target.value)}
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
          />
          Contra entrega
        </label>
      </div>

      <input
        placeholder="Token de pago (simulado)"
        value={paymentToken}
        onChange={(e) => onTokenChange(e.target.value)}
      />
    </section>
  );
}

export default PaymentStep;
