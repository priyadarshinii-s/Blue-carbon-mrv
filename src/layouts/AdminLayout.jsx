import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./adminLayout.css";
import { useAuth } from "../context/AuthContext";
import TopNavbar from "../components/common/TopNavbar";

const AdminLayout = () => {
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
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/projects">Projects</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/approvals">Mint Approvals</NavLink>
          <NavLink to="/admin/reports">Reports</NavLink>
        </nav>
         {/* subtle logout */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            className="logout-link"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
