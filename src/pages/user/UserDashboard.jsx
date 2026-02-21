import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import MapComponent from "../../components/shared/MapComponent";

const publicProjects = [
    { name: "Mangrove Restoration – TN", location: "Tamil Nadu", type: "Mangrove", credits: 205, status: "Active" },
    { name: "Saltmarsh Recovery – Gujarat", location: "Gujarat", type: "Salt Marsh", credits: 140, status: "Active" },
    { name: "Coastal Wetland – West Bengal", location: "West Bengal", type: "Mangrove", credits: 310, status: "Completed" },
];

const UserDashboard = () => {
    const navigate = useNavigate();

    return (
        <>
            <h1>Community Dashboard</h1>

            <div className="card-grid">
                <StatCard title="Active Projects" value="24" color="#0f766e" />
                <StatCard title="Total CO₂ Removed (tCO₂e)" value="6,720" color="#0f2a44" />
                <StatCard title="Credits Minted" value="6,500" color="#7c3aed" />
                <StatCard title="Your Credits" value="50" color="#b45309" />
            </div>


            <div className="mt-30">
                <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Projects Near You</h2>
                <MapComponent height="280px" pins={[
                    { lat: 11.12, lng: 78.65 },
                    { lat: 21.17, lng: 72.83 },
                    { lat: 22.52, lng: 88.36 },
                ]} />
            </div>


            <div className="mt-30">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "18px" }}>Featured Projects</h2>
                    <button className="secondary-btn" onClick={() => navigate("/user/projects")}>View All</button>
                </div>
                <div className="card-grid">
                    {publicProjects.map((p) => (
                        <div key={p.name} className="card">
                            <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>{p.name}</h3>
                            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{p.location} &middot; {p.type}</p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                                <div><span style={{ fontSize: "18px", fontWeight: "bold", color: "#0f766e" }}>{p.credits}</span>
                                    <span style={{ fontSize: "12px", color: "#6b7280" }}> tCO₂e</span></div>
                                <span className={`badge ${p.status === "Active" ? "approved" : "minted"}`}>{p.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default UserDashboard;
