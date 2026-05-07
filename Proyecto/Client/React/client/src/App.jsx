import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "../Home/Home";
import Orders from "../Pages/Orders";
import CategoryPage from "../CategoryPage/CategoryPage";
import ProductsPage from "../Products/ProductsPage";
import ProductDetailPage from "../ProductDetail/ProductDetailPage";
import ProtectedRoute from "../ProtectedRoute";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { CartProvider } from "../Context/CartContext.jsx";
import AdminPanel from "../Admin/AdminPanel";
import AdminOrdersPage from "../Admin/AdminOrdersPage";
import AdminCategoriesPage from "../Admin/AdminCategoriesPage";
import CheckoutPage from "../Checkout/CheckoutPage";
import { NotificationProvider } from "../Notifications/NotificationProvider";
import { clearStoredAuth } from "../utils/authSession";

import { useState, useEffect, useCallback } from "react";
import "../Styles/global.css";
import "./App.css";

function AppLayout({ user, setUser, handleSessionExpired }) {
  const { pathname } = useLocation();
  const hideFooter =
    pathname.startsWith("/admin") || pathname.startsWith("/checkout");

  function AdminRoute({ user, children }) {
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== "admin") return <Navigate to="/" replace />;
    return children;
  }

  return (
    <div className="app-shell">
      <Navbar user={user} setUser={setUser} />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          <Route
            path="/admin"
            element={
              <AdminRoute user={user}>
                <AdminPanel user={user} onSessionExpired={handleSessionExpired} />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <AdminRoute user={user}>
                <AdminCategoriesPage onSessionExpired={handleSessionExpired} />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute user={user}>
                <AdminOrdersPage onSessionExpired={handleSessionExpired} />
              </AdminRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute user={user}>
                <Orders user={user} onSessionExpired={handleSessionExpired} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute user={user}>
                <CheckoutPage user={user} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleSessionExpired = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <CartProvider user={user} onSessionExpired={handleSessionExpired}>
          <AppLayout
            user={user}
            setUser={setUser}
            handleSessionExpired={handleSessionExpired}
          />
        </CartProvider>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
