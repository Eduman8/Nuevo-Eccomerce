import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../Home/Home";
import Orders from "../Pages/Orders";
import CategoryPage from "../CategoryPage/CategoryPage";
import ProtectedRoute from "../ProtectedRoute";
import Navbar from "../Navbar/Navbar";
import { CartProvider } from "../Context/CartContext.jsx";
import AdminPanel from "../Admin/AdminPanel";
import CheckoutPage from "../Checkout/CheckoutPage";
import { NotificationProvider } from "../Notifications/NotificationProvider";
import { clearStoredAuth } from "../utils/authSession";

import { useState, useEffect, useCallback } from "react";
import "../Styles/global.css";

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

  function AdminRoute({ user, children }) {
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== "admin") return <Navigate to="/" replace />;
    return children;
  }

  return (
    <NotificationProvider>
      <BrowserRouter>
        <CartProvider user={user} onSessionExpired={handleSessionExpired}>
          <Navbar user={user} setUser={setUser} />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<CategoryPage />} />

            <Route
              path="/admin"
              element={
                <AdminRoute user={user}>
                  <AdminPanel user={user} onSessionExpired={handleSessionExpired} />
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
        </CartProvider>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
