import { useState, useEffect } from "react";

import { reportsAPI } from "../../services/api";

const actionColors = {
    CREDIT_MINTED: "#0f766e",
    SUBMISSION_VERIFIED: "#1d4ed8",
    DATA_SUBMITTED: "#b45309",
    USER_APPROVED: "#7c3aed",
    PROJECT_CREATED: "#047857",
    SUBMISSION_REJECTED: "#b91c1c",
    ROLE_CHANGED: "#6b7280",
    CREDIT_RETIRED: "#9333ea",
};

const AuditLog = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState("ALL");
    const [searchTx, setSearchTx] = useState("");
    const [searchWallet, setSearchWallet] = useState("");

    useEffect(() => {
        reportsAPI.getAuditLogs()
            .then(res => setAuditLogs(res.data.data || []))
            .catch(() => setAuditLogs([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredLogs = auditLogs.filter((log) => {
        if (filterAction !== "ALL" && log.action !== filterAction) return false;
        if (searchTx && log.txHash && !log.txHash.toLowerCase().includes(searchTx.toLowerCase())) return false;
        if (searchWallet && log.walletAddress && !log.walletAddress.toLowerCase().includes(searchWallet.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading audit logs…</div>;

    return (
        <>
            <h1>Audit Log</h1>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="form-group" style={{ margin: 0, flex: "0 0 auto" }}>
                    <label style={{ fontSize: "12px" }}>Action Type</label>
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
                        <option value="ALL">All Actions</option>
                        <option value="CREDIT_MINTED">Credit Minted</option>
                        <option value="SUBMISSION_VERIFIED">Submission Verified</option>
                        <option value="SUBMISSION_REJECTED">Submission Rejected</option>
                        <option value="DATA_SUBMITTED">Data Submitted</option>
                        <option value="USER_APPROVED">User Approved</option>
                        <option value="PROJECT_CREATED">Project Created</option>
                        <option value="ROLE_CHANGED">Role Changed</option>
                        <option value="CREDIT_RETIRED">Credit Retired</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0, flex: "0 0 auto" }}>
                    <label style={{ fontSize: "12px" }}>Tx Hash</label>
                    <input type="text" placeholder="Search by tx hash" value={searchTx} onChange={(e) => setSearchTx(e.target.value)} style={{ width: "200px", padding: "6px 10px" }} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: "0 0 auto" }}>
                    <label style={{ fontSize: "12px" }}>Wallet</label>
                    <input type="text" placeholder="Search by wallet" value={searchWallet} onChange={(e) => setSearchWallet(e.target.value)} style={{ width: "200px", padding: "6px 10px" }} />
                </div>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Wallet</th>
                        <th>Tx Hash</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLogs.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No audit logs found.</td></tr>
                    ) : filteredLogs.map((log) => (
                        <tr key={log._id}>
                            <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                {new Date(log.timestamp).toLocaleString("en-GB", {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </td>
                            <td>
                                <span style={{
                                    padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                                    background: (actionColors[log.action] || "#6b7280") + "15",
                                    color: actionColors[log.action] || "#6b7280",
                                }}>
                                    {log.action.replace(/_/g, " ")}
                                </span>
                            </td>
                            <td style={{ fontSize: "13px" }}>{log.userEmail}</td>
                            <td style={{ fontSize: "11px", fontFamily: "monospace" }}>{log.walletAddress}</td>
                            <td>
                                {log.txHash && log.txHash !== "—" ? (
                                    <a
                                        href={`https://mumbai.polygonscan.com/tx/${log.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}
                                    >
                                        {log.txHash}
                                    </a>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Off-chain</span>
                                )}
                            </td>
                            <td style={{ fontSize: "13px", maxWidth: "300px" }}>{log.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>
                Showing {filteredLogs.length} of {auditLogs.length} records
            </p>
        </>
    );
};

export default AuditLog;
