import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";

const recentActivity = [
  { id: 5, project: "Mangrove Restoration – TN", officer: "Arun Kumar", date: "21 Feb 2026", trees: 350, status: "pending" },
  { id: 6, project: "Seagrass Revival – Kerala", officer: "Lakshmi Nair", date: "20 Feb 2026", trees: 180, status: "pending" },
  { id: 3, project: "Saltmarsh Recovery – Gujarat", officer: "Vikram Singh", date: "18 Feb 2026", trees: 500, status: "approved" },
  { id: 4, project: "Mangrove Belt – Odisha", officer: "Priya Devi", date: "17 Feb 2026", trees: 200, status: "rejected" },
  { id: 7, project: "Delta Mangrove – WB", officer: "Sanjay Patel", date: "15 Feb 2026", trees: 420, status: "approved" },
];

const ValidatorDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Validator Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="In Queue" value="5" color="#b45309" />
        <StatCard title="Verified This Month" value="18" color="#047857" />
        <StatCard title="Rejected" value="3" color="#b91c1c" />
        <StatCard title="Avg. Review Time" value="1.4 days" color="#7c3aed" />
      </div>

      <div className="mt-20">
        <button className="primary-btn" onClick={() => navigate("/validator/queue")} style={{ padding: "10px 24px" }}>
          Open Verification Queue
        </button>
      </div>

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Recent Activity</h2>
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
            {recentActivity.map((s) => (
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
    </>
  );
};

export default ValidatorDashboard;
