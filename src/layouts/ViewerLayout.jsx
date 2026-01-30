import { Outlet, NavLink, useNavigate } from "react-router-dom";
import TopNavbar from "../components/common/TopNavbar";
import { useAuth } from "../context/AuthContext";

const ViewerLayout = () => {
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
          <NavLink to="/viewer/dashboard">Dashboard</NavLink>
          <NavLink to="/viewer/projects">Projects</NavLink>
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

export default ViewerLayout;5555