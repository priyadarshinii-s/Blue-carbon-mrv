import { Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import ProjectManagement from "../pages/admin/ProjectManagement";
import CreateProject from "../pages/admin/CreateProject";
import MintApproval from "../pages/admin/MintApproval";
import Reports from "../pages/admin/Reports";
import AuditLog from "../pages/admin/AuditLog";

const AdminRoutes = () => (
  <Route
    path="/admin"
    element={
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboard />} />
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="projects" element={<ProjectManagement />} />
    <Route path="projects/create" element={<CreateProject />} />
    <Route path="approvals" element={<MintApproval />} />
    <Route path="reports" element={<Reports />} />
    <Route path="audit" element={<AuditLog />} />
  </Route>
);

export default AdminRoutes;
