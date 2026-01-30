import { Routes, Route, Navigate } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import FieldRoutes from "./routes/FieldRoutes";
import ValidatorRoutes from "./routes/ValidatorRoutes";
import ViewerRoutes from "./routes/ViewerRoutes";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/field/*"
        element={
          <ProtectedRoute allowedRole="FIELD">
            <FieldRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/validator/*"
        element={
          <ProtectedRoute allowedRole="VALIDATOR">
            <ValidatorRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/viewer/*"
        element={
          <ProtectedRoute allowedRole="VIEWER">
            <ViewerRoutes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
