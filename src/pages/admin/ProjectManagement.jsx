import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";

const mockProjects = [
  { id: 1, name: "Mangrove Restoration – TN", type: "Mangrove", location: "Tamil Nadu", status: "Active", credits: 120, area: 25.5, officers: ["Arun Kumar"], validators: ["Priya Sharma"] },
  { id: 2, name: "Seagrass Revival – Kerala", type: "Seagrass", location: "Kerala", status: "Pending", credits: 0, area: 15.2, officers: ["Priya Devi"], validators: [] },
  { id: 3, name: "Saltmarsh Recovery – Gujarat", type: "Salt Marsh", location: "Gujarat", status: "Active", credits: 85, area: 32.0, officers: ["Vikram Singh"], validators: ["Priya Sharma"] },
  { id: 4, name: "Mangrove Belt – Odisha", type: "Mangrove", location: "Odisha", status: "Active", credits: 200, area: 40.0, officers: ["Lakshmi Nair"], validators: ["Priya Sharma"] },
  { id: 5, name: "Coastal Wetland – West Bengal", type: "Mangrove", location: "West Bengal", status: "Completed", credits: 310, area: 18.7, officers: ["Amit Das"], validators: ["Priya Sharma"] },
  { id: 6, name: "Tidal Flat Restoration – AP", type: "Salt Marsh", location: "Andhra Pradesh", status: "Active", credits: 55, area: 22.3, officers: ["Ravi Kumar"], validators: [] },
];

const allOfficers = ["Arun Kumar", "Priya Devi", "Vikram Singh", "Lakshmi Nair", "Amit Das", "Ravi Kumar"];
const allValidators = ["Priya Sharma", "Suresh Menon", "Kavita Reddy"];

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(mockProjects);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("metadata");

  const handleAssignOfficer = (projectId, officer) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && !p.officers.includes(officer)
          ? { ...p, officers: [...p.officers, officer] }
          : p
      )
    );
  };

  const handleAssignValidator = (projectId, validator) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId && !p.validators.includes(validator)
          ? { ...p, validators: [...p.validators, validator] }
          : p
      )
    );
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Project Management</h1>
        </div>
        <button className="primary-btn" onClick={() => navigate("/admin/projects/create")} style={{ padding: "10px 24px" }}>
          + Create New Project
        </button>
      </div>

      <div className="list-container" style={{ background: "white", padding: "0" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Area (ha)</th>
              <th>Officers</th>
              <th>Validators</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.location}</td>
                <td><StatusBadge status={p.status.toLowerCase()} /></td>
                <td>{p.credits}</td>
                <td>{p.area}</td>
                <td style={{ fontSize: "12px" }}>{p.officers.join(", ") || "–"}</td>
                <td style={{ fontSize: "12px" }}>{p.validators.join(", ") || "–"}</td>
                <td>
                  <button
                    className="secondary-btn"
                    style={{ fontSize: "12px", padding: "5px 12px" }}
                    onClick={() => { setSelectedProject(p); setActiveTab("metadata"); }}
                  >
                    Manage
                  </button>
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
              <h2 style={{ fontSize: "20px", margin: 0 }}>{selectedProject.name}</h2>
              <button onClick={() => setSelectedProject(null)} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid #e5e7eb", marginBottom: "20px" }}>
              {["metadata", "submissions", "history", "tokens"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "12px 0", background: "none", border: "none",
                    borderBottom: activeTab === tab ? "2px solid #0f2a44" : "none",
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? "#0f2a44" : "#6b7280",
                    cursor: "pointer", fontSize: "14px", textTransform: "capitalize",
                    marginBottom: "-1px",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "8px" }}>
              {activeTab === "metadata" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px", marginBottom: "24px", background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div><strong>Type:</strong> {selectedProject.type}</div>
                    <div><strong>Location:</strong> {selectedProject.location}</div>
                    <div><strong>Area:</strong> {selectedProject.area} ha</div>
                    <div><strong>Status:</strong> <StatusBadge status={selectedProject.status.toLowerCase()} /></div>
                    <div style={{ gridColumn: "span 2" }}><strong>Current Credits:</strong> {selectedProject.credits} tCO₂e</div>
                  </div>

                  <div className="mt-20">
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Field Officers</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {allOfficers.map((o) => (
                        <button
                          key={o}
                          className={selectedProject.officers.includes(o) ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignOfficer(selectedProject.id, o)}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-20" style={{ marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "15px", marginBottom: "12px", fontWeight: 600 }}>Assign Validators</h3>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {allValidators.map((v) => (
                        <button
                          key={v}
                          className={selectedProject.validators.includes(v) ? "primary-btn" : "secondary-btn"}
                          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "20px" }}
                          onClick={() => handleAssignValidator(selectedProject.id, v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "submissions" && (
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr><th>Date</th><th>Officer</th><th>Trees</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>21 Feb 2026</td><td>Arun Kumar</td><td>350</td><td><StatusBadge status="pending" /></td></tr>
                      <tr><td>14 Feb 2026</td><td>Arun Kumar</td><td>310</td><td><StatusBadge status="approved" /></td></tr>
                      <tr><td>07 Feb 2026</td><td>Arun Kumar</td><td>280</td><td><StatusBadge status="minted" /></td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "history" && (
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr><th>Date</th><th>Action</th><th>By</th><th>Tx Hash</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>07 Feb 2026</td><td>Credits Minted</td><td>Admin</td><td style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}>0xabc...def</td></tr>
                      <tr><td>05 Feb 2026</td><td>Verified</td><td>Priya Sharma</td><td style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}>0x123...789</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "tokens" && (
                <div style={{ padding: "30px", textAlign: "center", background: "#f0fdfa", borderRadius: "12px", border: "1px dashed #0f766e" }}>
                  <h3 style={{ fontSize: "16px", color: "#0f2a44", marginBottom: "10px" }}>Total Carbon Credits Generated</h3>
                  <p style={{ fontSize: "42px", fontWeight: 800, color: "#0f766e", margin: "10px 0" }}>{selectedProject.credits}</p>
                  <p style={{ fontSize: "14px", color: "#6b7280" }}>Verified tCO₂e on Polygon Network</p>
                  <button className="primary-btn" style={{ marginTop: "24px", padding: "10px 30px" }} disabled={selectedProject.credits === 0}>
                    Mint New Tokens
                  </button>
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
