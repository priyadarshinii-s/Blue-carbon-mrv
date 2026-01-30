import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TopNavbar from "../components/common/TopNavbar";

const FieldOfficerLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2 className="logo">Blue Carbon MRV</h2>

        <nav>
          <NavLink to="/field/dashboard">Dashboard</NavLink>
          <NavLink to="/field/projects">Assigned Projects</NavLink>
          <NavLink to="/field/new">New Submission</NavLink>
          <NavLink to="/field/history">Submission History</NavLink>
        </nav>

        <button className="logout-link" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default FieldOfficerLayout;
