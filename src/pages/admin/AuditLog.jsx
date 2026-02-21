import { useState } from "react";

const auditLogs = [
    { id: 1, timestamp: "2026-02-21 14:30:00", action: "CREDIT_MINTED", user: "admin@nccr.gov.in", wallet: "0x7a3B...9f2E", txHash: "0xabc123...def789", details: "Minted 20.4 tCO₂e for Mangrove Restoration – TN" },
    { id: 2, timestamp: "2026-02-21 12:15:00", action: "SUBMISSION_VERIFIED", user: "validator@nccr.gov.in", wallet: "0x8b4C...3a4B", txHash: "0x456abc...123def", details: "Approved submission #24 for Mangrove Restoration – TN" },
    { id: 3, timestamp: "2026-02-20 16:45:00", action: "DATA_SUBMITTED", user: "field.officer@ngo.org", wallet: "0x9c5D...5a6D", txHash: "0x789def...456abc", details: "Field data submitted for Seagrass Revival – Kerala" },
    { id: 4, timestamp: "2026-02-20 10:30:00", action: "USER_APPROVED", user: "admin@nccr.gov.in", wallet: "0x7a3B...9f2E", txHash: "—", details: "Approved user Neha Gupta as Field Officer" },
    { id: 5, timestamp: "2026-02-19 09:00:00", action: "PROJECT_CREATED", user: "admin@nccr.gov.in", wallet: "0x7a3B...9f2E", txHash: "—", details: "Created project: Tidal Flat Restoration – AP" },
    { id: 6, timestamp: "2026-02-18 17:20:00", action: "CREDIT_MINTED", user: "admin@nccr.gov.in", wallet: "0x7a3B...9f2E", txHash: "0xfed987...cba321", details: "Minted 13.5 tCO₂e for Saltmarsh Recovery – Gujarat" },
    { id: 7, timestamp: "2026-02-18 11:00:00", action: "SUBMISSION_REJECTED", user: "validator@nccr.gov.in", wallet: "0x8b4C...3a4B", txHash: "0x321cba...987fed", details: "Rejected submission #18 – insufficient photo evidence" },
    { id: 8, timestamp: "2026-02-17 15:30:00", action: "ROLE_CHANGED", user: "admin@nccr.gov.in", wallet: "0x7a3B...9f2E", txHash: "—", details: "Changed Ravi Kumar role to Validator" },
    { id: 9, timestamp: "2026-02-16 13:00:00", action: "DATA_SUBMITTED", user: "field.officer@ngo.org", wallet: "0x0d6E...7a8E", txHash: "0x654fed...321abc", details: "Field data submitted for Mangrove Belt – Odisha" },
    { id: 10, timestamp: "2026-02-15 09:45:00", action: "CREDIT_RETIRED", user: "community@ngo.org", wallet: "0x2f8G...9c0G", txHash: "0x987abc...654def", details: "Retired 50 tCO₂e from Coastal Wetland – WB" },
];

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
    const [filterAction, setFilterAction] = useState("ALL");
    const [searchTx, setSearchTx] = useState("");
    const [searchWallet, setSearchWallet] = useState("");

    const filteredLogs = auditLogs.filter((log) => {
        if (filterAction !== "ALL" && log.action !== filterAction) return false;
        if (searchTx && !log.txHash.toLowerCase().includes(searchTx.toLowerCase())) return false;
        if (searchWallet && !log.wallet.toLowerCase().includes(searchWallet.toLowerCase())) return false;
        return true;
    });

    return (
        <>
            <h1>Audit Log</h1>
            <p className="page-subtitle">Immutable on-chain and off-chain action log</p>


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
                    {filteredLogs.map((log) => (
                        <tr key={log.id}>
                            <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{log.timestamp}</td>
                            <td>
                                <span style={{
                                    padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                                    background: (actionColors[log.action] || "#6b7280") + "15",
                                    color: actionColors[log.action] || "#6b7280",
                                }}>
                                    {log.action.replace(/_/g, " ")}
                                </span>
                            </td>
                            <td style={{ fontSize: "13px" }}>{log.user}</td>
                            <td style={{ fontSize: "11px", fontFamily: "monospace" }}>{log.wallet}</td>
                            <td>
                                {log.txHash !== "—" ? (
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
