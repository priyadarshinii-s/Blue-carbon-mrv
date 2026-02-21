import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";

const allProjects = [
    { id: 1, name: "Mangrove Restoration – TN", location: "Tamil Nadu", type: "Mangrove", status: "Active", credits: 205, area: 25.5, submissions: 8, startDate: "Jan 2025" },
    { id: 2, name: "Seagrass Revival – Kerala", location: "Kerala", type: "Seagrass", status: "Active", credits: 45, area: 15.2, submissions: 4, startDate: "Mar 2025" },
    { id: 3, name: "Saltmarsh Recovery – Gujarat", location: "Gujarat", type: "Salt Marsh", status: "Active", credits: 140, area: 32.0, submissions: 6, startDate: "Feb 2025" },
    { id: 4, name: "Mangrove Belt – Odisha", location: "Odisha", type: "Mangrove", status: "Active", credits: 200, area: 40.0, submissions: 10, startDate: "Dec 2024" },
    { id: 5, name: "Coastal Wetland – West Bengal", location: "West Bengal", type: "Mangrove", status: "Completed", credits: 310, area: 18.7, submissions: 12, startDate: "Aug 2024" },
    { id: 6, name: "Tidal Flat Restoration – AP", location: "Andhra Pradesh", type: "Salt Marsh", status: "Active", credits: 55, area: 22.3, submissions: 4, startDate: "Apr 2025" },
];

const MyProjects = () => {
    const navigate = useNavigate();
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [detail, setDetail] = useState(null);

    const filtered = allProjects.filter((p) => {
        if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
        return true;
    });

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1>My Projects</h1>
                    <p className="page-subtitle">All your registered blue carbon projects</p>
                </div>
                <button
                    className="primary-btn"
                    style={{ padding: "12px 24px", fontSize: "15px", background: "#0f766e" }}
                    onClick={() => navigate("/user/project/new")}
                >
                    + Register New Project
                </button>
            </div>

            <div
                onClick={() => navigate("/user/project/new")}
                style={{
                    background: "linear-gradient(135deg, #0f2a44 0%, #0f766e 100%)",
                    borderRadius: "12px", padding: "24px 28px", marginBottom: "24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", color: "white",
                    boxShadow: "0 4px 24px rgba(15,118,110,0.25)",
                    transition: "transform 0.18s, box-shadow 0.18s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,118,110,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(15,118,110,0.25)"; }}
            >
                <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "6px" }}>
                        Register a New Blue Carbon Project
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.85, maxWidth: "480px" }}>
                        Submit your project to the MRV registry. Upload baseline evidence, define your geofence, and create an immutable on-chain record.
                    </div>
                    <div style={{
                        display: "inline-block", marginTop: "14px",
                        background: "rgba(255,255,255,0.2)", borderRadius: "6px",
                        padding: "8px 20px", fontSize: "14px", fontWeight: 600,
                    }}>
                        + Get Started
                    </div>
                </div>
                <div style={{ fontSize: "72px", opacity: 0.6, flexShrink: 0 }}>🌿</div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div>
                    <label style={{ fontSize: "13px", marginRight: "6px" }}>Type:</label>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All Types</option>
                        <option value="Mangrove">Mangrove</option>
                        <option value="Seagrass">Seagrass</option>
                        <option value="Salt Marsh">Salt Marsh</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: "13px", marginRight: "6px" }}>Status:</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Credits (tCO₂e)</th>
                        <th>Area (ha)</th>
                        <th>Submissions</th>
                        <th>Started</th>
                        <th>Detail</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((p) => (
                        <tr key={p.id}>
                            <td style={{ fontWeight: 500 }}>{p.name}</td>
                            <td>{p.location}</td>
                            <td>{p.type}</td>
                            <td><StatusBadge status={p.status.toLowerCase()} /></td>
                            <td>{p.credits}</td>
                            <td>{p.area}</td>
                            <td>{p.submissions}</td>
                            <td>{p.startDate}</td>
                            <td>
                                <button className="secondary-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => setDetail(p)}>
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {detail && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ fontSize: "18px", margin: 0 }}>{detail.name}</h2>
                            <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: "2.2" }}>
                            <div><strong>Type:</strong> {detail.type}</div>
                            <div><strong>Location:</strong> {detail.location}</div>
                            <div><strong>Status:</strong> <StatusBadge status={detail.status.toLowerCase()} /></div>
                            <div><strong>Area:</strong> {detail.area} ha</div>
                            <div><strong>Total Submissions:</strong> {detail.submissions}</div>
                            <div><strong>Credits Minted:</strong> {detail.credits} tCO₂e</div>
                            <div><strong>Started:</strong> {detail.startDate}</div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => navigate("/user/project/new")}
                style={{
                    position: "fixed", bottom: "28px", right: "28px",
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #0f766e, #047857)",
                    color: "white", border: "none", fontSize: "28px",
                    cursor: "pointer", boxShadow: "0 4px 20px rgba(15,118,110,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    zIndex: 100,
                }}
                title="Register New Project"
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
                +
            </button>
        </>
    );
};

export default MyProjects;
