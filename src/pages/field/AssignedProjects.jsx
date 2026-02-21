import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";

const projects = [
  { id: 1, name: "Mangrove Restoration – TN", type: "Mangrove", location: "Tamil Nadu", status: "Active", area: 25.5, submissions: 8, lastVisit: "18 Feb 2026" },
  { id: 2, name: "Seagrass Revival – Kerala", type: "Seagrass", location: "Kerala", status: "Active", area: 15.2, submissions: 4, lastVisit: "15 Feb 2026" },
  { id: 3, name: "Saltmarsh Recovery – Gujarat", type: "Salt Marsh", location: "Gujarat", status: "Active", area: 32.0, submissions: 3, lastVisit: "12 Feb 2026" },
  { id: 4, name: "Mangrove Belt – Odisha", type: "Mangrove", location: "Odisha", status: "Active", area: 40.0, submissions: 6, lastVisit: "05 Feb 2026" },
  { id: 5, name: "Tidal Flat Restoration – AP", type: "Salt Marsh", location: "Andhra Pradesh", status: "Active", area: 22.3, submissions: 2, lastVisit: "28 Jan 2026" },
  { id: 6, name: "Coastal Wetland – West Bengal", type: "Mangrove", location: "West Bengal", status: "Completed", area: 18.7, submissions: 12, lastVisit: "10 Jan 2026" },
];

const AssignedProjects = () => {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Assigned Projects</h1>
        </div>
      </div>

      <div className="list-container">
        {projects.map((p) => (
          <div key={p.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/field/submit?project=${p.id}`)}>
            <div className="list-row-main">
              <span className="list-row-title">{p.name}</span>
              <span className="list-row-meta">{p.location} · {p.type} · {p.area} ha · {p.submissions} submissions · Last visit {p.lastVisit}</span>
            </div>
            <div className="list-row-end">
              <StatusBadge status={p.status.toLowerCase()} />
              <button
                className="primary-btn"
                style={{ fontSize: "12px", padding: "5px 14px" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/field/submit?project=${p.id}`); }}
              >
                Submit Data
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AssignedProjects;
