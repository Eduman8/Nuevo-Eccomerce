import { Link } from "react-router-dom";
import "./CategoryCard.css";

function CategoryCard({ title, image, category }) {
  return (
    <Link to={`/category/${category}`} className="category-card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </Link>
  );
}

export default CategoryCard;
