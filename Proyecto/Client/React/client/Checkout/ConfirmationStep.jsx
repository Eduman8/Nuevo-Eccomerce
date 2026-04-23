import { getOrderStatusLabel } from "../utils/orderLabels";

function ConfirmationStep({ orderSummary, onConfirmCash, loading }) {
  return (
    <section className="checkout-step">
      <h3>4. Confirmación</h3>
      <p>
        Orden <strong>#{orderSummary?.order?.id}</strong> en estado <strong>{getOrderStatusLabel(orderSummary?.order?.status)}</strong>
      </p>
      <p>
        Total final: <strong>${orderSummary?.breakdown?.total?.toFixed(2)}</strong>
      </p>

      <button onClick={onConfirmCash} disabled={loading}>
        {loading ? "Confirmando pedido..." : "Confirmar pedido"}
      </button>
    </section>
  );
}

export default ConfirmationStep;
