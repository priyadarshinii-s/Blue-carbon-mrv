import { useNavigate } from "react-router-dom";

const TxSuccessScreen = ({ 
    title = "Transaction Successful!", 
    message, 
    txHash, 
    isError = false,
    actionButtons = [], // Array of { label, onClick, primary }
    fallbackPath = "/" 
}) => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: "70vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center",
        }}>
            <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: isError ? "linear-gradient(135deg, #b91c1c, #991b1b)" : "linear-gradient(135deg, #0f766e, #047857)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "40px", marginBottom: "24px", color: "white",
                boxShadow: isError ? "0 0 0 12px rgba(185,28,28,0.1)" : "0 0 0 12px rgba(15,118,110,0.1)",
                animation: "pulse 1.5s ease-in-out infinite",
            }}>
                {isError ? "✕" : "✓"}
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 800, color: isError ? "#7f1d1d" : "#0f2a44", marginBottom: "16px" }}>
                {title}
            </h1>
            
            {message && (
                <p style={{ fontSize: "16px", color: "#6b7280", maxWidth: "460px", marginBottom: "24px", lineHeight: "1.5" }}>
                    {message}
                </p>
            )}

            {txHash && (
                <div style={{
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: "8px", padding: "10px 18px", marginBottom: "28px",
                    fontSize: "12px", color: "#6b7280", fontFamily: "monospace",
                }}>
                    Tx: {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : txHash}
                </div>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                {txHash && (
                    <a
                        href={`https://amoy.polygonscan.com/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-btn"
                        style={{ fontSize: "14px", padding: "10px 20px", textDecoration: "none" }}
                    >
                        View on PolygonScan
                    </a>
                )}
                {actionButtons.length > 0 ? (
                    actionButtons.map((btn, idx) => (
                        <button
                            key={idx}
                            className={btn.primary ? "primary-btn" : "secondary-btn"}
                            style={{ fontSize: "14px", padding: "10px 20px" }}
                            onClick={btn.onClick}
                        >
                            {btn.label}
                        </button>
                    ))
                ) : (
                    <button
                        className="primary-btn"
                        style={{ fontSize: "14px", padding: "10px 20px" }}
                        onClick={() => navigate(fallbackPath)}
                    >
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
};

export default TxSuccessScreen;
