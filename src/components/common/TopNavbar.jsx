import { useAuth } from "../../context/AuthContext";

const roleLabels = {
  ADMIN: "NCCR Admin",
  FIELD: "Field Officer",
  VALIDATOR: "Validator",
  VIEWER: "Community Viewer",
};

const TopNavbar = () => {
  const { role, user } = useAuth();

  return (
    <div className="top-navbar">
      <div>
        <strong>{roleLabels[role]}</strong>
      </div>

      <div className="user-info">
        {user?.email}
      </div>
    </div>
  );
};

export default TopNavbar;
