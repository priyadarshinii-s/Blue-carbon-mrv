import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import TopNavbar from "../components/common/TopNavbar";

const validatorMenuItems = [
  { path: "/validator/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/validator/queue", label: "Verification Queue", icon: "📋" },
  { path: "/validator/history", label: "My Verified", icon: "✅" },
];

const ValidatorLayout = () => {
  return (
    <div className="admin-container">
      <Sidebar items={validatorMenuItems} />
      <main className="content">
        <TopNavbar />
        <Outlet />
      </main>
    </div>
  );
};

export default ValidatorLayout;
