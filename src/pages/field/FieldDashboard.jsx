import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import ProjectCard from "../../components/shared/ProjectCard";

const assignedProjects = [
  { id: 1, name: "Mangrove Restoration – TN", type: "Mangrove", location: "Tamil Nadu", status: "Active", area: 25.5, dueDate: "28 Feb 2026", submissions: 8 },
  { id: 2, name: "Seagrass Revival – Kerala", type: "Seagrass", location: "Kerala", status: "Active", area: 15.2, dueDate: "05 Mar 2026", submissions: 4 },
  { id: 3, name: "Saltmarsh Recovery – Gujarat", type: "Salt Marsh", location: "Gujarat", status: "Active", area: 32.0, dueDate: "10 Mar 2026", submissions: 6 },
];

const FieldDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Field Officer Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="Assigned Projects" value="3" color="#0f766e" />
        <StatCard title="Submissions This Month" value="4" color="#0f2a44" />
        <StatCard title="Pending Approval" value="2" color="#b45309" />
        <StatCard title="Credits Earned" value="52 tCO₂e" color="#7c3aed" />
      </div>

      <div className="mt-20">
        <button className="primary-btn" onClick={() => navigate("/field/submit")} style={{ padding: "10px 24px" }}>
          New Submission
        </button>
      </div>

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>My Assigned Projects</h2>
        <div className="list-container">
          {assignedProjects.map((p) => (
            <div key={p.id} className="list-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/field/submit?project=${p.id}`)}>
              <div className="list-row-main">
                <span className="list-row-title">{p.name}</span>
                <span className="list-row-meta">{p.location} · {p.type} · {p.area} ha · {p.submissions} submissions · Due {p.dueDate}</span>
              </div>
              <div className="list-row-end">
                <span style={{ fontSize: "11px", background: "#dcfce7", color: "#047857", borderRadius: "999px", padding: "2px 10px", fontWeight: 600 }}>Active</span>
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
      </div>
    </>
  );
};

export default FieldDashboard;
