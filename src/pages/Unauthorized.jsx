import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Unauthorized = () => {
    const navigate = useNavigate();
    const { role, isAuthenticated } = useAuth();

    return (
        <div style={{
            minHeight: "100vh", display: "flex", justifyContent: "center",
            alignItems: "center", background: "#f6f8fa",
        }}>
            <div style={{
                background: "white", padding: "40px", width: "420px",
                borderRadius: "8px", textAlign: "center", border: "1px solid #e5e7eb",
            }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
                <h2 style={{ fontSize: "20px" }}>Access Denied</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: "12px 0" }}>
                    You do not have permission to access this page.
                </p>
                {role && (
                    <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>
                        Current role: <strong>{role}</strong>
                    </p>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                    <button className="primary-btn" onClick={() => {
                        if (role === "ADMIN") navigate("/admin/dashboard");
                        else if (role === "FIELD" || role === "FIELD_OFFICER") navigate("/field/dashboard");
                        else if (role === "VALIDATOR") navigate("/validator/dashboard");
                        else if (role === "VIEWER") navigate("/user/dashboard");
                        else navigate("/");
                    }}>
                        Go to My Dashboard
                    </button>
                    <button className="secondary-btn" onClick={() => navigate("/")}>
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
