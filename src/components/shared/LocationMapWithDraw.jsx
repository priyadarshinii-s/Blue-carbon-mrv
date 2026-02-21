import { useState } from "react";
import MapComponent from "./MapComponent";

const LocationMapWithDraw = ({ onLocationChange }) => {
    const [search, setSearch] = useState("");
    const [pin, setPin] = useState(null);
    const [searching, setSearching] = useState(false);
    const [hasPolygon, setHasPolygon] = useState(false);
    const [area, setArea] = useState(null);
    const [drawMode, setDrawMode] = useState(false);

    const handleSearch = () => {
        if (!search.trim()) return;
        setSearching(true);
        setTimeout(() => {
            const mockLocations = {
                "pichavaram": { lat: 11.4196, lng: 79.7728, name: "Pichavaram, Tamil Nadu" },
                "kerala": { lat: 10.8505, lng: 76.2711, name: "Kerala, India" },
                "gujarat": { lat: 22.2587, lng: 71.1924, name: "Gujarat, India" },
                "sundarbans": { lat: 21.9497, lng: 89.1833, name: "Sundarbans, West Bengal" },
            };
            const key = Object.keys(mockLocations).find(k => search.toLowerCase().includes(k));
            const result = key ? mockLocations[key] : { lat: 20.5937, lng: 78.9629, name: search };
            setPin(result);
            if (onLocationChange) onLocationChange({ lat: result.lat, lng: result.lng, name: result.name });
            setSearching(false);
        }, 1200);
    };

    const handleDrawPolygon = () => {
        setDrawMode(true);
        setTimeout(() => {
            setHasPolygon(true);
            setDrawMode(false);
            const mockArea = (Math.random() * 30 + 5).toFixed(1);
            setArea(mockArea);
            if (onLocationChange) onLocationChange({ area: parseFloat(mockArea) });
        }, 2000);
    };

    return (
        <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <input
                    type="text"
                    placeholder="Search location (e.g. Pichavaram, Tamil Nadu)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={{ flex: 1 }}
                />
                <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleSearch}
                    disabled={searching}
                    style={{ whiteSpace: "nowrap" }}
                >
                    {searching ? "Searching..." : "Search"}
                </button>
            </div>

            <MapComponent
                height="320px"
                pins={pin ? [{ lat: pin.lat, lng: pin.lng }] : []}
                showPolygon={hasPolygon}
                editable={true}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <button
                    type="button"
                    className={hasPolygon ? "secondary-btn" : "primary-btn"}
                    onClick={handleDrawPolygon}
                    disabled={drawMode}
                    style={{ fontSize: "13px" }}
                >
                    {drawMode ? "Drawing polygon..." : hasPolygon ? "Redraw Geofence Polygon" : "Draw Geofence Polygon"}
                </button>

                {area && (
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "#ecfdf5", border: "1px solid #86efac",
                        borderRadius: "6px", padding: "6px 14px", fontSize: "14px",
                    }}>
                        <span style={{ color: "#047857", fontWeight: 700 }}>Approximate Area:</span>
                        <span style={{ fontWeight: 800, color: "#065f46" }}>{area} ha</span>
                    </div>
                )}
            </div>

            {hasPolygon && (
                <p style={{ fontSize: "12px", color: "#047857", marginTop: "6px" }}>
                    Polygon drawn successfully. Area calculated from geofence.
                </p>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Latitude (auto)</label>
                    <input type="text" value={pin?.lat ?? ""} readOnly placeholder="Auto from map" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Longitude (auto)</label>
                    <input type="text" value={pin?.lng ?? ""} readOnly placeholder="Auto from map" />
                </div>
            </div>
        </div>
    );
};

export default LocationMapWithDraw;
