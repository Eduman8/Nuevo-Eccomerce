function EmptyProductsState({ isError, message, onClear }) {
  return (
    <div className={isError ? "empty-products empty-products--error" : "empty-products"}>
      <span className="empty-products__mark" aria-hidden="true">{isError ? "!" : "⌁"}</span>
      <h3>{isError ? "No pudimos cargar los productos" : "No encontramos resultados"}</h3>
      <p>{message}</p>
      {!isError && (
        <button type="button" onClick={onClear}>Limpiar filtros</button>
      )}
    </div>
  );
}

export default EmptyProductsState;
