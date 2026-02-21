import { useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";

const submissions = [
  {
    id: 1, project: "Mangrove Restoration – TN", date: "21 Feb 2026", treeCount: 350,
    survivalRate: 85, status: "pending", gps: "11.127, 78.656",
    validatorComment: "",
  },
  {
    id: 2, project: "Seagrass Revival – Kerala", date: "18 Feb 2026", treeCount: 200,
    survivalRate: 90, status: "correction", gps: "10.850, 76.271",
    validatorComment: "Photo #2 is blurry. Please re-submit with clearer images of the seagrass bed.",
  },
  {
    id: 3, project: "Mangrove Restoration – TN", date: "14 Feb 2026", treeCount: 310,
    survivalRate: 82, status: "approved", gps: "11.130, 78.660",
    validatorComment: "All data verified. GPS matches site location. Photos are clear.",
  },
  {
    id: 4, project: "Saltmarsh Recovery – Gujarat", date: "10 Feb 2026", treeCount: 275,
    survivalRate: 78, status: "approved", gps: "21.170, 72.831",
    validatorComment: "Verified. Good documentation of site conditions.",
  },
  {
    id: 5, project: "Mangrove Restoration – TN", date: "07 Feb 2026", treeCount: 280,
    survivalRate: 88, status: "approved", gps: "11.125, 78.652",
    validatorComment: "Excellent submission. Carbon sampling notes very detailed.",
  },
  {
    id: 6, project: "Seagrass Revival – Kerala", date: "01 Feb 2026", treeCount: 150,
    survivalRate: 70, status: "rejected", gps: "10.845, 76.268",
    validatorComment: "GPS coordinates do not match the project site. Please verify location and re-submit.",
  },
];

const SubmissionHistory = () => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = submissions.filter((s) => {
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  return (
    <>
      <h1>Submission History</h1>
      <p className="page-subtitle">Track all your field data submissions and their review status</p>


      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", marginRight: "8px" }}>Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px" }}>
          <option value="ALL">All</option>
          <option value="pending">Pending</option>
          <option value="correction">Needs Correction</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Date</th>
            <th>Trees</th>
            <th>Survival %</th>
            <th>GPS</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td style={{ fontWeight: 500 }}>{s.project}</td>
              <td>{s.date}</td>
              <td>{s.treeCount}</td>
              <td>{s.survivalRate}%</td>
              <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{s.gps}</td>
              <td><StatusBadge status={s.status} /></td>
              <td>
                <button
                  className="secondary-btn"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                  onClick={() => setSelectedSubmission(s)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>Submission Details</h2>
              <button onClick={() => setSelectedSubmission(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ fontSize: "14px", lineHeight: "2" }}>
              <div><strong>Project:</strong> {selectedSubmission.project}</div>
              <div><strong>Date:</strong> {selectedSubmission.date}</div>
              <div><strong>Tree Count:</strong> {selectedSubmission.treeCount}</div>
              <div><strong>Survival Rate:</strong> {selectedSubmission.survivalRate}%</div>
              <div><strong>GPS:</strong> {selectedSubmission.gps}</div>
              <div><strong>Status:</strong> <StatusBadge status={selectedSubmission.status} /></div>
            </div>

            {selectedSubmission.validatorComment && (
              <div className="card mt-20" style={{
                borderLeftColor: selectedSubmission.status === "approved" ? "#047857" :
                  selectedSubmission.status === "rejected" ? "#b91c1c" : "#b45309",
              }}>
                <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Validator Comments</h3>
                <p style={{ fontSize: "14px", color: "#374151" }}>{selectedSubmission.validatorComment}</p>
              </div>
            )}

            {selectedSubmission.status === "correction" && (
              <button className="primary-btn mt-20" onClick={() => { setSelectedSubmission(null); }}>
                📝 Re-submit with Corrections
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SubmissionHistory;
