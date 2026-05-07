import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../ProductCard/productCard";
import ProductCardSkeleton from "../ProductCard/ProductCardSkeleton";
import ProductSearchBar from "./ProductSearchBar";
import ProductFilters from "./ProductFilters";
import EmptyProductsState from "./EmptyProductsState";
import "./Products.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_FILTERS = {
  search: "",
  categoryId: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  sort: "newest",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const isNumericId = (value) => /^\d+$/.test(String(value || "").trim());

const filtersFromSearchParams = (searchParams) => ({
  search: searchParams.get("search") || "",
  categoryId: searchParams.get("categoryId") || "",
  minPrice: searchParams.get("minPrice") || "",
  maxPrice: searchParams.get("maxPrice") || "",
  inStock: searchParams.get("inStock") === "true",
  sort: searchParams.get("sort") || "newest",
});

const buildSearchParams = (filters) => {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
  if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
  if (filters.inStock) params.set("inStock", "true");
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
};

const areFiltersEqual = (first, second) =>
  first.search === second.search &&
  first.categoryId === second.categoryId &&
  first.minPrice === second.minPrice &&
  first.maxPrice === second.maxPrice &&
  first.inStock === second.inStock &&
  first.sort === second.sort;

function ProductCatalog({ initialCategory = "", title = "Productos", subtitle = "Explorá la colección completa." }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialCategoryApplied, setInitialCategoryApplied] = useState(!initialCategory);

  const currentCategoryName = useMemo(() => {
    const selected = categories.find((category) => String(category.id) === String(filters.categoryId));
    if (selected?.name) return selected.name;
    if (filters.categoryId && title && !isNumericId(title)) return title;
    return "Todos nuestros productos";
  }, [categories, filters.categoryId, title]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(payload?.error || "No se pudieron cargar las categorías.");
        if (isMounted) setCategories(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Error cargando categorías:", error);
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setCategoriesLoaded(true);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const parsedFilters = filtersFromSearchParams(searchParams);
    setFilters((current) => (areFiltersEqual(current, parsedFilters) ? current : parsedFilters));
  }, [searchParams]);

  useEffect(() => {
    if (!initialCategory || !categoriesLoaded || initialCategoryApplied) return;
    if (searchParams.has("categoryId")) {
      setInitialCategoryApplied(true);
      return;
    }

    const decodedCategory = String(initialCategory || "");
    const matchedCategory = categories.find((category) => {
      if (isNumericId(decodedCategory)) return Number(category.id) === Number(decodedCategory);
      return normalizeText(category.name) === normalizeText(decodedCategory);
    });
    const categoryId = matchedCategory?.id || (isNumericId(decodedCategory) ? decodedCategory : "");

    setFilters((current) => ({ ...current, categoryId: categoryId ? String(categoryId) : current.categoryId }));
    setInitialCategoryApplied(true);
  }, [categories, categoriesLoaded, initialCategory, initialCategoryApplied, searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    const nextParams = buildSearchParams(debouncedFilters);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedFilters, searchParams, setSearchParams]);

  useEffect(() => {
    if (!initialCategoryApplied) return;

    const controller = new AbortController();
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setErrorMessage("");

      try {
        const params = buildSearchParams(debouncedFilters);
        const queryString = params.toString();
        const response = await fetch(`${API_BASE_URL}/products${queryString ? `?${queryString}` : ""}`, {
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(payload?.error || "No se pudieron cargar los productos.");
        }

        setProducts(Array.isArray(payload) ? payload : []);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error cargando productos:", error);
        setProducts([]);
        setErrorMessage(error.message || "No se pudieron cargar los productos.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingProducts(false);
      }
    };

    loadProducts();

    return () => controller.abort();
  }, [debouncedFilters, initialCategoryApplied]);

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedFilters(DEFAULT_FILTERS);
  };

  return (
    <section className="product-catalog">
      <header className="product-catalog__header">
        <p className="product-catalog__eyebrow">Catálogo</p>
        <h2>{currentCategoryName}</h2>
        <p>{subtitle}</p>
      </header>

      <div className="product-catalog__toolbar">
        <ProductSearchBar value={filters.search} onChange={(search) => setFilters((current) => ({ ...current, search }))} />
        <p className="product-catalog__count" aria-live="polite">
          {isLoadingProducts ? "Buscando productos..." : `${products.length} resultado${products.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="product-catalog__layout">
        <ProductFilters
          categories={categories}
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen((isOpen) => !isOpen)}
        />

        <div className="product-catalog__results">
          {isLoadingProducts ? (
            <div className="product-catalog__grid" aria-label="Cargando productos">
              {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          ) : errorMessage ? (
            <EmptyProductsState isError message={errorMessage} />
          ) : products.length > 0 ? (
            <div className="product-catalog__grid">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <EmptyProductsState
              message="Probá ajustar la búsqueda, cambiar el rango de precio o limpiar los filtros."
              onClear={handleClearFilters}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductCatalog;
