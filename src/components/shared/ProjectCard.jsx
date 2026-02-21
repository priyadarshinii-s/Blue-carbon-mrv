const ProjectCard = ({ project, onClick }) => {
    const statusColors = {
        Active: "#047857",
        Pending: "#b45309",
        Completed: "#1d4ed8",
    };

    return (
        <div className="card project-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{project.name}</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0" }}>
                        📍 {project.location}
                    </p>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0" }}>
                        🌿 {project.type}
                    </p>
                </div>
                <span
                    className="badge"
                    style={{
                        background: (statusColors[project.status] || "#6b7280") + "20",
                        color: statusColors[project.status] || "#6b7280",
                    }}
                >
                    {project.status}
                </span>
            </div>
            {project.credits !== undefined && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>Credits: </span>
                    <strong>{project.credits}</strong>
                </div>
            )}
            {project.area && (
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                    Area: {project.area} ha
                </p>
            )}
        </div>
    );
};

export default ProjectCard;
