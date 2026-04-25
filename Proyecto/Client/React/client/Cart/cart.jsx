import "./Cart.css";
import { useCart } from "../Hooks/useCart";
import { useNavigate } from "react-router-dom";

function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, total, checkout } = useCart();
  const safeCartItems = (Array.isArray(cart) ? cart : [])
    .filter(Boolean)
    .filter(
      (item) =>
        item?.id !== null &&
        item?.id !== undefined &&
        item?.id !== "" &&
        item?.id !== "undefined",
    );

  return (
    <div className="cart">
      <h2>Carrito</h2>

      {safeCartItems.length === 0 ? (
        <p>Vacío</p>
      ) : (
        <>
          {safeCartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>${item.price * item.quantity}</span>

              <button onClick={() => removeFromCart(item.id)}>❌</button>
            </div>
          ))}

          <h3>Total: ${total}</h3>

          <button onClick={() => { checkout(); navigate("/checkout"); }}>Ir al checkout</button>
        </>
      )}
    </div>
  );
}

export default Cart;
