import { useState, useEffect } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import { verificationsAPI } from "../../services/api";

const borderColor = { Approved: "#047857", Rejected: "#b91c1c", NeedsCorrection: "#b45309" };
const decisionMap = { Approved: "approved", Rejected: "rejected", NeedsCorrection: "correction" };

const VerifiedHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        verificationsAPI.getHistory()
            .then(res => setHistory(res.data.data || []))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = history.filter((v) => filter === "ALL" || decisionMap[v.status] === filter);

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading verified submissions…</div>;

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h1>Verified Submissions</h1>
                </div>
                <div>
                    <label style={{ fontSize: "13px", marginRight: "8px" }}>Filter:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="correction">Correction Requested</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    No verified submissions found.
                </div>
            ) : (
                <div className="list-container">
                    {filtered.map((v) => (
                        <div
                            key={v.id}
                            className="list-row"
                            style={{ cursor: "pointer", borderLeft: `3px solid ${borderColor[v.status] || "#e5e7eb"}` }}
                            onClick={() => setDetail(v)}
                        >
                            <div className="list-row-main">
                                <span className="list-row-title">{v.projectName}</span>
                                <span className="list-row-meta">
                                    {v.submissionId} · {new Date(v.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                    {v.approvedCredits > 0 ? ` · ${v.approvedCredits} tCO₂e` : ""}
                                </span>
                            </div>
                            <div className="list-row-end">
                                <StatusBadge status={decisionMap[v.status] || v.status} />
                                <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={(e) => { e.stopPropagation(); setDetail(v); }}>
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {detail && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h2 style={{ fontSize: "16px", margin: 0 }}>Review Detail</h2>
                            <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: "2" }}>
                            <div><strong>Project:</strong> {detail.projectName}</div>
                            <div><strong>Submission:</strong> {detail.submissionId}</div>
                            <div><strong>Credits:</strong> {detail.approvedCredits > 0 ? `${detail.approvedCredits} tCO₂e` : "—"}</div>
                            <div><strong>Decision:</strong> <StatusBadge status={decisionMap[detail.status] || detail.status} /></div>
                            <div><strong>Date:</strong> {new Date(detail.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        </div>
                        {detail.remarks && (
                            <div className="card mt-20" style={{ borderLeftColor: borderColor[detail.status] }}>
                                <h3 style={{ fontSize: "13px", marginBottom: "6px" }}>Your Comment</h3>
                                <p style={{ fontSize: "13px" }}>{detail.remarks}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default VerifiedHistory;
