import { useEffect, useState } from "react";
import "../Skeleton/SkeletonBlock.css";
import { Link } from "react-router-dom";
import "./CategoryCard.css";

function CategoryCard({ title, image, category }) {
  const [hasImageError, setHasImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasImage = Boolean(image) && !hasImageError;
  const categoryPath = encodeURIComponent(String(category || title || "").toLowerCase());

  useEffect(() => {
    setHasImageError(false);
    setImageLoaded(false);
  }, [image]);

  return (
    <Link to={`/category/${categoryPath}`} className="category-card">
      {hasImage ? (
        <div className="category-card__image-frame">
          {!imageLoaded && <span className="category-card__image-placeholder skeleton-block" aria-hidden="true" />}
          <img
            className={imageLoaded ? "category-card__image--loaded" : ""}
            src={image}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasImageError(true)}
          />
        </div>
      ) : (
        <div className="category-card__image-fallback" aria-label={`Sin imagen para ${title}`}>
          <span>{String(title || "?").trim().charAt(0).toUpperCase() || "?"}</span>
        </div>
      )}
      <div className="category-card__body">
        <h3>{title}</h3>
        <p>Ver colección</p>
      </div>
    </Link>
  );
}

export default CategoryCard;
