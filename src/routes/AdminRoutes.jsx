import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProjectManagement from "../pages/admin/ProjectManagement";
import UserManagement from "../pages/admin/UserManagement";
import MintApproval from "../pages/admin/MintApproval";
import Reports from "../pages/admin/Reports";
import CreateProject from "../pages/admin/CreateProject";

const AdminRoutes = () => (
  <Routes>
    <Route element={<AdminLayout />}>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="projects" element={<ProjectManagement />} />
      <Route path="projects/create" element={<CreateProject />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="approvals" element={<MintApproval />} />
      <Route path="reports" element={<Reports />} />
    </Route>
  </Routes>
);

export default AdminRoutes;
