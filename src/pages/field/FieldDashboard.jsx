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
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>My Assigned Projects</h2>
        <div className="card-grid">
          {assignedProjects.map((p) => (
            <div key={p.id} className="card">
              <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>{p.name}</h3>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{p.location} &middot; {p.type}</p>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>{p.area} ha &middot; {p.submissions} submissions</p>
              <p style={{ fontSize: "12px", color: "#b45309", marginBottom: "10px" }}>Due: {p.dueDate}</p>
              <button className="primary-btn" style={{ fontSize: "12px", width: "100%" }} onClick={() => navigate(`/field/submit?project=${p.id}`)}>
                Submit Data
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FieldDashboard;
