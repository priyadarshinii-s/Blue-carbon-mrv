import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { projectsAPI } from "../../services/api";




const AssignedProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getAll()
      .then((res) => setProjects(res.data.data.projects || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading projects…</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>Assigned Projects</h1>
        </div>
      </div>

      <div className="list-container">
        {projects.map((p) => (
          <div key={p._id || p.projectId} className="list-row" style={{ cursor: "pointer" }} onClick={() => navigate(`/field/submit?project=${p.projectId || p._id}`)}>
            <div className="list-row-main">
              <span className="list-row-title">{p.projectName}</span>
              <span className="list-row-meta">{p.location} · {p.projectType} · {p.approximateAreaHa} ha</span>
            </div>
            <div className="list-row-end">
              <StatusBadge status={p.status?.toLowerCase()} />
              <button
                className="primary-btn"
                style={{ fontSize: "12px", padding: "5px 14px" }}
                onClick={(e) => { e.stopPropagation(); navigate(`/field/submit?project=${p.projectId || p._id}`); }}
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
