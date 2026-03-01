import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import MapComponent from "../../components/shared/MapComponent";
import { projectsAPI, reportsAPI } from "../../services/api";

const UserDashboard = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({ active: 0, removed: 0, minted: 0, userCredits: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            projectsAPI.getPublic().catch(() => ({ data: { data: { projects: [] } } })),
            reportsAPI.getDashboardStats().catch(() => ({ data: { data: {} } })),
        ]).then(([projRes, statsRes]) => {
            setProjects(projRes.data.data.projects || []);
            const s = statsRes.data.data.community || {};
            setStats({
                active: s.activeProjects || 0,
                removed: s.totalGlobalCredits || 0,
                minted: s.totalGlobalCredits || 0,
                userCredits: 0
            });
            setLoading(false);
        });
    }, []);

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading dashboard…</div>;

    return (
        <>
            <h1>Community Dashboard</h1>

            <div className="card-grid">
                <StatCard title="Active Projects" value={String(stats.active)} color="#0f766e" />
                <StatCard title="Total CO₂ Removed (tCO₂e)" value={stats.removed.toLocaleString()} color="#0f2a44" />
                <StatCard title="Credits Minted" value={stats.minted.toLocaleString()} color="#7c3aed" />
                <StatCard title="Your Credits" value={String(stats.userCredits)} color="#b45309" />
            </div>

            <div className="mt-30">
                <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Projects Near You</h2>
                <MapComponent height="280px" pins={projects.map(() => ({ lat: 11.12, lng: 78.65 }))} />
            </div>

            <div className="mt-30">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "18px" }}>Featured Projects</h2>
                    <button className="secondary-btn" onClick={() => navigate("/user/projects")}>View All</button>
                </div>
                <div className="card-grid">
                    {projects.length === 0 ? (
                        <div style={{ padding: "20px", color: "#6b7280" }}>No public projects available.</div>
                    ) : (
                        projects.slice(0, 3).map((p) => (
                            <div key={p.projectId} className="card">
                                <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>{p.projectName}</h3>
                                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{p.location} &middot; {p.projectType}</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                                    <div><span style={{ fontSize: "18px", fontWeight: "bold", color: "#0f766e" }}>{p.totalCarbonCredits}</span>
                                        <span style={{ fontSize: "12px", color: "#6b7280" }}> tCO₂e</span></div>
                                    <span className="badge approved">{p.status}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default UserDashboard;
