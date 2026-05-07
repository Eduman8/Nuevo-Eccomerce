import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../ProductCard/productCard";
import ProductImageLightbox from "../ProductCard/ProductImageLightbox";
import { useCart } from "../Hooks/useCart";
import "./ProductDetailPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_TITLE = "#HARTA";

const getProductImages = (product = {}) => {
  const images = Array.isArray(product.images) ? product.images : [];
  const normalizedImages = images
    .map((image) => String(image || "").trim())
    .filter(Boolean);
  const fallbackImage = product.image_url || product.image || "";

  if (normalizedImages.length > 0) return normalizedImages.slice(0, 3);
  return fallbackImage ? [String(fallbackImage).trim()] : [];
};

const formatPrice = (price) => {
  const value = Number(price || 0);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
};

const getStockInfo = (product) => {
  if (product?.active === false) {
    return {
      label: "Producto inactivo",
      description: "Este producto no está disponible para compra por el momento.",
      className: "product-detail__stock product-detail__stock--off",
      canBuy: false,
    };
  }

  const stock = Number(product?.stock || 0);
  if (stock <= 0) {
    return {
      label: "Sin stock",
      description: "No hay unidades disponibles en este momento.",
      className: "product-detail__stock product-detail__stock--off",
      canBuy: false,
    };
  }

  if (stock <= 3) {
    return {
      label: "Poco stock",
      description: `Quedan ${stock} unidad${stock === 1 ? "" : "es"}.`,
      className: "product-detail__stock product-detail__stock--low",
      canBuy: true,
    };
  }

  return {
    label: "En stock",
    description: "Disponible para agregar al carrito.",
    className: "product-detail__stock",
    canBuy: true,
  };
};

function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, isMutatingCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const images = useMemo(() => getProductImages(product || {}), [product]);
  const selectedImage = images[selectedImageIndex] || images[0] || "";
  const stockInfo = getStockInfo(product);
  const categoryLabel = product?.category_name || product?.category || "Sin categoría";

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setSelectedImageIndex(0);
      setLightboxIndex(null);

      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        const payload = await response.json().catch(() => null);

        if (response.status === 404) {
          throw new Error("Producto no encontrado.");
        }

        if (!response.ok) {
          throw new Error(payload?.error || "No se pudo cargar el producto.");
        }

        if (!isMounted) return;
        setProduct(payload);

        fetch(`${API_BASE_URL}/products`)
          .then(async (res) => {
            const productsPayload = await res.json().catch(() => []);
            if (!res.ok) return [];
            return Array.isArray(productsPayload) ? productsPayload : [];
          })
          .then((products) => {
            if (!isMounted) return;
            const related = products
              .filter((item) => {
                const sameCategoryById =
                  payload.category_id && item.category_id && Number(item.category_id) === Number(payload.category_id);
                const sameCategoryByName =
                  !payload.category_id &&
                  String(item.category || "").trim().toLowerCase() ===
                    String(payload.category || "").trim().toLowerCase();

                return (
                  item.id !== payload.id &&
                  item.active !== false &&
                  (sameCategoryById || sameCategoryByName)
                );
              })
              .slice(0, 4);

            setRelatedProducts(related);
          })
          .catch(() => {
            if (isMounted) setRelatedProducts([]);
          });
      } catch (error) {
        console.error("Error cargando producto:", error);
        if (isMounted) {
          setProduct(null);
          setRelatedProducts([]);
          setErrorMessage(error.message || "No se pudo cargar el producto.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    document.title = product?.name ? `${product.name} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [product?.name]);

  if (isLoading) {
    return (
      <section className="product-detail product-detail--state">
        <div className="product-detail__skeleton product-detail__skeleton--image" />
        <div className="product-detail__skeleton-copy">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (errorMessage || !product) {
    return (
      <section className="product-detail product-detail--empty">
        <p className="product-detail__eyebrow">Producto</p>
        <h1>{errorMessage || "Producto no encontrado."}</h1>
        <p>Puede que el producto haya sido eliminado o ya no esté disponible.</p>
        <Link to="/" className="product-detail__back-link">
          Volver al inicio
        </Link>
      </section>
    );
  }

  return (
    <>
      <main className="product-detail">
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Inicio</Link>
          <span>/</span>
          {product.category_id ? (
            <Link to={`/category/${product.category_id}`}>{categoryLabel}</Link>
          ) : (
            <span>{categoryLabel}</span>
          )}
        </nav>

        <section className="product-detail__hero">
          <div className="product-detail__gallery">
            <button
              type="button"
              className="product-detail__main-image"
              onClick={() => setLightboxIndex(selectedImageIndex)}
              aria-label="Abrir galería fullscreen"
              disabled={!selectedImage}
            >
              {selectedImage ? (
                <img src={selectedImage} alt={product.name} />
              ) : (
                <span>Sin imagen</span>
              )}
            </button>

            {images.length > 1 && (
              <div className="product-detail__thumbs" aria-label="Imágenes del producto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={
                      index === selectedImageIndex
                        ? "product-detail__thumb product-detail__thumb--active"
                        : "product-detail__thumb"
                    }
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                    aria-current={index === selectedImageIndex ? "true" : undefined}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="product-detail__info">
            <p className="product-detail__eyebrow">{categoryLabel}</p>
            <h1>{product.name}</h1>
            <p className="product-detail__price">{formatPrice(product.price)}</p>

            <div className="product-detail__meta">
              <div className={stockInfo.className}>
                <strong>{stockInfo.label}</strong>
                <span>{stockInfo.description}</span>
              </div>
              {product.active === false && (
                <p className="product-detail__notice">
                  Producto visible para referencia, pero actualmente inactivo.
                </p>
              )}
            </div>

            {product.description && (
              <div className="product-detail__description">
                <h2>Descripción</h2>
                <p>{product.description}</p>
              </div>
            )}

            <button
              type="button"
              className="product-detail__cta"
              onClick={() => addToCart(product)}
              disabled={!stockInfo.canBuy || isMutatingCart}
            >
              {!stockInfo.canBuy
                ? stockInfo.label
                : isMutatingCart
                  ? "Agregando..."
                  : "Agregar al carrito"}
            </button>
          </aside>
        </section>

        {relatedProducts.length > 0 && (
          <section className="product-detail__related">
            <div className="product-detail__related-header">
              <p className="product-detail__eyebrow">También te puede gustar</p>
              <h2>Productos relacionados</h2>
            </div>
            <div className="product-detail__related-grid">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      {lightboxIndex !== null && (
        <ProductImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          productName={product.name}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

export default ProductDetailPage;
