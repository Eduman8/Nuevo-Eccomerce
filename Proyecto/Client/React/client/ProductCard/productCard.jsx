import "./productCard.css";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

function productCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div
      className="card"
      onClick={() => navigate(`/category/${product.category}`)}
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => addToCart(product)}>Agregar al carrito</button>
    </div>
  );
}
export default productCard;
