import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./productCard.css";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {
  const { addToCart, isMutatingCart } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const hasStock = Number(product?.stock || 0) > 0;
  const isActive = product?.active !== false;
  const canBuy = hasStock && isActive;
  const stockLabel = !isActive ? "No disponible" : !hasStock ? "Sin stock" : "En stock";
  const stockClass = !isActive || !hasStock ? "stock-pill stock-pill--off" : "stock-pill";
  const description = typeof product?.description === "string" ? product.description.trim() : "";
  const productImages = Array.isArray(product?.images)
    ? product.images.map((image) => String(image || "").trim()).filter(Boolean)
    : [];
  const fallbackImage = product?.image_url || product?.image || "";
  const productImage = productImages[0] || fallbackImage;
  const secondaryImage = productImages[1];
  const hasSecondaryImage = Boolean(secondaryImage);

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    if (!selectedImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage]);

  return (
    <>
      <div
        className="card"
        onClick={() =>
          navigate(`/category/${product.category_id || encodeURIComponent(product.category)}`)
        }
      >
        <div
          className={
            hasSecondaryImage
              ? "card__image-wrapper card__image-wrapper--has-hover"
              : "card__image-wrapper"
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelectedImage(productImage);
          }}
        >
          <img
            className="card__image card__image--primary"
            src={productImage}
            alt={product.name}
          />
          {hasSecondaryImage && (
            <img
              className="card__image card__image--secondary"
              src={secondaryImage}
              alt=""
              aria-hidden="true"
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

      {selectedImage &&
        createPortal(
          <div
            className="product-image-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={closeLightbox}
          >
            <button
              type="button"
              className="product-image-lightbox__close"
              onClick={closeLightbox}
              aria-label="Cerrar imagen"
            >
              ×
            </button>

            <img
              className="product-image-lightbox__image"
              src={selectedImage}
              alt={product.name}
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
export default ProductCard;
