const TransactionModal = ({ isOpen, onClose, status = "pending", txHash = "", blockNumber = null, title = "Blockchain Transaction" }) => {
    if (!isOpen) return null;

    const explorerUrl = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : "";

    return (
        <div className="modal-overlay" onClick={status !== "pending" ? onClose : undefined}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px", textAlign: "center" }}>

                <h2 style={{ fontSize: "17px", marginBottom: "20px" }}>{title}</h2>

                {status === "pending" && (
                    <div>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
                        <p style={{ fontSize: "14px", fontWeight: 600 }}>Broadcasting transaction...</p>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "8px" }}>
                            Please do not close this window. Waiting for blockchain confirmation.
                        </p>
                        <div style={{
                            width: "100%", height: "4px", background: "#e5e7eb",
                            borderRadius: "2px", marginTop: "20px", overflow: "hidden",
                        }}>
                            <div style={{
                                width: "40%", height: "100%", background: "linear-gradient(90deg, #0f2a44, #1a7f6e)",
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
                        <div style={{
                            marginTop: "16px", background: "#f0fdf4", borderRadius: "8px",
                            padding: "12px", border: "1px solid #bbf7d0"
                        }}>
                            {txHash && (
                                <div style={{ marginBottom: blockNumber ? "12px" : 0 }}>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Transaction Hash</div>
                                    <div style={{ fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all", color: "#374151" }}>
                                        {txHash}
                                    </div>
                                </div>
                            )}
                            {blockNumber && (
                                <div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Block Number</div>
                                    <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#374151", fontWeight: 600 }}>
                                        #{blockNumber.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                        {txHash && (
                            <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: "6px",
                                    marginTop: "12px", fontSize: "13px", color: "#0f766e",
                                    textDecoration: "none", fontWeight: 500,
                                }}
                            >
                                <span>View on Etherscan</span>
                                <span style={{ fontSize: "11px" }}>↗</span>
                            </a>
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
                            The on-chain transaction was rejected or failed. No credits were minted. Please try again.
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
