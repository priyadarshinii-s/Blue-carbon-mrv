import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import TopNavbar from "../components/common/TopNavbar";

const fieldMenuItems = [
  { path: "/field/dashboard", label: "My Dashboard", icon: "📊" },
  { path: "/field/projects", label: "Assigned Projects", icon: "🌿" },
  { path: "/field/submit", label: "Submit New Data", icon: "📝" },
  { path: "/field/history", label: "My Submissions", icon: "📋" },
];

const FieldOfficerLayout = () => {
  return (
    <div className="admin-container">
      <Sidebar items={fieldMenuItems} />
      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default FieldOfficerLayout;
