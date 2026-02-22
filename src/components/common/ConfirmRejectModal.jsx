const ConfirmRejectModal = ({ isOpen, onClose, onConfirm, reason = "" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "480px", animation: "authModalIn 0.2s ease-out" }}
            >
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        background: "#fef2f2", display: "inline-flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "24px", marginBottom: "12px",
                    }}>
                        ⚠️
                    </div>
                    <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#991b1b" }}>
                        Confirm Rejection
                    </h2>
                    <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
                        This action cannot be undone. Please review the reason below.
                    </p>
                </div>

                <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: "8px", padding: "14px 16px",
                    fontSize: "13px", color: "#7f1d1d", lineHeight: "1.6",
                    marginBottom: "24px", borderLeft: "4px solid #ef4444",
                }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#991b1b", marginBottom: "6px", letterSpacing: "0.04em" }}>
                        Rejection Reason
                    </div>
                    {reason}
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button
                        className="secondary-btn"
                        style={{ minWidth: "120px", padding: "10px 24px", fontSize: "14px" }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        style={{
                            minWidth: "140px", padding: "10px 24px", fontSize: "14px",
                            fontWeight: 600, border: "none", borderRadius: "var(--radius)",
                            background: "#dc2626", color: "white", cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseOver={(e) => (e.target.style.background = "#b91c1c")}
                        onMouseOut={(e) => (e.target.style.background = "#dc2626")}
                        onClick={onConfirm}
                    >
                        Confirm Reject
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmRejectModal;
