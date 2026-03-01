import { useState, useEffect } from "react";
import { verificationsAPI } from "../../services/api";

const statusColors = {
  Approved: { bg: "#f0fdf4", color: "#166534" },
  Rejected: { bg: "#fef2f2", color: "#991b1b" },
};

const VerificationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificationsAPI.getHistory()
      .then(res => setHistory(res.data.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading verification history…</div>;

  return (
    <>
      <h1>Verification History</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Submission</th>
            <th>Date</th>
            <th>Status</th>
            <th>Credits</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No verification history found.</td></tr>
          ) : history.map((v) => (
            <tr key={v.id}>
              <td style={{ fontWeight: 500 }}>{v.projectName}</td>
              <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{v.submissionId}</td>
              <td>{new Date(v.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
              <td>
                <span style={{
                  padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                  background: (statusColors[v.status] || { bg: "#f3f4f6" }).bg,
                  color: (statusColors[v.status] || { color: "#374151" }).color,
                }}>
                  {v.status}
                </span>
              </td>
              <td>{v.approvedCredits > 0 ? `${v.approvedCredits} tCO₂e` : "—"}</td>
              <td style={{ fontSize: "13px", maxWidth: "250px" }}>{v.remarks || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>
        Showing {history.length} verification{history.length !== 1 ? "s" : ""}
      </p>
    </>
  );
};

export default VerificationHistory;
