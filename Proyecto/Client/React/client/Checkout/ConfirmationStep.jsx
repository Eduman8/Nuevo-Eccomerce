function ConfirmationStep({ orderSummary, shippingReference, onShippingReferenceChange, onConfirmCash, loading }) {
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
        placeholder="Referencia de envío / observación"
        value={shippingReference}
        onChange={(e) => onShippingReferenceChange(e.target.value)}
        disabled={loading}
      />

      <button onClick={onConfirmCash} disabled={loading}>
        {loading ? "Confirmando pedido..." : "Confirmar pedido"}
      </button>
    </section>
  );
}

export default ConfirmationStep;
