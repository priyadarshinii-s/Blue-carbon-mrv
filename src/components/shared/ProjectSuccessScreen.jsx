import { useNavigate } from "react-router-dom";

const ProjectSuccessScreen = ({ projectId, projectName, txHash, isAdmin }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: "70vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center",
        }}>
            <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, #0f766e, #047857)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "40px", marginBottom: "24px",
                boxShadow: "0 0 0 12px rgba(15,118,110,0.1)",
                animation: "pulse 1.5s ease-in-out infinite",
            }}>
                ✓
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f2a44", marginBottom: "8px" }}>
                Project Created Successfully!
            </h1>
            <p style={{ fontSize: "16px", color: "#6b7280", maxWidth: "460px", marginBottom: "24px" }}>
                <strong style={{ color: "#0f2a44" }}>{projectName}</strong> has been registered on the Polygon blockchain.
            </p>

            <div style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "#ecfdf5", border: "1px solid #86efac",
                borderRadius: "999px", padding: "8px 20px", marginBottom: "12px",
            }}>
                <span style={{ fontSize: "13px", color: "#047857", fontWeight: 600 }}>Project ID</span>
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#065f46", fontSize: "13px" }}>{projectId}</span>
            </div>

            {txHash && (
                <div style={{
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: "8px", padding: "10px 18px", marginBottom: "28px",
                    fontSize: "12px", color: "#6b7280", fontFamily: "monospace",
                }}>
                    Tx: {txHash}
                </div>
            )}

            <div style={{
                width: "120px", height: "120px", background: "#f9fafb",
                border: "2px dashed #d1d5db", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "28px", flexDirection: "column", gap: "6px",
            }}>
                <span style={{ fontSize: "32px" }}>▦</span>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>QR Code</span>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                <a
                    href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-btn"
                    style={{ fontSize: "14px", padding: "10px 20px" }}
                >
                    View on PolygonScan
                </a>
                <button
                    className="primary-btn"
                    style={{ fontSize: "14px", padding: "10px 20px" }}
                    onClick={() => navigate(isAdmin ? "/admin/projects" : "/user/projects")}
                >
                    Track Progress
                </button>
            </div>
        </div>
    );
};

export default ProjectSuccessScreen;
