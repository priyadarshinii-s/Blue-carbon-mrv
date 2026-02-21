const EmptyState = ({ icon = "📭", message = "No data available", action, actionLabel }) => {
    return (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
            <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: action ? "16px" : "0" }}>
                {message}
            </p>
            {action && (
                <button className="primary-btn" onClick={action}>
                    {actionLabel || "Take Action"}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
