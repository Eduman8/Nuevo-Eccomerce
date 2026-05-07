import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CategoryCard.css";

function CategoryCard({ title, image, category }) {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(image) && !hasImageError;
  const categoryPath = encodeURIComponent(String(category || title || "").toLowerCase());

  useEffect(() => {
    setHasImageError(false);
  }, [image]);

  return (
    <Link to={`/category/${categoryPath}`} className="category-card">
      {hasImage ? (
        <img src={image} alt={title} onError={() => setHasImageError(true)} />
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
