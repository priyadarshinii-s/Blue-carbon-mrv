const ecosystems = [
    { id: "mangrove", label: "Mangrove Restoration", icon: "🌿", color: "#047857", bg: "#ecfdf5", desc: "Coastal tree restoration" },
    { id: "saltmarsh", label: "Saltmarsh Restoration", icon: "🏜️", color: "#b45309", bg: "#fffbeb", desc: "Tidal salt flat recovery" },
    { id: "seagrass", label: "Seagrass Restoration", icon: "🌊", color: "#0369a1", bg: "#eff6ff", desc: "Underwater meadow revival" },
    { id: "mixed", label: "Mixed Coastal Ecosystem", icon: "🌱", color: "#7c3aed", bg: "#faf5ff", desc: "Multi-habitat approach" },
];

const EcosystemTypeCards = ({ value, onChange }) => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {ecosystems.map((e) => {
                const isSelected = value === e.id;
                return (
                    <button
                        key={e.id}
                        type="button"
                        onClick={() => onChange(e.id)}
                        style={{
                            padding: "16px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
                            border: isSelected ? `2px solid ${e.color}` : "2px solid #e5e7eb",
                            background: isSelected ? e.bg : "var(--card-bg)",
                            boxShadow: isSelected ? `0 0 0 3px ${e.color}22` : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{e.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: isSelected ? e.color : "var(--text-primary)", marginBottom: "2px" }}>
                            {e.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{e.desc}</div>
                        {isSelected && (
                            <div style={{
                                display: "inline-block", marginTop: "8px", fontSize: "11px", fontWeight: 700,
                                padding: "2px 8px", borderRadius: "999px",
                                background: e.color, color: "white",
                            }}>Selected</div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default EcosystemTypeCards;
