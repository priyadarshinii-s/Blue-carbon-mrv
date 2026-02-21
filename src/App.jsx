import { Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import AdminRoutes from "./routes/AdminRoutes";
import FieldRoutes from "./routes/FieldRoutes";
import ValidatorRoutes from "./routes/ValidatorRoutes";
import ViewerRoutes from "./routes/ViewerRoutes";

const RoleRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (role === "FIELD") return <Navigate to="/field/dashboard" replace />;
  if (role === "VALIDATOR") return <Navigate to="/validator/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      {AdminRoutes()}
      {FieldRoutes()}
      {ValidatorRoutes()}
      {ViewerRoutes()}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
