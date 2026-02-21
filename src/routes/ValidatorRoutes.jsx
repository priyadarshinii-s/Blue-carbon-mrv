import { Route } from "react-router-dom";
import ValidatorLayout from "../layouts/ValidatorLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ValidatorDashboard from "../pages/validator/ValidatorDashboard";
import VerificationQueue from "../pages/validator/VerificationQueue";
import VerifiedHistory from "../pages/validator/VerifiedHistory";

const ValidatorRoutes = () => (
  <Route
    path="/validator"
    element={
      <ProtectedRoute allowedRoles={["VALIDATOR", "ADMIN"]}>
        <ValidatorLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<ValidatorDashboard />} />
    <Route path="dashboard" element={<ValidatorDashboard />} />
    <Route path="queue" element={<VerificationQueue />} />
    <Route path="history" element={<VerifiedHistory />} />
  </Route>
);

export default ValidatorRoutes;
