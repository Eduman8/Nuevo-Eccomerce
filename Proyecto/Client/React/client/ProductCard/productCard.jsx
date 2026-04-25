import "./productCard.css";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

function productCard({ product }) {
  const { addToCart, isMutatingCart } = useCart();
  const navigate = useNavigate();
  const hasStock = Number(product?.stock || 0) > 0;
  const isActive = product?.active !== false;
  const canBuy = hasStock && isActive;
  const stockLabel = !isActive ? "No disponible" : !hasStock ? "Sin stock" : "En stock";
  const stockClass = !isActive || !hasStock ? "stock-pill stock-pill--off" : "stock-pill";

  return (
    <div
      className="card"
      onClick={() => navigate(`/category/${product.category}`)}
    >
      <img src={product.image} alt={product.name} />
      <div className="card__body">
        <h3>{product.name}</h3>
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
export default productCard;
