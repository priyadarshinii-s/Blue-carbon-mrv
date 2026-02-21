import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: "100vh", display: "flex", justifyContent: "center",
            alignItems: "center", background: "#f6f8fa",
        }}>
            <div style={{
                background: "white", padding: "40px", width: "420px",
                borderRadius: "8px", textAlign: "center", border: "1px solid #e5e7eb",
            }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                <h2 style={{ fontSize: "24px" }}>404</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: "12px 0 24px" }}>
                    The page you're looking for doesn't exist.
                </p>
                <button className="primary-btn" onClick={() => navigate("/")}>
                    Go Home
                </button>
            </div>
        </div>
    );
};

export default NotFound;
