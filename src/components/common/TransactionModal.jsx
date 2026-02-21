const TransactionModal = ({ isOpen, onClose, status = "pending", txHash = "", title = "Blockchain Transaction" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={status !== "pending" ? onClose : undefined}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px", textAlign: "center" }}>
                {/* Header */}
                <h2 style={{ fontSize: "17px", marginBottom: "20px" }}>{title}</h2>

                {status === "pending" && (
                    <div>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
                        <p style={{ fontSize: "14px", fontWeight: 600 }}>Broadcasting transaction...</p>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                            Please do not close this window. Waiting for Polygon confirmation.
                        </p>
                        <div style={{
                            width: "100%", height: "4px", background: "#e5e7eb",
                            borderRadius: "2px", marginTop: "20px", overflow: "hidden",
                        }}>
                            <div style={{
                                width: "40%", height: "100%", background: "#0f2a44",
                                borderRadius: "2px",
                                animation: "progress 1.5s infinite linear",
                            }} />
                        </div>
                    </div>
                )}

                {status === "success" && (
                    <div>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#065f46" }}>Transaction Confirmed!</p>
                        {txHash && (
                            <div style={{ marginTop: "16px" }}>
                                <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Transaction Hash</div>
                                <div style={{ fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all", color: "#374151" }}>
                                    {txHash}
                                </div>
                                <a
                                    href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "inline-block", marginTop: "10px", fontSize: "13px", color: "#0f766e" }}
                                >
                                    View on PolygonScan ↗
                                </a>
                            </div>
                        )}
                        <button className="primary-btn" style={{ marginTop: "20px", width: "100%" }} onClick={onClose}>
                            Close
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>❌</div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#991b1b" }}>Transaction Failed</p>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                            The transaction was rejected or failed. Please try again.
                        </p>
                        <button className="secondary-btn" style={{ marginTop: "20px", width: "100%" }} onClick={onClose}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionModal;
