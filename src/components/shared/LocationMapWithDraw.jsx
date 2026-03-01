import { useState, useEffect, useRef } from "react";
import MapComponent from "./MapComponent";

const LocationMapWithDraw = ({ onLocationChange }) => {
    const [search, setSearch] = useState("");
    const [pin, setPin] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const debounceRef = useRef(null);


    useEffect(() => {
        if (search.length < 3) { setSuggestions([]); return; }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&countrycodes=in&format=json&limit=6&addressdetails=1`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                setSuggestions(data.map(d => ({
                    display: d.display_name,
                    lat: parseFloat(d.lat),
                    lng: parseFloat(d.lon),
                    state: d.address?.state || "",
                    district: d.address?.state_district || d.address?.county || "",
                })));
            } catch {
                setSuggestions([]);
            }
        }, 400);
        return () => clearTimeout(debounceRef.current);
    }, [search]);

    const selectSuggestion = (s) => {
        setPin({ lat: s.lat, lng: s.lng });
        const locationName = s.district ? `${s.district}, ${s.state}` : s.state || s.display;
        setSearch(locationName);
        setSuggestions([]);
        if (onLocationChange) onLocationChange({ lat: s.lat, lng: s.lng, name: locationName });
    };

    const handleSearch = async () => {
        if (!search.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&countrycodes=in&format=json&limit=1&addressdetails=1`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            if (data.length > 0) {
                const d = data[0];
                const lat = parseFloat(d.lat);
                const lng = parseFloat(d.lon);
                const state = d.address?.state || "";
                const district = d.address?.state_district || d.address?.county || "";
                const locationName = district ? `${district}, ${state}` : state || d.display_name;
                setPin({ lat, lng });
                setSearch(locationName);
                if (onLocationChange) onLocationChange({ lat, lng, name: locationName });
            }
        } catch { }
        setSearching(false);
    };

    const handleUseCurrentLocation = () => {
        setGpsLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = parseFloat(pos.coords.latitude.toFixed(6));
                    const lng = parseFloat(pos.coords.longitude.toFixed(6));
                    setPin({ lat, lng });

                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                            { headers: { "Accept-Language": "en" } }
                        );
                        const data = await res.json();
                        const state = data.address?.state || "";
                        const district = data.address?.state_district || data.address?.county || "";
                        const locationName = district ? `${district}, ${state}` : state || `${lat}, ${lng}`;
                        setSearch(locationName);
                        if (onLocationChange) onLocationChange({ lat, lng, name: locationName });
                    } catch {
                        setSearch(`${lat}, ${lng}`);
                        if (onLocationChange) onLocationChange({ lat, lng, name: `${lat}, ${lng}` });
                    }
                    setGpsLoading(false);
                },
                () => {
                    alert("Could not retrieve your location. Please allow location access.");
                    setGpsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
            setGpsLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px", position: "relative" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search by state, district, or place..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        style={{ width: "100%" }}
                    />
                    {suggestions.length > 0 && (
                        <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000,
                            background: "white", border: "1px solid #d1d5db", borderRadius: "0 0 8px 8px",
                            maxHeight: "220px", overflowY: "auto",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}>
                            {suggestions.map((s, i) => (
                                <div
                                    key={i}
                                    onClick={() => selectSuggestion(s)}
                                    style={{
                                        padding: "10px 14px", cursor: "pointer",
                                        fontSize: "13px", borderBottom: "1px solid #f3f4f6",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                                >
                                    <div style={{ fontWeight: 500, color: "#111827" }}>
                                        {s.district && <span>{s.district}, </span>}
                                        <span style={{ color: "#0f766e" }}>{s.state}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {s.display}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button type="button" className="secondary-btn" onClick={handleSearch} disabled={searching} style={{ whiteSpace: "nowrap" }}>
                    {searching ? "Searching..." : "🔍 Search"}
                </button>
                <button type="button" className="primary-btn" onClick={handleUseCurrentLocation} disabled={gpsLoading} style={{ whiteSpace: "nowrap" }}>
                    {gpsLoading ? "⏳ Locating..." : "📍 My Location"}
                </button>
            </div>

            <div style={{ marginTop: "8px" }}>
                <MapComponent
                    height="320px"
                    pins={pin ? [{ lat: pin.lat, lng: pin.lng, label: search || "Selected Location" }] : []}
                />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Latitude</label>
                    <input type="text" value={pin?.lat ?? ""} readOnly placeholder="Auto from map" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Longitude</label>
                    <input type="text" value={pin?.lng ?? ""} readOnly placeholder="Auto from map" />
                </div>
            </div>
        </div>
    );
};

export default LocationMapWithDraw;
