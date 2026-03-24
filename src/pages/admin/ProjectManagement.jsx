import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import StatCard from "../../components/shared/StatCard";
import { projectsAPI, adminAPI } from "../../services/api";

const TYPE_COLORS = {
  mangrove:  { bg: "linear-gradient(135deg, #d1fae5, #a7f3d0)", text: "#065f46", border: "#6ee7b7" },
  seagrass:  { bg: "linear-gradient(135deg, #dbeafe, #bfdbfe)", text: "#1e40af", border: "#93c5fd" },
  mixed:     { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", text: "#92400e", border: "#fcd34d" },
  default:   { bg: "linear-gradient(135deg, #f3f4f6, #e5e7eb)", text: "#374151", border: "#d1d5db" },
};

const getTypeColor = (type) => {
  if (!type) return TYPE_COLORS.default;
  const key = type.toLowerCase();
  return TYPE_COLORS[key] || TYPE_COLORS.default;
};

const TypePill = ({ type }) => {
  const c = getTypeColor(type);
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
      whiteSpace: "nowrap", display: "inline-block",
    }}>
      {type || "–"}
    </span>
  );
};

const AvatarName = ({ name, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{
      width: "28px", height: "28px", borderRadius: "50%",
      background: "linear-gradient(135deg, #0f766e, #0d9488)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px", fontWeight: 700, flexShrink: 0,
    }}>
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
      {subtitle && <div style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>}
    </div>
  </div>
);

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState("assign-fo");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const walletToUser = useMemo(() => {
    const map = {};
    users.forEach(u => {
      if (u.walletAddress) {
        map[u.walletAddress] = u;
        map[u.walletAddress.toLowerCase()] = u;
      }
    });
    return map;
  }, [users]);

  const getUserForWallet = (wallet) => {
    if (!wallet) return null;
    return walletToUser[wallet] || walletToUser[wallet.toLowerCase()] || null;
  };

  // Computed stats
  const stats = useMemo(() => {
    const total = projects.length;
    const submitted = projects.filter(p => p.status?.toLowerCase() === "submitted").length;
    const pending = projects.filter(p => p.status?.toLowerCase() === "pending").length;
    const totalHa = projects.reduce((sum, p) => sum + (Number(p.approximateAreaHa) || 0), 0);
    return { total, submitted, pending, totalHa };
  }, [projects]);

  // Unique ecosystem types for filter pills
  const ecosystemTypes = useMemo(() => {
    const types = new Set();
    projects.forEach(p => { if (p.projectType) types.add(p.projectType); });
    return Array.from(types);
  }, [projects]);

  // Unique statuses for filter pills
  const statusOptions = useMemo(() => {
    const s = new Set();
    projects.forEach(p => { if (p.status) s.add(p.status.toLowerCase()); });
    return Array.from(s);
  }, [projects]);

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== "all" && p.status?.toLowerCase() !== statusFilter) return false;
      if (typeFilter !== "all" && p.projectType !== typeFilter) return false;
      if (search && !p.projectName?.toLowerCase().includes(search.toLowerCase()) && !p.location?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, statusFilter, typeFilter, search]);

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
      <div style={{ marginBottom: "16px" }}>
        <h1>Project Management</h1>
      </div>

      <div className="card-grid" style={{ marginTop: "16px" }}>
        <StatCard title="Total Projects" value={String(stats.total)} color="#0f766e" />
        <StatCard title="Submitted" value={String(stats.submitted)} color="#1d4ed8" />
        <StatCard title="Pending" value={String(stats.pending)} color="#b45309" />
        <StatCard title="Total Area" value={`${stats.totalHa.toLocaleString()} ha`} color="#7c3aed" />
      </div>

      {/* Search + Filter Bar */}
      <div className="mt-20" style={{
        display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center",
        marginBottom: "16px",
      }}>
        <input
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "7px 12px", border: "1px solid #d1d5db",
            borderRadius: "8px", fontSize: "13px", outline: "none", background: "#fff",
            width: "200px", transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "#0f766e"}
          onBlur={e => e.target.style.borderColor = "#d1d5db"}
        />

        {statusOptions.map(s => {
          const isActive = statusFilter === s;
          if (statusFilter !== "all" && !isActive) return null;
          const pillColors = {
            pending:    { bg: "#fef3c7", activeBg: "#92400e", text: "#92400e", activeText: "#fff" },
            submitted:  { bg: "#dbeafe", activeBg: "#1e40af", text: "#1e40af", activeText: "#fff" },
            approved:   { bg: "#d1fae5", activeBg: "#065f46", text: "#065f46", activeText: "#fff" },
            rejected:   { bg: "#fee2e2", activeBg: "#991b1b", text: "#991b1b", activeText: "#fff" },
            minted:     { bg: "#ede9fe", activeBg: "#5b21b6", text: "#5b21b6", activeText: "#fff" },
            active:     { bg: "#d1fae5", activeBg: "#065f46", text: "#065f46", activeText: "#fff" },
            validated:  { bg: "#ede9fe", activeBg: "#6d28d9", text: "#6d28d9", activeText: "#fff" },
            completed:  { bg: "#e0f2fe", activeBg: "#0369a1", text: "#0369a1", activeText: "#fff" },
            correction: { bg: "#ffedd5", activeBg: "#9a3412", text: "#9a3412", activeText: "#fff" },
            revoked:    { bg: "#fee2e2", activeBg: "#991b1b", text: "#991b1b", activeText: "#fff" },
          };
          const pc = pillColors[s] || { bg: "#f3f4f6", activeBg: "#0f2a44", text: "#374151", activeText: "#fff" };
          return (
            <button key={s} onClick={() => setStatusFilter(isActive ? "all" : s)} style={{
              padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              background: isActive ? pc.activeBg : pc.bg,
              color: isActive ? pc.activeText : pc.text,
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}

        {ecosystemTypes.length > 0 && ecosystemTypes.map(t => {
          const isActive = typeFilter === t;
          if (typeFilter !== "all" && !isActive) return null;
          const tc = getTypeColor(t);
          return (
            <button key={t} onClick={() => setTypeFilter(isActive ? "all" : t)} style={{
              padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
              border: `1px solid ${isActive ? tc.text : tc.border}`, cursor: "pointer",
              background: isActive ? tc.text : "transparent",
              color: isActive ? "#fff" : tc.text,
              transition: "all 0.15s",
            }}>{t}</button>
          );
        })}

        <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "auto" }}>
          {filtered.length} of {projects.length} projects
        </span>
      </div>

      {/* Projects Table */}
      <div className="card" style={{ padding: "0", overflow: "auto", borderRadius: "12px" }}>
        <table className="table" style={{ minWidth: "900px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Project</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Type</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Area</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Field Officer</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600 }}>Validator</th>
              <th style={{ padding: "14px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", fontWeight: 600, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "13px" }}>
                  No projects match your filters
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const foUser = getUserForWallet(p.assignedFieldOfficer);
                const valUser = getUserForWallet(p.assignedValidator);
                const foShort = p.assignedFieldOfficer ? `${p.assignedFieldOfficer.slice(0, 6)}…${p.assignedFieldOfficer.slice(-4)}` : null;
                const valShort = p.assignedValidator ? `${p.assignedValidator.slice(0, 6)}…${p.assignedValidator.slice(-4)}` : null;

                return (
                  <tr key={p._id || p.projectId} style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#fafbfc"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Project Name + Location */}
                    <td style={{ padding: "14px 16px", maxWidth: "220px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.projectName}</div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.location}</div>
                    </td>
                    {/* Type pill */}
                    <td style={{ padding: "14px 16px" }}>
                      <TypePill type={p.projectType} />
                    </td>
                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={p.status?.toLowerCase()} />
                    </td>
                    {/* Area */}
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#374151", fontWeight: 500 }}>
                      {p.approximateAreaHa ? `${p.approximateAreaHa} ha` : "–"}
                    </td>
                    {/* Field Officer */}
                    <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                      {foUser ? (
                        <AvatarName name={foUser.userName} subtitle={foShort} />
                      ) : (
                        <button
                          onClick={() => { setSelectedProject(p); setActiveTab("assign-fo"); }}
                          style={{
                            background: "none", border: "1px dashed #d1d5db", borderRadius: "8px",
                            padding: "6px 12px", fontSize: "12px", color: "#6b7280", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s",
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = "#0d9488"; e.currentTarget.style.color = "#0d9488"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}
                        >
                          <span style={{ fontSize: "14px" }}>+</span> Assign FO
                        </button>
                      )}
                    </td>
                    {/* Validator */}
                    <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                      {valUser ? (
                        <AvatarName name={valUser.userName} subtitle={valShort} />
                      ) : (
                        <button
                          onClick={() => { setSelectedProject(p); setActiveTab("assign-validator"); }}
                          style={{
                            background: "none", border: "1px dashed #d1d5db", borderRadius: "8px",
                            padding: "6px 12px", fontSize: "12px", color: "#6b7280", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px", transition: "all 0.15s",
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = "#0284c7"; e.currentTarget.style.color = "#0284c7"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}
                        >
                          <span style={{ fontSize: "14px" }}>+</span> Assign Validator
                        </button>
                      )}
                    </td>
                    {/* Action */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/admin/projects/${p.projectId || p._id}`)}
                        style={{
                          background: "none", border: "none", color: "#0f766e", cursor: "pointer",
                          fontSize: "13px", fontWeight: 600, padding: "6px 10px", borderRadius: "6px",
                          transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "4px",
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "#f0fdfa"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}
                      >
                        Details <span style={{ fontSize: "14px" }}>→</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px", width: "95%", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", margin: 0, color: "#0f2a44" }}>{selectedProject.projectName}</h2>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "4px 0 0" }}>Assign team members to this project</p>
              </div>
              <button onClick={() => setSelectedProject(null)} style={{ background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", fontSize: "18px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>

            <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #e5e7eb", marginBottom: "20px" }}>
              {[
                { id: "assign-fo", label: "Field Officer" },
                { id: "assign-validator", label: "Validator" }
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: "12px 0", background: "none", border: "none",
                    borderBottom: activeTab === tab.id ? "2px solid #0f766e" : "2px solid transparent",
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? "#0f766e" : "#6b7280",
                    cursor: "pointer", fontSize: "14px", marginBottom: "-2px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >{tab.label}</button>
              ))}
            </div>

            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
              {activeTab === "assign-fo" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {officers.length === 0 && <span style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>No field officers registered</span>}
                  {officers.map((o) => {
                    const isSelected = selectedProject.assignedFieldOfficer === o.walletAddress;
                    return (
                      <button key={o._id}
                        onClick={() => handleAssignOfficer(selectedProject.projectId, o.walletAddress)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "12px 16px", borderRadius: "10px", cursor: "pointer",
                          border: isSelected ? "2px solid #0f766e" : "1px solid #e5e7eb",
                          background: isSelected ? "#f0fdfa" : "#fff",
                          transition: "all 0.15s", textAlign: "left", width: "100%",
                        }}
                        onMouseOver={e => { if (!isSelected) e.currentTarget.style.borderColor = "#a7f3d0"; }}
                        onMouseOut={e => { if (!isSelected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                      >
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: isSelected ? "linear-gradient(135deg, #0f766e, #0d9488)" : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                          color: isSelected ? "#fff" : "#6b7280",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", fontWeight: 700, flexShrink: 0,
                        }}>
                          {o.userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#1f2937" }}>{o.userName}</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{o.walletAddress?.slice(0,8)}…{o.walletAddress?.slice(-6)}</div>
                        </div>
                        {isSelected && <span style={{ color: "#0f766e", fontSize: "16px", fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "assign-validator" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {validators.length === 0 && <span style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "20px" }}>No validators registered</span>}
                  {validators.map((v) => {
                    const isSelected = selectedProject.assignedValidator === v.walletAddress;
                    return (
                      <button key={v._id}
                        onClick={() => handleAssignValidator(selectedProject.projectId, v.walletAddress)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          padding: "12px 16px", borderRadius: "10px", cursor: "pointer",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb",
                          background: isSelected ? "#eff6ff" : "#fff",
                          transition: "all 0.15s", textAlign: "left", width: "100%",
                        }}
                        onMouseOver={e => { if (!isSelected) e.currentTarget.style.borderColor = "#bfdbfe"; }}
                        onMouseOut={e => { if (!isSelected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                      >
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: isSelected ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                          color: isSelected ? "#fff" : "#6b7280",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", fontWeight: 700, flexShrink: 0,
                        }}>
                          {v.userName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#1f2937" }}>{v.userName}</div>
                          <div style={{ fontSize: "11px", color: "#9ca3af", fontFamily: "monospace" }}>{v.walletAddress?.slice(0,8)}…{v.walletAddress?.slice(-6)}</div>
                        </div>
                        {isSelected && <span style={{ color: "#2563eb", fontSize: "16px", fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "white", padding: "12px 24px", borderRadius: "10px",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, fontSize: "13px",
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default ProjectManagement;
