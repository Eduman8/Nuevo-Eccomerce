import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, children, redirectTo = "/", condition = true }) {
  if (!user || !condition) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

export default ProtectedRoute;
