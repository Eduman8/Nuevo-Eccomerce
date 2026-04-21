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

import { useState, useEffect } from "react";
import "../Styles/global.css";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  function AdminRoute({ user, children }) {
    if (!user) return <Navigate to="/" replace />;
    if (user.role !== "admin") return <Navigate to="/" replace />;
    return children;
  }
  console.log("USER APP:", user);
  console.log("USER ROLE:", user?.role);
  return (
    <NotificationProvider>
      <BrowserRouter>
        <CartProvider user={user}>
          <Navbar user={user} setUser={setUser} />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:category" element={<CategoryPage />} />

            <Route
              path="/admin"
              element={
                <AdminRoute user={user}>
                  <AdminPanel user={user} />
                </AdminRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute user={user}>
                  <Orders user={user} />
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
