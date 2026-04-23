import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import { useCart } from "../Hooks/useCart";
import { isAdminUser } from "../utils/adminAccess";
import "./Navbar.css";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const loginRef = useRef();
  const cartRef = useRef();

  const {
    cart,
    total,
    cartLoading,
    cartError,
    isMutatingCart,
    removeFromCart,
    decreaseFromCart,
    checkout,
  } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      const defaultTheme = prefersDark ? "dark" : "light";
      setTheme(defaultTheme);
      document.documentElement.setAttribute("data-theme", defaultTheme);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", showCart);
    return () => document.body.classList.remove("no-scroll");
  }, [showCart]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setShowLogin(false);
      }

      if (
        showCart &&
        cartRef.current &&
        !cartRef.current.contains(e.target) &&
        !e.target.closest(".cart-btn")
      ) {
        setShowCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCart]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <h2 className="logo">HARTA</h2>

          <div className="links">
            <Link to="/">Home</Link>
            {isAdminUser(user) && <Link to="/admin">Admin</Link>}
            {user && <Link to="/orders">Pedidos</Link>}
          </div>
        </div>

        <div className="nav-right">
          <button className="theme-btn" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <div className="cart-container">
            <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
              🛒
              {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </button>
          </div>

          <div className="auth" ref={loginRef}>
            {!user ? (
              <>
                <button
                  className="login-btn"
                  onClick={() => setShowLogin(!showLogin)}
                >
                  Ingresar ▼
                </button>

                {showLogin && (
                  <div className="dropdown">
                    <Login
                      setUser={(userData) => {
                        setUser(userData);
                        setShowLogin(false);
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="user-box">
                {user.picture && <img src={user.picture} alt="user" />}
                <span>{user.name}</span>
                <button onClick={() => setUser(null)}>Salir</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showCart && <div className="cart-overlay" onClick={() => setShowCart(false)} />}

      <aside className={`sidecart ${showCart ? "open" : ""}`} ref={cartRef}>
        <div className="sidecart-header">
          <h4>Carrito</h4>
          <button onClick={() => setShowCart(false)} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        {cartLoading ? (
          <p className="empty">Cargando carrito...</p>
        ) : cartError ? (
          <p className="empty cart-error">{cartError}</p>
        ) : cart.length === 0 ? (
          <p className="empty">Tu carrito está vacío.</p>
        ) : (
          <>
            {isMutatingCart && <p className="cart-status">Actualizando carrito...</p>}

            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <p>{item.name}</p>
                    <span>${item.price} c/u</span>
                  </div>

                  <div className="quantity-controls">
                    <button
                      onClick={() => decreaseFromCart(item.id)}
                      disabled={isMutatingCart}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={isMutatingCart}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <strong>Total: ${total}</strong>
              <button
                className="checkout"
                disabled={isMutatingCart}
                onClick={() => {
                  checkout();
                  setShowCart(false);
                  navigate("/checkout");
                }}
              >
                Ir al checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default Navbar;
