const Timeline = ({ steps = [] }) => {
    return (
        <div className="timeline">
            {steps.map((step, index) => (
                <div key={index} className="timeline-step">
                    <div className={`timeline-dot ${step.completed ? "completed" : step.active ? "active" : ""}`} />
                    <div
                        className="timeline-content"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>{step.title}</div>
                            {step.description && (
                                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{step.description}</div>
                            )}
                        </div>
                        {step.date && (
                            <div style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0, marginTop: "2px" }}>
                                {step.date}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
