const ConfirmationTxModal = ({ projectName, onConfirm, onCancel, loading }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "480px", textAlign: "center" }}
            >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>⛓️</div>
                <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Confirm On-Chain Registration</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                    This will create an <strong>immutable record</strong> on the Polygon network.
                </p>

                <div style={{
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: "8px", padding: "16px", marginBottom: "20px", textAlign: "left",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                        <span style={{ color: "#6b7280" }}>Project</span>
                        <span style={{ fontWeight: 600, maxWidth: "220px", textAlign: "right" }}>{projectName}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                        <span style={{ color: "#6b7280" }}>Contract</span>
                        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>SubmissionRegistry</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                        <span style={{ color: "#6b7280" }}>Network</span>
                        <span style={{ fontWeight: 600, color: "#7c3aed" }}>Polygon Mainnet</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderTop: "1px solid #e5e7eb", paddingTop: "8px", marginTop: "4px" }}>
                        <span style={{ color: "#6b7280" }}>Estimated Gas</span>
                        <span style={{ fontWeight: 700, color: "#0f766e" }}>≈ 0.002 MATIC</span>
                    </div>
                </div>

                <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "20px" }}>
                    MetaMask will open to sign the transaction. Files are already uploaded to IPFS.
                </p>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        type="button"
                        className="secondary-btn"
                        onClick={onCancel}
                        style={{ flex: 1 }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={onConfirm}
                        style={{ flex: 1, background: "#0f766e" }}
                        disabled={loading}
                    >
                        {loading ? "Signing..." : "Sign & Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationTxModal;
