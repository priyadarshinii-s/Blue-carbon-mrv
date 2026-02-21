import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div style={{ display: "none" }}>
        {(() => { window.location.replace("/login"); return null; })()}
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={{ display: "none" }}>
        {(() => { window.location.replace("/unauthorized"); return null; })()}
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
