import { Link } from "react-router-dom";
import "./CategoryCard.css";

function CategoryCard({ title, image, category }) {
  return (
    <Link to={`/category/${category}`} className="category-card">
      <img src={image} alt={title} />
      <div className="category-card__body">
        <h3>{title}</h3>
        <p>Ver colección</p>
      </div>
    </Link>
  );
}

export default CategoryCard;
