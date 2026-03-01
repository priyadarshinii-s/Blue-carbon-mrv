import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { projectsAPI, adminAPI } from "../../services/api";




const ProjectManagement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("metadata");

  useEffect(() => {
    Promise.all([
      projectsAPI.getAll().catch(() => ({ data: { data: { projects: [] } } })),
      adminAPI.getUsers().catch(() => ({ data: { data: [] } })),
    ]).then(([projRes, usersRes]) => {
      setProjects(projRes.data.data.projects || []);
      setUsers(usersRes.data.data.users || []);
      setLoading(false);
    });
  }, []);

  const officers = users.filter(u => u.role === "FIELD_OFFICER");
  const validators = users.filter(u => u.role === "VALIDATOR");

  const handleAssignOfficer = async (projectId, officerWallet) => {
    try {
      await projectsAPI.update(projectId, { assignedFieldOfficer: officerWallet });
    } catch { }
    setProjects(prev => prev.map(p =>
      (p._id === projectId || p.projectId === projectId) ? { ...p, assignedFieldOfficer: officerWallet } : p
    ));
  };

  const handleAssignValidator = async (projectId, validatorWallet) => {
    try {
      await projectsAPI.update(projectId, { assignedValidator: validatorWallet });
    } catch { }
    setProjects(prev => prev.map(p =>
      (p._id === projectId || p.projectId === projectId) ? { ...p, assignedValidator: validatorWallet } : p
    ));
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading projects…</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div><h1>Project Management</h1></div>
        <button className="primary-btn" onClick={() => navigate("/admin/projects/create")} style={{ padding: "10px 24px" }}>+ Create New Project</button>
      </div>

      <div className="list-container" style={{ background: "white", padding: "0" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project Name</th><th>Type</th><th>Location</th><th>Status</th><th>Credits</th><th>Area (ha)</th><th>Officer</th><th>Validator</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p._id || p.projectId}>
                <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                <td>{p.projectType}</td>
                <td>{p.location}</td>
                <td><StatusBadge status={p.status?.toLowerCase()} /></td>
                <td>{p.totalCarbonCredits || 0}</td>
                <td>{p.approximateAreaHa}</td>
                <td style={{ fontSize: "12px" }}>{p.assignedFieldOfficer || "–"}</td>
                <td style={{ fontSize: "12px" }}>{p.assignedValidator || "–"}</td>
                <td>
                  <button className="secondary-btn" style={{ fontSize: "12px", padding: "5px 12px" }}
                    onClick={() => { setSelectedProject(p); setActiveTab("metadata"); }}>Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "750px", width: "95%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: 0 }}>{selectedProject.projectName}</h2>
              <button onClick={() => setSelectedProject(null)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
              {["metadata", "assignments"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "12px 0", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #0f2a44" : "none", fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "#0f2a44" : "#6b7280", cursor: "pointer", fontSize: "14px", textTransform: "capitalize", marginBottom: "-1px" }}
                >{tab}</button>
              ))}
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
              {activeTab === "metadata" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div><strong>Type:</strong> {selectedProject.projectType}</div>
                  <div><strong>Location:</strong> {selectedProject.location}</div>
                  <div><strong>Area:</strong> {selectedProject.approximateAreaHa} ha</div>
                  <div><strong>Status:</strong> <StatusBadge status={selectedProject.status?.toLowerCase()} /></div>
                  <div style={{ gridColumn: "span 2" }}><strong>Credits:</strong> {selectedProject.totalCarbonCredits || 0} tCO₂e</div>
                  {selectedProject.description && <div style={{ gridColumn: "span 2" }}><strong>Description:</strong> {selectedProject.description}</div>}
                </div>
              )}

              {activeTab === "assignments" && (
                <div>
                  <div className="mt-20">
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Field Officer</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {officers.map((o) => (
                        <button key={o._id}
                          className={selectedProject.assignedFieldOfficer === o.walletAddress ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignOfficer(selectedProject._id || selectedProject.projectId, o.walletAddress)}
                        >{o.userName}</button>
                      ))}
                      {officers.length === 0 && <span style={{ color: "#6b7280", fontSize: "13px" }}>No field officers registered</span>}
                    </div>
                  </div>

                  <div className="mt-20" style={{ marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Validator</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {validators.map((v) => (
                        <button key={v._id}
                          className={selectedProject.assignedValidator === v.walletAddress ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignValidator(selectedProject._id || selectedProject.projectId, v.walletAddress)}
                        >{v.userName}</button>
                      ))}
                      {validators.length === 0 && <span style={{ color: "#6b7280", fontSize: "13px" }}>No validators registered</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectManagement;
