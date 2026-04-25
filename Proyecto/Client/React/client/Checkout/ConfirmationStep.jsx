function ConfirmationStep({ orderSummary, onConfirmCash, loading }) {
  return (
    <section className="checkout-step">
      <h3>4. Confirmación</h3>
      <p>
        Compra lista para confirmación final.
      </p>
      <p>
        Total final: <strong>${orderSummary?.breakdown?.total?.toFixed(2)}</strong>
      </p>

      <button className="checkout-btn-primary" onClick={onConfirmCash} disabled={loading}>
        {loading ? "Confirmando pedido..." : "Confirmar pedido"}
      </button>
    </section>
  );
}

export default ConfirmationStep;
