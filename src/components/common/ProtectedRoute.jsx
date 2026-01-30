import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
