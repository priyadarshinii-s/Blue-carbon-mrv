import { Routes, Route } from "react-router-dom";
import ValidatorLayout from "../layouts/ValidatorLayout";
import ValidatorDashboard from "../pages/validator/ValidatorDashboard";
import VerificationQueue from "../pages/validator/VerificationQueue";
import SubmissionReview from "../pages/validator/SubmissionReview";
import VerificationHistory from "../pages/validator/VerificationHistory";

const ValidatorRoutes = () => (
  <Routes>
    <Route element={<ValidatorLayout />}>
      <Route path="dashboard" element={<ValidatorDashboard />} />
      <Route path="queue" element={<VerificationQueue />} />
      <Route path="review/:id" element={<SubmissionReview />} />
      <Route path="history" element={<VerificationHistory />} />
    </Route>
  </Routes>
);

export default ValidatorRoutes;
