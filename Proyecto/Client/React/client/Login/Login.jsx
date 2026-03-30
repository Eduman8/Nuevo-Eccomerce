import { useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import GoogleButton from "../GoogleButton/GoogleButton";

function Login({ setUser }) {
  const googleBtnRef = useRef(null);

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
        });

        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    const btn = googleBtnRef.current?.querySelector("div[role=button]");

    if (btn) {
      btn.click();
    } else {
      console.error("Google button not ready");
    }
  };

  function handleCredentialResponse(response) {
    const data = jwtDecode(response.credential);

    const userData = {
      name: data.name,
      email: data.email,
      googleId: data.sub,
      picture: data.picture,
    };

    fetch("http://localhost:3000/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((dbUser) => {
        setUser(dbUser);
        localStorage.setItem("user", JSON.stringify(dbUser));
      })
      .catch((err) => console.error(err));
  }

  return (
    <>
      <div className="login-card">
        <GoogleButton onClick={handleGoogleLogin} />
      </div>

      <div
        ref={googleBtnRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: 200,
          shape: "fill",
          text: "continue_with",
        }}
      ></div>
    </>
  );
}

export default Login;
