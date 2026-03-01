import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { verificationsAPI, reportsAPI } from "../../services/api";

const ValidatorDashboard = () => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({ queue: 0, verified: 0, rejected: 0, avgTime: "–" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      verificationsAPI.getQueue().catch(() => ({ data: { data: { submissions: [] } } })),
      reportsAPI.getDashboardStats().catch(() => ({ data: { data: {} } })),
    ]).then(([queueRes, statsRes]) => {
      const submissions = queueRes.data.data.submissions || [];
      const s = statsRes.data.data || {};

      setStats({
        queue: s.queueSize || 0,
        verified: s.verifiedTotal || 0,
        rejected: s.rejectedTotal || 0,
        avgTime: s.avgReviewTimeMs
          ? s.avgReviewTimeMs >= 86400000
            ? `${(s.avgReviewTimeMs / 86400000).toFixed(1)} days`
            : `${(s.avgReviewTimeMs / 3600000).toFixed(1)} hrs`
          : "–"
      });

      setActivity(submissions.slice(0, 5).map(sub => ({
        id: sub.submissionId,
        project: sub.projectId,
        officer: sub.fieldOfficerWallet,
        date: new Date(sub.createdAt).toLocaleDateString(),
        trees: sub.survivingTrees || 0,
        status: sub.status.toLowerCase()
      })));
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading dashboard…</div>;

  return (
    <>
      <h1>Validator Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="In Queue" value={String(stats.queue)} color="#b45309" />
        <StatCard title="Verified (Total)" value={String(stats.verified)} color="#047857" />
        <StatCard title="Rejected" value={String(stats.rejected)} color="#b91c1c" />
        <StatCard title="Avg. Review Time" value={stats.avgTime} color="#7c3aed" />
      </div>

      <div className="mt-20">
        <button className="primary-btn" onClick={() => navigate("/validator/queue")} style={{ padding: "10px 24px" }}>
          Open Verification Queue
        </button>
      </div>

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Recent Activity (Queue)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Project ID</th>
              <th>Field Officer</th>
              <th>Date</th>
              <th>Trees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activity.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>No recent activity found.</td></tr>
            ) : (
              activity.map((s) => (
                <tr key={s.id}>
                  <td>{s.project}</td>
                  <td>{s.officer?.slice(0, 10)}...</td>
                  <td>{s.date}</td>
                  <td>{s.trees}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ValidatorDashboard;
