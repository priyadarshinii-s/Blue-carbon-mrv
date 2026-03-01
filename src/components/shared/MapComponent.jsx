import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const FlyToPin = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.flyTo([lat, lng], 13, { duration: 1 });
    }, [lat, lng, map]);
    return null;
};

const MapComponent = ({ pins = [], height = "240px", center, zoom = 5 }) => {
    const defaultCenter = center || (pins.length > 0 ? [pins[0].lat, pins[0].lng] : [20.5937, 78.9629]);
    const defaultZoom = pins.length > 0 ? 13 : zoom;

    return (
        <div style={{ height, borderRadius: "8px", overflow: "hidden", border: "1px solid #d1d5db" }}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {pins.map((pin, i) => (
                    <Marker key={i} position={[pin.lat, pin.lng]}>
                        {pin.label && <Popup>{pin.label}</Popup>}
                    </Marker>
                ))}
                {pins.length > 0 && <FlyToPin lat={pins[0].lat} lng={pins[0].lng} />}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
