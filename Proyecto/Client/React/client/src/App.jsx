import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../Home/Home";
import Orders from "../Pages/Orders";
import CategoryPage from "../CategoryPage/CategoryPage";
import ProtectedRoute from "../ProtectedRoute";
import Navbar from "../Navbar/Navbar";
import { CartProvider } from "../Context/CartContext";

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

  return (
    <BrowserRouter>
      <CartProvider user={user}>
        <Navbar user={user} setUser={setUser} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<CategoryPage />} />

          <Route
            path="/orders"
            element={
              <ProtectedRoute user={user}>
                <Orders user={user} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
