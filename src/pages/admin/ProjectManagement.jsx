import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import ProjectCard from "../../components/shared/ProjectCard";

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
  const [viewMode, setViewMode] = useState("table");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h1>Project Management</h1>
          <p className="page-subtitle">{projects.length} total projects</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={viewMode === "table" ? "primary-btn" : "secondary-btn"} onClick={() => setViewMode("table")} style={{ fontSize: "13px", padding: "6px 12px" }}>
            📋 Table
          </button>
          <button className={viewMode === "card" ? "primary-btn" : "secondary-btn"} onClick={() => setViewMode("card")} style={{ fontSize: "13px", padding: "6px 12px" }}>
            🃏 Cards
          </button>
          <button className="primary-btn" onClick={() => navigate("/admin/projects/create")}>
            + Create New Project
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
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
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                    onClick={() => { setSelectedProject(p); setActiveTab("metadata"); }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="card-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => { setSelectedProject(p); setActiveTab("metadata"); }} />
          ))}
        </div>
      )}


      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", margin: 0 }}>{selectedProject.name}</h2>
              <button onClick={() => setSelectedProject(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>


            <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #e5e7eb", marginBottom: "16px" }}>
              {["metadata", "submissions", "history", "tokens"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 16px", background: "none", border: "none",
                    borderBottom: activeTab === tab ? "2px solid #0f2a44" : "none",
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: "pointer", fontSize: "13px", textTransform: "capitalize",
                    marginBottom: "-2px",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "metadata" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
                  <div><strong>Type:</strong> {selectedProject.type}</div>
                  <div><strong>Location:</strong> {selectedProject.location}</div>
                  <div><strong>Area:</strong> {selectedProject.area} ha</div>
                  <div><strong>Status:</strong> <StatusBadge status={selectedProject.status.toLowerCase()} /></div>
                  <div><strong>Credits:</strong> {selectedProject.credits}</div>
                </div>

                <div className="mt-20">
                  <strong style={{ fontSize: "14px" }}>Assign Field Officers:</strong>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                    {allOfficers.map((o) => (
                      <button
                        key={o}
                        className={selectedProject.officers.includes(o) ? "primary-btn" : "secondary-btn"}
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                        onClick={() => handleAssignOfficer(selectedProject.id, o)}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-20">
                  <strong style={{ fontSize: "14px" }}>Assign Validators:</strong>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                    {allValidators.map((v) => (
                      <button
                        key={v}
                        className={selectedProject.validators.includes(v) ? "primary-btn" : "secondary-btn"}
                        style={{ fontSize: "12px", padding: "4px 10px" }}
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
              <div>
                <table className="table">
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
              <div>
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Action</th><th>By</th><th>Tx Hash</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>07 Feb 2026</td><td>Credits Minted</td><td>Admin</td><td style={{ fontSize: "11px", fontFamily: "monospace" }}>0xabc...def</td></tr>
                    <tr><td>05 Feb 2026</td><td>Verified</td><td>Priya Sharma</td><td style={{ fontSize: "11px", fontFamily: "monospace" }}>0x123...789</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "tokens" && (
              <div>
                <div className="card" style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: "14px" }}>Total Credits Minted</h3>
                  <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0f766e" }}>{selectedProject.credits}</p>
                  <p style={{ fontSize: "13px", color: "#6b7280" }}>tCO₂e</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectManagement;
