import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";

function Login({ setUser }) {
  const googleBtnRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id:
            "669527047269-lgca3sopn9gq72b41m7emeh3j8lk8a26.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 260,
        });

        setReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const API_BASE_URL = "http://localhost:3000/api";

  function handleCredentialResponse(response) {
    fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: response.credential,
      }),
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error al iniciar sesión");
        }

        if (!data.token) {
          throw new Error("No se recibió token");
        }

        localStorage.setItem("authToken", data.token);
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch((err) => console.error(err));
  }

  return (
    <div className="login-card">
      {!ready && <p>Cargando Google…</p>}
      <div ref={googleBtnRef} />
    </div>
  );
}

export default Login;
