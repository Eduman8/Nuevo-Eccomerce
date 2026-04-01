function ConfirmationStep({ orderSummary, shippingReference, onShippingReferenceChange, onConfirm, loading }) {
  return (
    <section className="checkout-step">
      <h3>4. Confirmación</h3>
      <p>
        Orden <strong>#{orderSummary?.order?.id}</strong> en estado <strong>{orderSummary?.order?.status}</strong>
      </p>
      <p>
        Total final: <strong>${orderSummary?.breakdown?.total?.toFixed(2)}</strong>
      </p>

      <input
        placeholder="Referencia de envío"
        value={shippingReference}
        onChange={(e) => onShippingReferenceChange(e.target.value)}
      />

      <button onClick={onConfirm} disabled={loading}>
        {loading ? "Confirmando..." : "Confirmar compra"}
      </button>
    </section>
  );
}

export default ConfirmationStep;
