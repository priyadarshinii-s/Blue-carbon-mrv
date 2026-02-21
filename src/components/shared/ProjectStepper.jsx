const ProjectStepper = ({ steps, currentStep }) => {
    return (
        <div style={{
            display: "flex", alignItems: "flex-start", gap: "0",
            marginBottom: "32px", padding: "20px 0",
        }}>
            {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto", minWidth: "60px" }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "14px",
                                background: isCompleted ? "#0f766e" : isActive ? "#0f2a44" : "#e5e7eb",
                                color: isCompleted || isActive ? "white" : "#9ca3af",
                                border: isActive ? "2px solid #0f766e" : "none",
                                boxShadow: isActive ? "0 0 0 3px rgba(15,118,110,0.15)" : "none",
                                transition: "all 0.2s",
                            }}>
                                {isCompleted ? "✓" : idx + 1}
                            </div>
                            <div style={{
                                fontSize: "11px", fontWeight: isActive ? 600 : 400,
                                color: isActive ? "#0f2a44" : isCompleted ? "#0f766e" : "#9ca3af",
                                marginTop: "6px", textAlign: "center", maxWidth: "64px", lineHeight: "1.3",
                            }}>
                                {step}
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div style={{
                                flex: 1, height: "2px", marginTop: "17px",
                                background: isCompleted ? "#0f766e" : "#e5e7eb",
                                transition: "background 0.3s",
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectStepper;
