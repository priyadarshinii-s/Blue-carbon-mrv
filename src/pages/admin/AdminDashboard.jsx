import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";

const recentSubmissions = [
  { id: 1, project: "Mangrove Restoration – TN", officer: "Arun Kumar", date: "21 Feb 2026", trees: 350, status: "pending" },
  { id: 2, project: "Seagrass Revival – Kerala", officer: "Priya Devi", date: "20 Feb 2026", trees: 200, status: "approved" },
  { id: 3, project: "Saltmarsh Recovery – Gujarat", officer: "Vikram Singh", date: "19 Feb 2026", trees: 500, status: "approved" },
  { id: 4, project: "Mangrove Belt – Odisha", officer: "Lakshmi Nair", date: "18 Feb 2026", trees: 180, status: "rejected" },
  { id: 5, project: "Coastal Wetland – WB", officer: "Sanjay Patel", date: "17 Feb 2026", trees: 420, status: "pending" },
  { id: 6, project: "Mangrove Restoration – TN", officer: "Arun Kumar", date: "16 Feb 2026", trees: 310, status: "approved" },
  { id: 7, project: "Seagrass Revival – Kerala", officer: "Meena Rao", date: "15 Feb 2026", trees: 275, status: "approved" },
  { id: 8, project: "Tidal Flat Restoration – AP", officer: "Ravi Kumar", date: "14 Feb 2026", trees: 390, status: "minted" },
  { id: 9, project: "Delta Mangrove – Sundarbans", officer: "Amit Das", date: "13 Feb 2026", trees: 600, status: "minted" },
  { id: 10, project: "Coastal Mangrove – Goa", officer: "Neha Sharma", date: "12 Feb 2026", trees: 150, status: "pending" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Admin Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="Total Projects" value="24" color="#0f766e" />
        <StatCard title="Pending Submissions" value="8" color="#b45309" />
        <StatCard title="Credits Minted" value="6,500" color="#7c3aed" />
        <StatCard title="Active Field Officers" value="12" color="#1d4ed8" />
        <StatCard title="Verified CO₂ (tCO₂e)" value="6,720" color="#0f2a44" />
      </div>

      <div className="mt-20" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button className="primary-btn" onClick={() => navigate("/admin/users")}>Manage Users</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/projects")}>View Projects</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/approvals")}>Mint Queue</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/reports")}>Reports</button>
      </div>

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Recent Submissions</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Field Officer</th>
              <th>Date</th>
              <th>Trees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSubmissions.map((s) => (
              <tr key={s.id}>
                <td>{s.project}</td>
                <td>{s.officer}</td>
                <td>{s.date}</td>
                <td>{s.trees}</td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Active Projects Map</h2>
        <MapComponent
          pins={[
            { lat: 11.12, lng: 78.65 },
            { lat: 10.85, lng: 76.27 },
            { lat: 20.94, lng: 85.09 },
          ]}
          height="280px"
        />
      </div>
    </>
  );
};

export default AdminDashboard;
