import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Login from "../Login/Login";
import { useCart } from "../Hooks/useCart";
import "./Navbar.css";

function Navbar({ user, setUser }) {
  const [theme, setTheme] = useState("light");
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const loginRef = useRef();
  const cartRef = useRef();

  const { cart, total, removeFromCart, checkout } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // 🌙 THEME
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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // cerrar dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (loginRef.current && !loginRef.current.contains(e.target)) {
        setShowLogin(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setShowCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h2 className="logo">Ecommerce</h2>

        <div className="links">
          <Link to="/">Home</Link>
          {user && <Link to="/orders">Pedidos</Link>}
        </div>
      </div>

      <div className="nav-right">
        {/* 🌙 */}
        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* 🛒 */}
        <div className="cart-container" ref={cartRef}>
          <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
            🛒
            {itemCount > 0 && <span className="badge">{itemCount}</span>}
          </button>

          {showCart && (
            <div className="cart-dropdown">
              <h4>Carrito</h4>

              {cart.length === 0 ? (
                <p className="empty">Vacío</p>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.id} className="cart-item">
                        <div>
                          <p>{item.name}</p>
                          <span>
                            ${item.price} x {item.quantity}
                          </span>
                        </div>

                        <button onClick={() => removeFromCart(item.id)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="cart-footer">
                    <strong>Total: ${total}</strong>
                    <button className="checkout" onClick={checkout}>
                      Comprar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 🔐 */}
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
  );
}

export default Navbar;
