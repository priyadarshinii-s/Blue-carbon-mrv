import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { projectsAPI } from "../../services/api";

const MyProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        projectsAPI.getAll()
            .then((res) => setProjects(res.data.data.projects || []))
            .catch(() => setProjects([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = projects.filter((p) => {
        if (typeFilter !== "ALL" && p.projectType !== typeFilter) return false;
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
        return true;
    });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "–";

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading projects…</div>;

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1>My Projects</h1>
                </div>
                <button className="primary-btn" style={{ padding: "10px 20px" }} onClick={() => navigate("/user/project/new")}>
                    + Register New Project
                </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div>
                    <label style={{ fontSize: "13px", marginRight: "6px" }}>Type:</label>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All Types</option>
                        <option value="MANGROVE">Mangrove</option>
                        <option value="SEAGRASS">Seagrass</option>
                        <option value="SALTMARSH">Salt Marsh</option>
                        <option value="MIXED">Mixed</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: "13px", marginRight: "6px" }}>Status:</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "#6b7280" }}>No projects found. Create your first project!</p>
                </div>
            ) : (
                <div className="list-container">
                    {filtered.map((p) => (
                        <div key={p._id || p.projectId} className="list-row" style={{ cursor: "pointer" }} onClick={() => setDetail(p)}>
                            <div className="list-row-main">
                                <span className="list-row-title">{p.projectName}</span>
                                <span className="list-row-meta">{p.location} · {p.projectType} · {p.approximateAreaHa} ha · Started {formatDate(p.startDate)} · {p.totalCarbonCredits || 0} tCO₂e</span>
                            </div>
                            <div className="list-row-end">
                                <StatusBadge status={p.status?.toLowerCase()} />
                                <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={(e) => { e.stopPropagation(); setDetail(p); }}>
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {detail && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ fontSize: "18px", margin: 0 }}>{detail.projectName}</h2>
                            <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: "2.2" }}>
                            <div><strong>Project ID:</strong> {detail.projectId || "–"}</div>
                            <div><strong>Type:</strong> {detail.projectType}</div>
                            <div><strong>Location:</strong> {detail.location}</div>
                            <div><strong>Status:</strong> <StatusBadge status={detail.status?.toLowerCase()} /></div>
                            <div><strong>Area:</strong> {detail.approximateAreaHa} ha</div>
                            <div><strong>Credits Minted:</strong> {detail.totalCarbonCredits || 0} tCO₂e</div>
                            <div><strong>Started:</strong> {formatDate(detail.startDate)}</div>
                            {detail.description && <div><strong>Description:</strong> {detail.description}</div>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyProjects;
