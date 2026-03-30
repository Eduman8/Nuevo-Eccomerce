import "./GoogleButton.css";

function GoogleButton({ onClick }) {
  return (
    <button className="google-btn" onClick={onClick}>
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
      />
      <span>Continuar con Google</span>
    </button>
  );
}

export default GoogleButton;
