const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc", label: "Nombre A-Z" },
  { value: "name_desc", label: "Nombre Z-A" },
];

function ProductFilters({ categories, filters, onChange, onClear, isOpen, onToggle }) {
  const updateField = (field, value) => onChange({ ...filters, [field]: value });
  const activeFiltersCount = [
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.sort && filters.sort !== "newest",
  ].filter(Boolean).length;

  return (
    <aside className="product-filters">
      <button
        type="button"
        className="product-filters__toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}</span>
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      <div className={isOpen ? "product-filters__panel product-filters__panel--open" : "product-filters__panel"}>
        <div className="product-filters__header">
          <h3>Filtros</h3>
          <button type="button" onClick={onClear}>Limpiar filtros</button>
        </div>

        <label className="product-field">
          <span>Categoría</span>
          <select value={filters.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <div className="product-filters__prices">
          <label className="product-field">
            <span>Precio mínimo</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={filters.minPrice}
              onChange={(event) => updateField("minPrice", event.target.value)}
              placeholder="$0"
            />
          </label>

          <label className="product-field">
            <span>Precio máximo</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={filters.maxPrice}
              onChange={(event) => updateField("maxPrice", event.target.value)}
              placeholder="Sin límite"
            />
          </label>
        </div>

        <label className="product-check">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(event) => updateField("inStock", event.target.checked)}
          />
          <span>Solo disponibles</span>
        </label>

        <label className="product-field">
          <span>Ordenar por</span>
          <select value={filters.sort} onChange={(event) => updateField("sort", event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}

export default ProductFilters;
