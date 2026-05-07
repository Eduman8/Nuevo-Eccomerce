import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./productCard.css";
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
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
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || productImage;

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const openLightbox = (index = 0) => {
    const safeIndex = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));
    setCurrentImageIndex(safeIndex);
    setIsLightboxOpen(true);
  };

  const goToImage = (index) => {
    if (!hasMultipleImages) return;
    const total = images.length;
    setCurrentImageIndex(((index % total) + total) % total);
  };

  const showPreviousImage = () => {
    goToImage(currentImageIndex - 1);
  };

  const showNextImage = () => {
    goToImage(currentImageIndex + 1);
  };

  const handleLightboxTouchStart = (event) => {
    if (!hasMultipleImages) return;
    setTouchStartX(event.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleLightboxTouchMove = (event) => {
    if (touchStartX === null) return;
    setTouchDeltaX(event.touches[0].clientX - touchStartX);
  };

  const handleLightboxTouchEnd = () => {
    if (touchStartX === null) return;

    const swipeThreshold = 48;
    if (touchDeltaX > swipeThreshold) {
      showPreviousImage();
    } else if (touchDeltaX < -swipeThreshold) {
      showNextImage();
    }

    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        setTouchStartX(null);
        setTouchDeltaX(0);
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        setCurrentImageIndex((index) => (index - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        setCurrentImageIndex((index) => (index + 1) % images.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, images.length, isLightboxOpen]);

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
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openLightbox(isImageHovered && hasSecondaryImage ? 1 : 0);
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

      {isLightboxOpen &&
        createPortal(
          <div
            className="product-image-lightbox"
            role="dialog"
            aria-modal="true"
            onClick={closeLightbox}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <button
              type="button"
              className="product-image-lightbox__close"
              onClick={closeLightbox}
              aria-label="Cerrar imagen"
            >
              ×
            </button>

            {hasMultipleImages && (
              <button
                type="button"
                className="product-image-lightbox__nav product-image-lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                aria-label="Imagen anterior"
              >
                ‹
              </button>
            )}

            <div className="product-image-lightbox__stage">
              <img
                className="product-image-lightbox__image"
                src={currentImage}
                alt={product.name}
                onClick={(event) => event.stopPropagation()}
              />
            </div>

            {hasMultipleImages && (
              <button
                type="button"
                className="product-image-lightbox__nav product-image-lightbox__nav--next"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            )}

            {hasMultipleImages && (
              <div
                className="product-image-lightbox__gallery"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="product-image-lightbox__counter">
                  {currentImageIndex + 1}/{images.length}
                </p>
                <div className="product-image-lightbox__dots" aria-label="Imágenes del producto">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      className={
                        index === currentImageIndex
                          ? "product-image-lightbox__dot product-image-lightbox__dot--active"
                          : "product-image-lightbox__dot"
                      }
                      onClick={() => goToImage(index)}
                      aria-label={`Ver imagen ${index + 1}`}
                      aria-current={index === currentImageIndex ? "true" : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
export default ProductCard;
