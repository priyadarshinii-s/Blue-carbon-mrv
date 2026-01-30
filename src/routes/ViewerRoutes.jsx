import { Routes, Route } from "react-router-dom";
import ViewerLayout from "../layouts/ViewerLayout";
import ViewerDashboard from "../pages/viewer/ViewerDashboard";
import ViewerProjects from "../pages/viewer/ViewerProjects";

const ViewerRoutes = () => (
  <Routes>
    <Route element={<ViewerLayout />}>
      <Route path="dashboard" element={<ViewerDashboard />} />
      <Route path="projects" element={<ViewerProjects />} />
    </Route>
  </Routes>
);

export default ViewerRoutes;
