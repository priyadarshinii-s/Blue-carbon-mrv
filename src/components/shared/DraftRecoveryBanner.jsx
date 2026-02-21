const DraftRecoveryBanner = ({ onRestore, onDiscard }) => {
    return (
        <div style={{
            background: "#fefce8", border: "1px solid #fde047",
            borderRadius: "8px", padding: "12px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "20px", flexWrap: "wrap", gap: "10px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📋</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#854d0e" }}>Draft Found</div>
                    <div style={{ fontSize: "12px", color: "#92400e" }}>
                        You have an unsaved draft. Would you like to continue where you left off?
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
                <button
                    type="button"
                    className="primary-btn"
                    style={{ fontSize: "13px", padding: "6px 16px", background: "#b45309" }}
                    onClick={onRestore}
                >
                    Restore Draft
                </button>
                <button
                    type="button"
                    className="secondary-btn"
                    style={{ fontSize: "13px", padding: "6px 14px" }}
                    onClick={onDiscard}
                >
                    Discard
                </button>
            </div>
        </div>
    );
};

export default DraftRecoveryBanner;
