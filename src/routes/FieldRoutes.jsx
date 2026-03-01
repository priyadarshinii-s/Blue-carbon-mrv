import { Route } from "react-router-dom";
import FieldOfficerLayout from "../layouts/FieldOfficerLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import FieldDashboard from "../pages/field/FieldDashboard";
import AssignedProjects from "../pages/field/AssignedProjects";
import NewSubmission from "../pages/field/NewSubmission";
import SubmissionHistory from "../pages/field/SubmissionHistory";

const FieldRoutes = () => (
  <Route
    path="/field"
    element={
      <ProtectedRoute allowedRoles={["FIELD_OFFICER", "ADMIN"]}>
        <FieldOfficerLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<FieldDashboard />} />
    <Route path="dashboard" element={<FieldDashboard />} />
    <Route path="projects" element={<AssignedProjects />} />
    <Route path="submit" element={<NewSubmission />} />
    <Route path="history" element={<SubmissionHistory />} />
  </Route>
);

export default FieldRoutes;
