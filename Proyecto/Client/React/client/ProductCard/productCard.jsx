import "./productCard.css";
import "../Skeleton/SkeletonBlock.css";
import { useEffect, useState } from "react";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

const getNormalizedProductImages = (product) => {
  const images = Array.isArray(product?.images)
    ? product.images.map((image) => String(image || "").trim()).filter(Boolean)
    : [];
  const fallbackImage = product?.image_url || product?.image || "";

  if (images.length > 0) return images.slice(0, 3);
  return fallbackImage ? [String(fallbackImage).trim()] : [];
};

function ProductCard({ product }) {
  const { addToCart, isMutatingCart } = useCart();
  const navigate = useNavigate();
  const hasStock = Number(product?.stock || 0) > 0;
  const isActive = product?.active !== false;
  const canBuy = hasStock && isActive;
  const stockLabel = !isActive ? "No disponible" : !hasStock ? "Sin stock" : "En stock";
  const stockClass = !isActive || !hasStock ? "stock-pill stock-pill--off" : "stock-pill";
  const description = typeof product?.description === "string" ? product.description.trim() : "";
  const images = getNormalizedProductImages(product);
  const productImage = images[0] || "";
  const secondaryImage = images[1];
  const hasSecondaryImage = Boolean(secondaryImage);
  const [primaryImageLoaded, setPrimaryImageLoaded] = useState(false);
  const [secondaryImageLoaded, setSecondaryImageLoaded] = useState(false);

  useEffect(() => {
    setPrimaryImageLoaded(false);
  }, [productImage]);

  useEffect(() => {
    setSecondaryImageLoaded(false);
  }, [secondaryImage]);

  const goToProductDetail = () => {
    if (!product?.id) return;
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      className="card"
      onClick={goToProductDetail}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToProductDetail();
        }
      }}
    >
      <div
        className={
          hasSecondaryImage && secondaryImageLoaded
            ? "card__image-wrapper card__image-wrapper--has-hover"
            : "card__image-wrapper"
        }
      >
        {productImage && !primaryImageLoaded && (
          <span className="card__image-placeholder skeleton-block" aria-hidden="true" />
        )}
        {productImage ? (
          <img
            className={
              primaryImageLoaded
                ? "card__image card__image--primary card__image--loaded"
                : "card__image card__image--primary"
            }
            src={productImage}
            alt={product.name}
            onLoad={() => setPrimaryImageLoaded(true)}
          />
        ) : (
          <span className="card__image-fallback">Sin imagen</span>
        )}
        {hasSecondaryImage && (
          <img
            className={
              secondaryImageLoaded
                ? "card__image card__image--secondary card__image--loaded"
                : "card__image card__image--secondary"
            }
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            onLoad={() => setSecondaryImageLoaded(true)}
          />
        )}
      </div>
      <div className="card__body">
        <h3>{product.name}</h3>
        {description && <p className="card__description">{description}</p>}
        <p className="card__price">${product.price}</p>
        <p className={stockClass}>{stockLabel}</p>
      </div>
      <button
        className="card__buy-btn"
        onClick={(event) => {
          event.stopPropagation();
          addToCart(product);
        }}
        disabled={!canBuy || isMutatingCart}
      >
        {!canBuy
          ? !isActive
            ? "Producto inactivo"
            : "Producto agotado"
          : isMutatingCart
            ? "Agregando..."
            : "Agregar al carrito"}
      </button>
    </div>
  );
}
export default ProductCard;
