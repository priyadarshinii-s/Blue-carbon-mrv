import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import TopNavbar from "../components/common/TopNavbar";

const viewerMenuItems = [
  { path: "/user/dashboard", label: "Public Dashboard", icon: "📊" },
  { path: "/user/projects", label: "My Projects", icon: "🌿" },
  { path: "/user/credits", label: "Credits Wallet", icon: "💎" },
];

const ViewerLayout = () => {
  return (
    <div className="admin-container">
      <Sidebar items={viewerMenuItems} />
      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default ViewerLayout;