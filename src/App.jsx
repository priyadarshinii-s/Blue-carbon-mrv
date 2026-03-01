import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { CalculationProvider } from "./context/CalculationContext";

import Landing from "./pages/Landing";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AuthModal from "./components/common/AuthModal";

import AdminRoutes from "./routes/AdminRoutes";
import FieldRoutes from "./routes/FieldRoutes";
import ValidatorRoutes from "./routes/ValidatorRoutes";
import ViewerRoutes from "./routes/ViewerRoutes";

const RoleRedirect = () => {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "FIELD" || role === "FIELD_OFFICER") return <Navigate to="/field/dashboard" replace />;
    if (role === "VALIDATOR") return <Navigate to="/validator/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
};

const App = () => {
    return (
        <>
            <CalculationProvider>
                <AuthModal />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/dashboard" element={<RoleRedirect />} />
                    {AdminRoutes()}
                    {FieldRoutes()}
                    {ValidatorRoutes()}
                    {ViewerRoutes()}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </CalculationProvider>
        </>
    );
};

export default App;
