import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";

const projects = [
  { id: 1, name: "Mangrove Restoration – TN", type: "Mangrove", location: "Tamil Nadu", status: "Active", area: 25.5, submissions: 8, lastVisit: "18 Feb 2026" },
  { id: 2, name: "Seagrass Revival – Kerala", type: "Seagrass", location: "Kerala", status: "Active", area: 15.2, submissions: 4, lastVisit: "15 Feb 2026" },
  { id: 3, name: "Saltmarsh Recovery – Gujarat", type: "Salt Marsh", location: "Gujarat", status: "Active", area: 32.0, submissions: 3, lastVisit: "12 Feb 2026" },
];

const AssignedProjects = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Assigned Projects</h1>
      <p className="page-subtitle">Projects assigned to you for field data collection</p>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        {projects.map((p) => (
          <div key={p.id} className="card" style={{ cursor: "pointer" }} onClick={() => navigate(`/field/submit?project=${p.id}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{p.name}</h3>
              <StatusBadge status={p.status.toLowerCase()} />
            </div>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0" }}>{p.location}</p>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0" }}>{p.type} &middot; {p.area} ha</p>

            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "12px", paddingTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#6b7280" }}>
              <div>Submissions: <strong>{p.submissions}</strong></div>
              <div>Last visit: <strong>{p.lastVisit}</strong></div>
            </div>

            <button className="primary-btn" style={{ width: "100%", marginTop: "12px", fontSize: "13px" }} onClick={(e) => { e.stopPropagation(); navigate(`/field/submit?project=${p.id}`); }}>
              Submit Data
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default AssignedProjects;
