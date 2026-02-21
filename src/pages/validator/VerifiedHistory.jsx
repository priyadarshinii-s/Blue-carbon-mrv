import { useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";

const verifiedHistory = [
    { id: 1, project: "Mangrove Restoration – TN", officer: "Arun Kumar", date: "14 Feb 2026", trees: 310, survivalRate: 82, decision: "approved", txHash: "0xabc123...def789", comment: "All data verified. GPS matches." },
    { id: 2, project: "Saltmarsh Recovery – Gujarat", officer: "Vikram Singh", date: "10 Feb 2026", trees: 275, survivalRate: 78, decision: "approved", txHash: "0x456abc...123def", comment: "Good documentation." },
    { id: 3, project: "Seagrass Revival – Kerala", officer: "Priya Devi", date: "05 Feb 2026", trees: 120, survivalRate: 60, decision: "rejected", txHash: "0x789def...456abc", comment: "GPS does not match project boundary." },
    { id: 4, project: "Mangrove Belt – Odisha", officer: "Lakshmi Nair", date: "01 Feb 2026", trees: 400, survivalRate: 88, decision: "approved", txHash: "0xfed987...cba321", comment: "Excellent field documentation." },
    { id: 5, project: "Tidal Flat – AP", officer: "Ravi Kumar", date: "28 Jan 2026", trees: 210, survivalRate: 70, decision: "correction", txHash: "—", comment: "Photos blurry. Re-submit required." },
];

const VerifiedHistory = () => {
    const [filter, setFilter] = useState("ALL");
    const [detail, setDetail] = useState(null);

    const filtered = verifiedHistory.filter((v) => filter === "ALL" || v.decision === filter);

    return (
        <>
            <h1>My Verified Submissions</h1>
            <p className="page-subtitle">All submissions you have reviewed and finalised</p>

            <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", marginRight: "8px" }}>Filter:</label>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                    <option value="ALL">All</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="correction">Correction Requested</option>
                </select>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Project</th>
                        <th>Field Officer</th>
                        <th>Date</th>
                        <th>Trees</th>
                        <th>Decision</th>
                        <th>Tx Hash</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((v) => (
                        <tr key={v.id}>
                            <td style={{ fontWeight: 500 }}>{v.project}</td>
                            <td>{v.officer}</td>
                            <td>{v.date}</td>
                            <td>{v.trees}</td>
                            <td><StatusBadge status={v.decision} /></td>
                            <td>
                                {v.txHash !== "—" ? (
                                    <a href={`https://mumbai.polygonscan.com/tx/${v.txHash}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}>
                                        {v.txHash}
                                    </a>
                                ) : <span style={{ fontSize: "12px", color: "#9ca3af" }}>—</span>}
                            </td>
                            <td>
                                <button className="secondary-btn" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => setDetail(v)}>
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {detail && (
                <div className="modal-overlay" onClick={() => setDetail(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <h2 style={{ fontSize: "16px", margin: 0 }}>Review Detail</h2>
                            <button onClick={() => setDetail(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ fontSize: "14px", lineHeight: "2" }}>
                            <div><strong>Project:</strong> {detail.project}</div>
                            <div><strong>Officer:</strong> {detail.officer}</div>
                            <div><strong>Trees:</strong> {detail.trees} @ {detail.survivalRate}% survival</div>
                            <div><strong>Decision:</strong> <StatusBadge status={detail.decision} /></div>
                        </div>
                        <div className="card mt-20" style={{
                            borderLeftColor: detail.decision === "approved" ? "#047857" : detail.decision === "rejected" ? "#b91c1c" : "#b45309",
                        }}>
                            <h3 style={{ fontSize: "13px", marginBottom: "6px" }}>Your Comment</h3>
                            <p style={{ fontSize: "13px" }}>{detail.comment}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VerifiedHistory;
