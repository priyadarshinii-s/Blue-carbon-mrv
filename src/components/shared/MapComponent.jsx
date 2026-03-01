const MapComponent = ({ pins = [], height = "240px", editable = false, showPolygon = false }) => {
    return (
        <div style={{
            height,
            background: "#e8f0f8",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
        }}>

            <div style={{
                position: "absolute", inset: 0, opacity: 0.15,
                backgroundImage: "linear-gradient(#0f2a44 1px, transparent 1px), linear-gradient(90deg, #0f2a44 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }} />

            {showPolygon && (
                <div style={{
                    position: "absolute",
                    top: "20%", left: "20%", right: "20%", bottom: "20%",
                    border: "2px dashed #0f766e",
                    background: "rgba(15, 118, 110, 0.08)",
                    borderRadius: "4px",
                }} />
            )}

            {pins.map((pin, i) => (
                <div key={i} style={{
                    position: "absolute",
                    top: `${30 + i * 15}%`,
                    left: `${40 + i * 10}%`,
                    fontSize: "20px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    transform: "translate(-50%, -100%)",
                }}>
                    📍
                </div>
            ))}

            <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#6b7280" }}>
                <div style={{ fontSize: "24px" }}>🗺️</div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    {pins.length > 0
                        ? `${pins.length} location${pins.length > 1 ? "s" : ""} marked`
                        : editable
                            ? "Click to place marker (Leaflet integration pending)"
                            : "Map view (Leaflet integration pending)"}
                </div>
                {pins.length > 0 && (
                    <div style={{ fontSize: "11px", fontFamily: "monospace", marginTop: "4px" }}>
                        {pins.map((p) => `${p.lat}°N, ${p.lng}°E`).join(" | ")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapComponent;
