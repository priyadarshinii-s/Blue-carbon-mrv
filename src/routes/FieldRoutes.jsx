import { Routes, Route } from "react-router-dom";
import FieldOfficerLayout from "../layouts/FieldOfficerLayout";
import FieldDashboard from "../pages/field/FieldDashboard";
import AssignedProjects from "../pages/field/AssignedProjects";
import NewSubmission from "../pages/field/NewSubmission";
import SubmissionHistory from "../pages/field/SubmissionHistory";

const FieldRoutes = () => (
  <Routes>
    <Route element={<FieldOfficerLayout />}>
      <Route path="dashboard" element={<FieldDashboard />} />
      <Route path="projects" element={<AssignedProjects />} />
      <Route path="new" element={<NewSubmission />} />
      <Route path="history" element={<SubmissionHistory />} />
    </Route>
  </Routes>
);

export default FieldRoutes;
