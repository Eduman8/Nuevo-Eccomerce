import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../ProductCard/productCard";
import ProductCardSkeleton from "../ProductCard/ProductCardSkeleton";
import "./CategoryPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const normalizeCategory = (value) => String(value || "").trim().toLowerCase();
const isNumericId = (value) => /^\d+$/.test(String(value || "").trim());

function CategoryPage({ addToCart }) {
  const { category } = useParams();
  const selectedCategory = useMemo(() => {
    try {
      return decodeURIComponent(category || "");
    } catch {
      return category || "";
    }
  }, [category]);

  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState(selectedCategory);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const normalizedSelectedCategory = normalizeCategory(selectedCategory);

    const loadCategoryProducts = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setCategoryName(selectedCategory);

      try {
        const [productsResult, categoriesResult] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/products`).then(async (res) => {
            const payload = await res.json().catch(() => []);
            if (!res.ok) {
              throw new Error(payload?.error || "No se pudieron cargar los productos.");
            }
            return Array.isArray(payload) ? payload : [];
          }),
          fetch(`${API_BASE_URL}/categories`).then(async (res) => {
            const payload = await res.json().catch(() => []);
            if (!res.ok) return [];
            return Array.isArray(payload) ? payload : [];
          }),
        ]);

        if (productsResult.status === "rejected") {
          throw productsResult.reason;
        }

        const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const matchedCategory = categories.find((item) => {
          if (isNumericId(selectedCategory)) {
            return Number(item.id) === Number(selectedCategory);
          }

          return normalizeCategory(item.name) === normalizedSelectedCategory;
        });

        const filtered = productsResult.value.filter((product) => {
          if (matchedCategory?.id && product.category_id) {
            return Number(product.category_id) === Number(matchedCategory.id);
          }

          if (matchedCategory?.name) {
            return (
              normalizeCategory(product.category_name || product.category) ===
              normalizeCategory(matchedCategory.name)
            );
          }

          return (
            !isNumericId(selectedCategory) &&
            normalizeCategory(product.category) === normalizedSelectedCategory
          );
        });

        if (isMounted) {
          setCategoryName(matchedCategory?.name || selectedCategory);
          setProducts(filtered);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
        if (isMounted) {
          setProducts([]);
          setErrorMessage(err.message || "No se pudieron cargar los productos.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  return (
    <section className="category-products">
      <header className="category-products__header">
        <h2>{categoryName}</h2>
        <p>Encontrá piezas seleccionadas para sumar a tu carrito.</p>
      </header>

      <div className="category-products__grid">
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)
        ) : errorMessage ? (
          <p className="category-products__empty">{errorMessage}</p>
        ) : products.length > 0 ? (
          products.map((p) => (
            <ProductCard key={p.id} product={p} addToCart={addToCart} />
          ))
        ) : (
          <p className="category-products__empty">No hay productos disponibles por ahora.</p>
        )}
      </div>
    </section>
  );
}

export default CategoryPage;
