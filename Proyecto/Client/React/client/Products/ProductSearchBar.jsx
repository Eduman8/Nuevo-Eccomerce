function ProductSearchBar({ value, onChange }) {
  return (
    <label className="product-search" htmlFor="product-search-input">
      <span className="product-search__icon" aria-hidden="true">⌕</span>
      <input
        id="product-search-input"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar productos..."
        autoComplete="off"
      />
    </label>
  );
}

export default ProductSearchBar;
