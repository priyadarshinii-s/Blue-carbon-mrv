const StatCard = ({ title, value, color }) => {
    return (
        <div className="stat-card" style={{ borderLeft: `4px solid ${color || "#0f2a44"}` }}>
            <div className="stat-value" style={{ color: color || "#1a1a2e" }}>{value}</div>
            <div className="stat-title">{title}</div>
        </div>
    );
};

export default StatCard;
