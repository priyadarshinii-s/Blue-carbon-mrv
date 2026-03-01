import { useState, useEffect } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import { submissionsAPI } from "../../services/api";




const statusMap = { Pending: "pending", NeedsCorrection: "correction", Approved: "approved", Rejected: "rejected" };
const borderColor = { pending: "#9ca3af", correction: "#b45309", approved: "#047857", rejected: "#b91c1c" };

const SubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    submissionsAPI.getMy()
      .then((res) => setSubmissions(res.data.data.submissions || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  const mapStatus = (s) => statusMap[s] || s?.toLowerCase() || "pending";

  const filtered = submissions.filter((s) => {
    const display = mapStatus(s.status);
    return statusFilter === "ALL" || display === statusFilter;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–";

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading submissions…</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Submission History</h1>
        </div>
        <div>
          <label style={{ fontSize: "13px", marginRight: "8px" }}>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
            <option value="ALL">All</option>
            <option value="pending">Pending</option>
            <option value="correction">Needs Correction</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="list-container">
        {filtered.map((s) => {
          const display = mapStatus(s.status);
          return (
            <div
              key={s._id || s.submissionId}
              className="list-row"
              style={{ cursor: "pointer", borderLeft: `3px solid ${borderColor[display]}` }}
              onClick={() => setSelectedSubmission(s)}
            >
              <div className="list-row-main">
                <span className="list-row-title">{s.projectId}</span>
                <span className="list-row-meta">{formatDate(s.visitDate)} · {s.survivingTrees} trees · {s.survivalRate}% survival · GPS {s.gps?.lat}, {s.gps?.lng}</span>
              </div>
              <div className="list-row-end">
                <StatusBadge status={display} />
                <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }} onClick={(e) => { e.stopPropagation(); setSelectedSubmission(s); }}>
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Submission Details</h2>
              <button onClick={() => setSelectedSubmission(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: "14px", lineHeight: "2" }}>
              <div><strong>Project:</strong> {selectedSubmission.projectId}</div>
              <div><strong>Date:</strong> {formatDate(selectedSubmission.visitDate)}</div>
              <div><strong>Tree Count:</strong> {selectedSubmission.survivingTrees}</div>
              <div><strong>Survival Rate:</strong> {selectedSubmission.survivalRate}%</div>
              <div><strong>GPS:</strong> {selectedSubmission.gps?.lat}, {selectedSubmission.gps?.lng}</div>
              <div><strong>Status:</strong> <StatusBadge status={mapStatus(selectedSubmission.status)} /></div>
            </div>
            {selectedSubmission.validatorComments && (
              <div className="card mt-20" style={{ borderLeftColor: borderColor[mapStatus(selectedSubmission.status)] }}>
                <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Validator Comments</h3>
                <p style={{ fontSize: "14px", color: "#374151" }}>{selectedSubmission.validatorComments}</p>
              </div>
            )}
            {mapStatus(selectedSubmission.status) === "correction" && (
              <button className="primary-btn mt-20" onClick={() => setSelectedSubmission(null)}>
                Re-submit with Corrections
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SubmissionHistory;
