import { Route } from "react-router-dom";
import ViewerLayout from "../layouts/ViewerLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import UserDashboard from "../pages/user/UserDashboard";
import MyProjects from "../pages/user/MyProjects";
import CreditsWallet from "../pages/user/CreditsWallet";
import UserCreateProject from "../pages/user/CreateProject";

const ViewerRoutes = () => (
  <Route
    path="/user"
    element={
      <ProtectedRoute allowedRoles={["USER", "ADMIN", "FIELD_OFFICER", "VALIDATOR"]}>
        <ViewerLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<UserDashboard />} />
    <Route path="dashboard" element={<UserDashboard />} />
    <Route path="projects" element={<MyProjects />} />
    <Route path="project/new" element={<UserCreateProject />} />
    <Route path="credits" element={<CreditsWallet />} />
  </Route>
);

export default ViewerRoutes;
