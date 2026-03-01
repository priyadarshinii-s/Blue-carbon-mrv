import { useState } from "react";

const ReviewWizard = ({ steps = [], children, onBack, stepGates = [] }) => {
    const [current, setCurrent] = useState(0);
    const panels = Array.isArray(children) ? children : [children];
    const canGoNext = stepGates[current] === undefined ? true : stepGates[current];

    return (
        <div className="wizard-container">
            {}
            {onBack && (
                <div style={{ marginBottom: "16px" }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "13px", color: "var(--text-muted)", fontWeight: 500,
                            padding: "4px 0", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: "4px"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "var(--text)")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                        ← Back to Queue
                    </button>
                </div>
            )}

            {}
            <div className="wizard-stepper-card">
                <div className="wizard-stepper">
                    {steps.map((step, i) => (
                        <div key={i} className="wizard-step-wrapper">
                            <div
                                className={`wizard-step ${i < current ? "completed" : ""} ${i === current ? "active" : ""}`}
                                onClick={() => i < current && setCurrent(i)}
                                style={{ cursor: i < current ? "pointer" : "default" }}
                            >
                                <div className="wizard-step-circle">
                                    {i < current ? (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <span>{i + 1}</span>
                                    )}
                                </div>
                                <span className="wizard-step-label">{step.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`wizard-step-line ${i < current ? "completed" : ""}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div className="wizard-content" key={current}>
                {panels[current]}
            </div>

            {}
            <div className="wizard-nav">
                {current > 0 ? (
                    <button
                        className="secondary-btn"
                        style={{ padding: "10px 24px", fontSize: "13px" }}
                        onClick={() => setCurrent(current - 1)}
                    >
                        ← Previous
                    </button>
                ) : (
                    <div />
                )}
                {current < steps.length - 1 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        {!canGoNext && (
                            <div style={{ fontSize: "11px", color: "#b45309", fontWeight: 500 }}>
                                ⚠ Please complete the calculation above first
                            </div>
                        )}
                        <button
                            style={{
                                padding: "10px 28px", fontSize: "13px", fontWeight: 600,
                                background: canGoNext ? "var(--teal)" : "#d1d5db",
                                color: canGoNext ? "white" : "#6b7280",
                                border: "none", borderRadius: "var(--radius)",
                                cursor: canGoNext ? "pointer" : "not-allowed",
                                transition: "all 0.15s",
                            }}
                            onClick={() => canGoNext && setCurrent(current + 1)}
                        >
                            Next: {steps[current + 1]?.label} →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewWizard;
