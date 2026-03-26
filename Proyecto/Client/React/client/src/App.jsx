import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
import Orders from "../Pages/Orders";
import { useState, useEffect } from "react";
import ProtectedRoute from "../ProtectedRoute";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home user={user} setUser={setUser} />} />

        <Route
          path="/orders"
          element={
            <ProtectedRoute user={user}>
              <Orders user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
