import "./productCard.css";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

function productCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const hasStock = Number(product?.stock || 0) > 0;

  return (
    <div
      className="card"
      onClick={() => navigate(`/category/${product.category}`)}
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      {!hasStock && <p>Sin stock</p>}
      <button
        onClick={(event) => {
          event.stopPropagation();
          addToCart(product);
        }}
        disabled={!hasStock}
      >
        {hasStock ? "Agregar al carrito" : "Producto agotado"}
      </button>
    </div>
  );
}
export default productCard;
