import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import TopNavbar from "../components/common/TopNavbar";

const adminMenuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/admin/users", label: "User Management", icon: "👥" },
  { path: "/admin/projects", label: "Projects", icon: "🌿" },
  { path: "/admin/approvals", label: "Mint Approvals", icon: "💎" },
  { path: "/admin/reports", label: "Reports & Exports", icon: "📑" },
  { path: "/admin/audit", label: "Audit Log", icon: "🔍" },
];

const AdminLayout = () => {
  return (
    <div className="admin-container">
      <Sidebar items={adminMenuItems} />
      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
