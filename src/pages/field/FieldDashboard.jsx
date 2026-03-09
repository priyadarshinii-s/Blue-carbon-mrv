import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/shared/StatCard";
import MapComponent from "../../components/shared/MapComponent";
import { projectsAPI, reportsAPI, submissionsAPI } from "../../services/api";

const FieldDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, submissions: 0, pending: 0, credits: 0 });
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsAPI.getAll({ role: "FIELD" }).catch(() => ({ data: { data: { projects: [] } } })),
      reportsAPI.getDashboardStats().catch(() => ({ data: { data: {} } })),
      submissionsAPI.getMy().catch(() => ({ data: { data: { submissions: [] } } })),
    ]).then(([projRes, statsRes, subRes]) => {
      const projects = projRes.data.data.projects || [];
      setProjects(projects);
      const s = statsRes.data.data || {};
      const submissions = subRes.data.data.submissions || [];
      setStats({
        assigned: s.assignedProjects || 0,
        submissions: s.mySubmissions || 0,
        pending: s.pendingApproval || 0,
        credits: 0,
      });

      // Extract unique map pins from submissions for assigned projects
      const pins = [];
      const projectNames = {};
      projects.forEach(p => projectNames[p.projectId] = p.projectName);

      // We only need one pin per project, so we'll use a set to track
      const mappedProjects = new Set();

      submissions.forEach(sub => {
        if (sub.gps && sub.gps.lat && sub.gps.lng && !mappedProjects.has(sub.projectId)) {
          pins.push({
            lat: sub.gps.lat,
            lng: sub.gps.lng,
            label: `${projectNames[sub.projectId] || sub.projectId} (My Submission)`
          });
          mappedProjects.add(sub.projectId);
        }
      });

      setMapPins(pins);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading dashboard…</div>;

  return (
    <>
      <h1>Field Officer Dashboard</h1>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="Assigned Projects" value={String(stats.assigned)} color="#0f766e" />
        <StatCard title="Total Submissions" value={String(stats.submissions)} color="#0f2a44" />
        <StatCard title="Pending Approval" value={String(stats.pending)} color="#b45309" />
        <StatCard title="Credits Earned" value="– tCO₂e" color="#7c3aed" />
      </div>

      <div className="mt-20">
        <button className="primary-btn" onClick={() => navigate("/field/submit")} style={{ padding: "10px 24px" }}>
          New Submission
        </button>
      </div>

      {mapPins.length > 0 && (
        <div className="mt-30">
          <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>My Project Locations</h2>
          <MapComponent pins={mapPins} height="280px" />
        </div>
      )}

      <div className="mt-30">
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>My Assigned Projects</h2>
        <div className="list-container">
          {projects.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>No projects assigned yet.</div>
          ) : (
            projects.map((p) => (
              <div key={p.projectId} className="list-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/field/submit?project=${p.projectId}`)}>
                <div className="list-row-main">
                  <span className="list-row-title">{p.projectName}</span>
                  <span className="list-row-meta">{p.location} · {p.projectType} · {p.approximateAreaHa} ha · {p.status}</span>
                </div>
                <div className="list-row-end">
                  <span style={{ fontSize: "11px", background: "#dcfce7", color: "#047857", borderRadius: "999px", padding: "2px 10px", fontWeight: 600 }}>{p.status}</span>
                  <button
                    className="primary-btn"
                    style={{ fontSize: "12px", padding: "5px 14px" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/field/submit?project=${p.projectId}`); }}
                  >
                    Submit Data
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default FieldDashboard;
