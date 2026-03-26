import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

function Login({ setUser }) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "669527047269-lgca3sopn9gq72b41m7emeh3j8lk8a26.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          {
            theme: "outline",
            size: "large",
          },
        );

        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  function handleCredentialResponse(response) {
    console.log("RESPONSE:", response);

    const data = jwtDecode(response.credential);

    console.log("DECODED:", data);

    const userData = {
      name: data.name,
      email: data.email,
      googleId: data.sub,
    };

    console.log("USER DATA:", userData);

    fetch("http://localhost:3000/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })
      .then((res) => res.json())
      .then((dbUser) => {
        console.log("USER DB:", dbUser);
        setUser(dbUser);
      });
  }
  return <div id="googleBtn"></div>;
}

export default Login;
