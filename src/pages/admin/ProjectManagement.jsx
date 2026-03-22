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
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

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

  // Helper to map wallet address to user name
  const walletName = (wallet) => {
    if (!wallet) return "–";
    const user = users.find(u => u.walletAddress === wallet || u.walletAddress?.toLowerCase() === wallet?.toLowerCase());
    const name = user?.userName;
    const short = `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
    return name ? `${name} (${short})` : short;
  };

  const handleAssignOfficer = async (projectId, officerWallet) => {
    try {
      await projectsAPI.update(projectId, { assignedFieldOfficer: officerWallet });
      setProjects(prev => prev.map(p =>
        (p.projectId === projectId) ? { ...p, assignedFieldOfficer: officerWallet } : p
      ));
      setSelectedProject(prev => prev && prev.projectId === projectId ? { ...prev, assignedFieldOfficer: officerWallet } : prev);
      showToast("Field Officer assigned successfully!");
    } catch {
      showToast("Failed to assign Field Officer.", "error");
    }
  };

  const handleAssignValidator = async (projectId, validatorWallet) => {
    try {
      await projectsAPI.update(projectId, { assignedValidator: validatorWallet });
      setProjects(prev => prev.map(p =>
        (p.projectId === projectId) ? { ...p, assignedValidator: validatorWallet } : p
      ));
      setSelectedProject(prev => prev && prev.projectId === projectId ? { ...prev, assignedValidator: validatorWallet } : prev);
      showToast("Validator assigned successfully!");
    } catch {
      showToast("Failed to assign Validator.", "error");
    }
  };


  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading projects…</div>;

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <h1>Project Management</h1>
      </div>

      <div className="card" style={{ padding: "0", overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project Name</th><th>Type</th><th>Location</th><th>Status</th><th>Credits</th><th>Area (ha)</th><th>Officer</th><th>Validator</th><th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p._id || p.projectId}>
                <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{p.projectName}</td>
                <td>{p.projectType}</td>
                <td>{p.location}</td>
                <td><StatusBadge status={p.status?.toLowerCase()} /></td>
                <td>{p.totalCarbonCredits || 0}</td>
                <td>{p.approximateAreaHa}</td>
                <td style={{ fontSize: "12px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.assignedFieldOfficer || ""}>{walletName(p.assignedFieldOfficer)}</td>
                <td style={{ fontSize: "12px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.assignedValidator || ""}>{walletName(p.assignedValidator)}</td>
                <td style={{ textAlign: "center", display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", minWidth: "220px" }}>
                  <button className="primary-btn" style={{ fontSize: "11px", padding: "5px 8px", background: "#0d9488" }}
                    onClick={() => { setSelectedProject(p); setActiveTab("assign-fo"); }}>Assign FO</button>
                  <button className="primary-btn" style={{ fontSize: "11px", padding: "5px 8px", background: "#0284c7" }}
                    onClick={() => { setSelectedProject(p); setActiveTab("assign-validator"); }}>Assign Val</button>
                  <button className="secondary-btn" style={{ fontSize: "11px", padding: "5px 8px" }}
                    onClick={() => navigate(`/admin/projects/${p.projectId || p._id}`)}>View Details</button>
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
              {[
                { id: "assign-fo", label: "Assign Field Officer" },
                { id: "assign-validator", label: "Assign Validator" }
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding: "12px 0", background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #0f2a44" : "none", fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? "#0f2a44" : "#6b7280", cursor: "pointer", fontSize: "14px", textTransform: "capitalize", marginBottom: "-1px" }}
                >{tab.label}</button>
              ))}
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>

              {activeTab === "assign-fo" && (
                <div>
                  <div className="mt-10">
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Field Officer</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {officers.map((o) => (
                        <button key={o._id}
                          className={selectedProject.assignedFieldOfficer === o.walletAddress ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignOfficer(selectedProject.projectId, o.walletAddress)}
                        >{o.userName}</button>
                      ))}
                      {officers.length === 0 && <span style={{ color: "#6b7280", fontSize: "13px" }}>No field officers registered</span>}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assign-validator" && (
                <div>
                  <div className="mt-10">
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Validator</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {validators.map((v) => (
                        <button key={v._id}
                          className={selectedProject.assignedValidator === v.walletAddress ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignValidator(selectedProject.projectId, v.walletAddress)}
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

      {toast.show && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "white", padding: "12px 24px", borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          display: "flex", alignItems: "center", gap: "8px", fontWeight: 500,
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </>
  );
};

export default ProjectManagement;
