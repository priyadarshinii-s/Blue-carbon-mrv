import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";
import { projectsAPI, reportsAPI } from "../../services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, pendingSubs: 0, credits: 0, officers: 0, co2: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getDashboardStats().catch(() => ({ data: { data: {} } })),
      projectsAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: { projects: [] } } })),
    ]).then(([statsRes, projRes]) => {
      const statsData = statsRes.data.data || {};
      const projects = projRes.data.data.projects || [];

      setStats({
        projects: statsData.projects || 0,
        pendingSubs: statsData.pendingSubmissions || 0,
        credits: (statsData.totalCredits || 0).toLocaleString(),
        officers: statsData.activeFieldOfficers || 0,
        co2: (statsData.totalCredits || 0).toLocaleString(),
      });

      setRecentSubmissions(
        projects.slice(0, 5).map((p, i) => ({
          id: p._id || i,
          project: p.projectName,
          officer: p.assignedFieldOfficer || "Unassigned",
          date: new Date(p.updatedAt).toLocaleDateString(),
          trees: p.totalCarbonCredits || 0,
          status: p.status.toLowerCase(),
        }))
      );
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading dashboard…</div>;

  return (
    <>
      <h1>Admin Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="Total Projects" value={String(stats.projects)} color="#0f766e" />
        <StatCard title="Pending Submissions" value={String(stats.pendingSubs)} color="#b45309" />
        <StatCard title="Credits Minted" value={stats.credits} color="#7c3aed" />
        <StatCard title="Active Field Officers" value={String(stats.officers)} color="#1d4ed8" />
        <StatCard title="Verified CO₂ (tCO₂e)" value={stats.co2} color="#0f2a44" />
      </div>

      <div className="mt-20" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button className="primary-btn" onClick={() => navigate("/admin/users")}>Manage Users</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/projects")}>View Projects</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/approvals")}>Mint Queue</button>
        <button className="secondary-btn" onClick={() => navigate("/admin/reports")}>Reports</button>
      </div>

      {recentSubmissions.length > 0 && (
        <div className="mt-30">
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Recent Activity</h2>
          <table className="table">
            <thead>
              <tr><th>Project</th><th>Field Officer</th><th>Date</th><th>Trees</th><th>Status</th></tr>
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
      )}

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
