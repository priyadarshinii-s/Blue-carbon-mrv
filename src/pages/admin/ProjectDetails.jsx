import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import StatCard from "../../components/shared/StatCard";
import MapComponent from "../../components/shared/MapComponent";
import { projectsAPI, adminAPI, submissionsAPI, verificationsAPI } from "../../services/api";

/* ── helpers ─────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateTime = (d) => {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};
const shortAddr = (a) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "–";

// removed stages

/* ── sub-components ──────────────────────────────────── */
const Section = ({ title, extra, children }) => (
  <div className="card" style={{ marginBottom: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#0f2a44", margin: 0 }}>{title}</h3>
      {extra}
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
    <span style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    <span style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937", fontFamily: mono ? "monospace" : "inherit", textAlign: "right", maxWidth: "60%", wordBreak: mono ? "break-all" : "normal" }}>{value || "–"}</span>
  </div>
);

/* ── pulsing dot ─────────────────────────────────────── */
const LiveDot = ({ color = "#10b981", size = 8 }) => (
  <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
    <span style={{
      position: "absolute", inset: 0, borderRadius: "50%", background: color,
      animation: "livePulse 2s ease-in-out infinite",
    }} />
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    <style>{`@keyframes livePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(2.2);opacity:0} }`}</style>
  </span>
);

/* ── timeline step ───────────────────────────────────── */
const TimelineStep = ({ title, description, date, status, isLast }) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isPending = status === "pending";

  const pillBg = isCompleted ? "#dcfce7" : isActive ? "#dbeafe" : "#f3f4f6";
  const pillText = isCompleted ? "#166534" : isActive ? "#1e40af" : "#6b7280";
  const pillLabel = isCompleted ? "Completed" : isActive ? "Active" : "Pending";

  return (
    <div style={{ display: "flex", gap: "16px", paddingBottom: isLast ? "0" : "28px", position: "relative" }}>
      {!isLast && (
        <div style={{
          position: "absolute", left: "7.5px", top: "24px", width: "1px", 
          height: "calc(100% - 16px)", background: "#d1d5db", zIndex: 0
        }} />
      )}
      
      <div style={{
        position: "relative", zIndex: 1, marginTop: "4px",
        width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
        background: isCompleted ? "#10b981" : isActive ? "#3b82f6" : "#fff",
        border: isActive ? "3px solid #bfdbfe" : isPending ? "2px solid #d1d5db" : "none",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {isActive && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#fff" }} />}
      </div>

      <div style={{ marginTop: "-2px" }}>
        {date && <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>{date}</div>}
        <div style={{ fontSize: "14px", fontWeight: 600, color: isPending ? "#6b7280" : "#111827", marginBottom: "2px" }}>{title}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>{description}</div>
        
        <div style={{
          display: "inline-block", padding: "3px 10px", borderRadius: "12px",
          fontSize: "10px", fontWeight: 600, textTransform: "capitalize",
          background: pillBg, color: pillText, border: isPending ? "1px solid #e5e7eb" : "none"
        }}>
          {pillLabel}
        </div>
      </div>
    </div>
  );
};

/* ── progress bar ────────────────────────────────────── */
const ProgressBar = ({ start, end }) => {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const pct = !start || !end || e <= s ? 0 : Math.min(100, Math.max(0, Math.round(((now - s) / (e - s)) * 100)));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginBottom: "6px" }}>
        <span>{fmtDate(start)}</span>
        <span>{pct}% elapsed</span>
        <span>{fmtDate(end)}</span>
      </div>
      <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #0f766e, #0d9488)", borderRadius: "3px", transition: "width 0.5s" }} />
      </div>
    </div>
  );
};

/* ── transaction row ─────────────────────────────────── */
const TxRow = ({ tx }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #f3f4f6", fontSize: "12px",
  }}>
    <div>
      <div style={{ fontWeight: 600, color: "#1f2937" }}>{tx.type}</div>
      <div style={{ fontFamily: "monospace", color: "#9ca3af", fontSize: "11px", marginTop: "2px" }}>{shortAddr(tx.hash)}</div>
    </div>
    <div style={{ textAlign: "right" }}>
      <StatusBadge status={tx.status} />
      {tx.block && <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>Block #{tx.block}</div>}
    </div>
  </div>
);

/* ── remark row ──────────────────────────────────────── */
const RemarkRow = ({ remark, usersMap }) => {
  const isFO = remark.role === "field_officer";
  const tagColor = isFO ? { bg: "#ede9fe", text: "#6d28d9" } : { bg: "#f0fdfa", text: "#0f766e" };
  const authorName = usersMap[remark.author] || usersMap[remark.author?.toLowerCase()] || shortAddr(remark.author);
  return (
    <div style={{ padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #f3f4f6", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{
          padding: "2px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: 600,
          background: tagColor.bg, color: tagColor.text,
        }}>{isFO ? "Field Officer" : "Validator"}</span>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{fmtDateTime(remark.date)}</span>
      </div>
      <p style={{ fontSize: "13px", color: "#374151", margin: "0 0 4px", lineHeight: 1.5 }}>{remark.text}</p>
      <span style={{ fontSize: "11px", color: "#6b7280" }}>{authorName}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════ */
const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState({});
  const [mapPins, setMapPins] = useState([]);
  const [fetchedPhotos, setFetchedPhotos] = useState([]);
  const [activePhoto, setActivePhoto] = useState(0);
  
  // Image modal states
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState({ x: 0, y: 0 });

  const [submissions, setSubmissions] = useState([]);
  const [verifications, setVerifications] = useState([]);

  /* ── normalize photos when project changes ── */
  useEffect(() => {
    const bp = project?.baselinePhotos || [];
    const normalized = bp
      .filter(url => url && typeof url === "string")
      .map(url => url.replace("https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/").replace(/\/project-\d+\//, "/"));
    setFetchedPhotos(normalized);
  }, [project]);

  /* ── initial data fetch ── */
  useEffect(() => {
    adminAPI.getUsers()
      .then(res => {
        const users = res.data.data.users || [];
        const map = {};
        users.forEach(u => {
          map[u.walletAddress] = u.userName;
          if (u.walletAddress) map[u.walletAddress.toLowerCase()] = u.userName;
        });
        setUsersMap(map);
      })
      .catch(() => {});

    projectsAPI.getById(id)
      .then(res => {
        const proj = res.data.data.project;
        setProject(proj);
        fetchMapPins(proj);
        fetchSubmissions(proj.projectId);
      })
      .catch(() => {
        projectsAPI.getAll()
          .then(res => {
            const projs = res.data.data.projects || [];
            const found = projs.find(p => p.projectId === id || p._id === id);
            setProject(found || null);
            if (found) {
              fetchMapPins(found);
              fetchSubmissions(found.projectId);
            }
          })
          .catch(() => setProject(null));
      })
      .finally(() => setLoading(false));

    verificationsAPI.getHistory()
      .then(res => setVerifications(res.data.data?.verifications || res.data.data || []))
      .catch(() => {});
  }, [id]);

  const fetchSubmissions = (projectId) => {
    submissionsAPI.getMy()
      .then(res => {
        const subs = res.data.data.submissions || res.data.data || [];
        setSubmissions(subs.filter(s => s.projectId === projectId));
      })
      .catch(() => {});
  };

  const fetchMapPins = (proj) => {
    const projectId = proj.projectId;
    const projectName = proj.projectName;

    const fallbackPin = proj.geofence?.coordinates?.[0]?.[0]
      ? [{ lat: proj.geofence.coordinates[0][0][1], lng: proj.geofence.coordinates[0][0][0], label: `${projectName} (Project Boundary)` }]
      : [];

    projectsAPI.getMapPins()
      .then(res => {
        const allPins = res.data.data.pins || [];
        const projectPins = allPins.filter(p => p.label && (p.label.includes(projectId) || (projectName && p.label.includes(projectName))));
        if (projectPins.length > 0) {
          setMapPins(projectPins);
        } else {
          setMapPins(prev => prev.length > 0 ? prev : fallbackPin);
        }
      })
      .catch(() => setMapPins(prev => prev.length > 0 ? prev : fallbackPin));

    submissionsAPI.getMy()
      .then(res => {
        const subs = res.data.data.submissions || res.data.data || [];
        const projectSubs = subs.filter(s => s.projectId === projectId);
        const pins = projectSubs
          .filter(s => s.gps?.lat && s.gps?.lng)
          .map(s => ({ lat: s.gps.lat, lng: s.gps.lng, label: `Submission ${s.submissionId || ""} - ${new Date(s.visitDate || s.createdAt).toLocaleDateString()}` }));
        
        setMapPins(prev => {
          if (pins.length > 0) return pins;
          return prev.length > 0 ? prev : fallbackPin;
        });

        const subPhotos = projectSubs.flatMap(s => s.currentPhotos || [])
          .filter(url => url && typeof url === "string")
          .map(url => url.replace("https://gateway.pinata.cloud/ipfs/", "https://ipfs.io/ipfs/").replace(/\/project-\d+\//, "/"));
        if (subPhotos.length > 0) setFetchedPhotos(prev => [...new Set([...prev, ...subPhotos])]);
      })
      .catch(() => {
        setMapPins(prev => prev.length > 0 ? prev : fallbackPin);
      });
  };

  /* ── derived data ── */
  const timelineSteps = useMemo(() => {
    if (!project) return [];

    const isFieldOfficerAssigned = !!project.assignedFieldOfficer;
    const isValidatorAssigned = !!project.assignedValidator;
    const hasSubmissions = submissions.length > 0;
    const hasVerifications = verifications.length > 0;
    
    const pStatus = (project.status || "").toLowerCase();
    const foNameData = usersMap[project.assignedFieldOfficer] || usersMap[project.assignedFieldOfficer?.toLowerCase()];
    const valNameData = usersMap[project.assignedValidator] || usersMap[project.assignedValidator?.toLowerCase()];
    
    // 1. Project Created
    const step1 = {
      title: "Project created",
      description: "Owner submitted project for review",
      date: fmtDateTime(project.createdAt),
      status: "completed"
    };

    // 2. Field officer assigned
    const step2 = {
      title: "Field officer assigned",
      description: isFieldOfficerAssigned ? `${foNameData || shortAddr(project.assignedFieldOfficer)} assigned by admin` : "Awaiting admin assignment",
      date: project.fieldOfficerAssignedAt ? fmtDateTime(project.fieldOfficerAssignedAt) : undefined,
      status: isFieldOfficerAssigned ? "completed" : "active"
    };

    // 3. Validator assigned
    const step3 = {
      title: "Validator assigned",
      description: isValidatorAssigned ? `${valNameData || shortAddr(project.assignedValidator)} assigned by admin` : "Awaiting admin assignment",
      date: project.validatorAssignedAt ? fmtDateTime(project.validatorAssignedAt) : undefined,
      status: isValidatorAssigned ? "completed" : (isFieldOfficerAssigned ? "active" : "pending")
    };

    // 4. Field verification
    let s4Status = "pending";
    if (hasSubmissions) s4Status = "completed";
    else if (isFieldOfficerAssigned) s4Status = "active";
    
    const step4 = {
      title: "Field verification",
      description: "Awaiting officer site visit and data submission",
      date: hasSubmissions ? fmtDateTime(submissions[submissions.length - 1].createdAt) : undefined,
      status: s4Status
    };

    // 5. Validator review
    let s5Status = "pending";
    if (['approved', 'validated', 'minted', 'active'].includes(pStatus)) s5Status = "completed";
    else if (pStatus === 'submitted') s5Status = "active";
    
    const step5 = {
      title: "Validator review",
      description: "Independent carbon measurement validation",
      date: hasVerifications && s5Status === "completed" ? fmtDateTime(verifications[0].createdAt) : undefined,
      status: s5Status
    };

    // 6. Credit minting
    let s6Status = "pending";
    if (['minted', 'active'].includes(pStatus)) s6Status = "completed";
    else if (['approved', 'validated'].includes(pStatus)) s6Status = "active";
    
    const step6 = {
      title: "Credit minting",
      description: "tCO₂e tokens minted on-chain",
      date: project.mintTxHash ? fmtDateTime(project.updatedAt) : undefined,
      status: s6Status
    };

    return [step1, step2, step3, step4, step5, step6];
  }, [project, submissions, verifications, usersMap]);

  const transactions = useMemo(() => {
    if (!project) return [];
    const txs = [];
    if (project.blockchainProjectHash) {
      txs.push({ type: "Project Registration", hash: project.blockchainProjectHash, status: "completed", block: "confirmed" });
    }
    submissions.forEach(s => {
      if (s.ipfsHash) txs.push({ type: "Submission Upload", hash: s.ipfsHash, status: "completed", block: "confirmed" });
    });
    if (project.mintTxHash) {
      txs.push({ type: "Credit Minting", hash: project.mintTxHash, status: project.status?.toLowerCase() === "minted" ? "completed" : "pending", block: project.status?.toLowerCase() === "minted" ? "confirmed" : null });
    }
    return txs;
  }, [project, submissions]);

  const remarks = useMemo(() => {
    if (!project) return [];
    const r = [];
    // Field officer remarks from submissions
    submissions.forEach(s => {
      if (s.remarks || s.notes) {
        r.push({ text: s.remarks || s.notes, role: "field_officer", author: s.fieldOfficer || project.assignedFieldOfficer, date: s.visitDate || s.createdAt });
      }
    });
    // Validator remarks from verifications
    const projectVers = verifications.filter(v => v.projectId === project.projectId || submissions.some(s => s._id === v.submissionId || s.submissionId === v.submissionId));
    projectVers.forEach(v => {
      if (v.remarks || v.notes || v.comment) {
        r.push({ text: v.remarks || v.notes || v.comment, role: "validator", author: v.validator || project.assignedValidator, date: v.reviewedAt || v.createdAt });
      }
    });
    return r.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [project, submissions, verifications]);

  /* ── render ── */
  if (loading) return <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>Loading project details...</div>;

  if (!project) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Project Not Found</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>The project you are looking for doesn't exist or has been removed.</p>
      <button className="primary-btn" onClick={() => navigate("/admin/projects")}>Back to Projects</button>
    </div>
  );

  const photos = fetchedPhotos;
  const isBase64Image = (str) => str && (str.startsWith("data:image") || str.startsWith("data:video"));
  const isUrl = (str) => str && (str.startsWith("http://") || str.startsWith("https://"));

  const foName = usersMap[project.assignedFieldOfficer] || usersMap[project.assignedFieldOfficer?.toLowerCase()];
  const valName = usersMap[project.assignedValidator] || usersMap[project.assignedValidator?.toLowerCase()];

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate("/admin/projects")}
            className="secondary-btn"
            style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
          >←</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ margin: 0, fontSize: "20px", color: "#0f2a44" }}>{project.projectName}</h1>
              <LiveDot />
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              ID: <span style={{ fontFamily: "monospace" }}>{project.projectId}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={project.status?.toLowerCase()} />
      </div>

      {/* ── Stats Bar ── */}
      <div className="card-grid" style={{ marginBottom: "20px" }}>
        <StatCard title="Ecosystem" value={project.projectType || "–"} color="#0f766e" />
        <StatCard title="Area" value={`${project.approximateAreaHa || 0} ha`} color="#1d4ed8" />
        <StatCard title="Carbon Credits" value={`${project.totalCarbonCredits || 0} tCO₂e`} color="#7c3aed" />
        <StatCard title="Submissions" value={String(submissions.length)} color="#b45309" />
      </div>

      {/* ── Progress Bar ── */}
      {project.startDate && project.endDate && (
        <div className="card" style={{ marginBottom: "16px", padding: "14px 16px" }}>
          <ProgressBar start={project.startDate} end={project.endDate} />
        </div>
      )}

      {/* ── Two Column Layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* ════ LEFT COLUMN ════ */}
        <div>
          {/* Timeline Tracker */}
          <Section title="Project progress">
            <div style={{ margin: "4px 0 16px", color: "#6b7280", fontSize: "12px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
              Started {fmtDate(project.startDate)} · ends {fmtDate(project.endDate)}
            </div>
            <div style={{ padding: "8px 0" }}>
              {timelineSteps.map((step, i) => (
                <TimelineStep 
                  key={i} 
                  title={step.title}
                  description={step.description}
                  date={step.date}
                  status={step.status}
                  isLast={i === timelineSteps.length - 1} 
                />
              ))}
            </div>
          </Section>

          {/* Project Information */}
          <Section title="Project Information">
            <InfoRow label="Project Name" value={project.projectName} />
            <InfoRow label="Ecosystem" value={project.projectType} />
            <InfoRow label="Location" value={project.location} />
            <InfoRow label="Area" value={`${project.approximateAreaHa || 0} ha`} />
            <InfoRow label="Start Date" value={fmtDate(project.startDate)} />
            <InfoRow label="End Date" value={fmtDate(project.endDate)} />
            <InfoRow label="Created" value={fmtDateTime(project.createdAt)} />
            <InfoRow label="Last Updated" value={fmtDateTime(project.updatedAt)} />
            <InfoRow label="Owner Wallet" value={shortAddr(project.ownerWallet)} mono />
            <InfoRow label="Carbon Credits" value={`${project.totalCarbonCredits || 0} tCO₂e`} />
            {project.blockchainProjectHash && (
              <InfoRow label="Blockchain Hash" value={shortAddr(project.blockchainProjectHash)} mono />
            )}
            {project.description && (
              <div style={{ marginTop: "12px", padding: "10px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #f3f4f6" }}>
                <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Description</div>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0 }}>{project.description}</p>
              </div>
            )}
          </Section>

          {/* Remarks */}
          <Section title="Remarks">
            {remarks.length > 0 ? (
              remarks.map((r, i) => <RemarkRow key={i} remark={r} usersMap={usersMap} />)
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "13px" }}>
                No remarks yet
              </div>
            )}
          </Section>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div>
          {/* Location & Map */}
          <Section title="Location">
            {mapPins.length > 0 ? (
              <MapComponent pins={mapPins} height="200px" />
            ) : (
              <div style={{
                height: "160px", background: "#f9fafb", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#9ca3af", fontSize: "13px", border: "1px dashed #d1d5db",
              }}>
                No geofence data available
              </div>
            )}
            {project.location && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>{project.location}</div>
            )}
          </Section>

          {/* Assignments */}
          <Section title="Assignments">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "10px", color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", fontWeight: 600 }}>Field Officer</div>
                {foName ? (
                  <>
                    <div style={{ fontWeight: 600, color: "#166534", fontSize: "13px" }}>{foName}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{shortAddr(project.assignedFieldOfficer)}</div>
                  </>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not Assigned</span>
                )}
              </div>
              <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: "10px", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", fontWeight: 600 }}>Validator</div>
                {valName ? (
                  <>
                    <div style={{ fontWeight: 600, color: "#1e40af", fontSize: "13px" }}>{valName}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{shortAddr(project.assignedValidator)}</div>
                  </>
                ) : (
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>Not Assigned</span>
                )}
              </div>
            </div>
          </Section>

          {/* Photos */}
          <Section title={`Photos (${photos.length})`}>
            {photos.length > 0 ? (
              <>
                <div 
                  onClick={() => {
                    setIsPhotoExpanded(true);
                    setZoomLevel(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  style={{
                    height: "220px", background: "#f3f4f6", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", marginBottom: "8px", border: "1px solid #e5e7eb",
                    cursor: "zoom-in",
                  }}
                >
                  {isBase64Image(photos[activePhoto]) || isUrl(photos[activePhoto]) ? (
                    <img src={photos[activePhoto]} alt={`Photo ${activePhoto + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: "12px", fontFamily: "monospace", padding: "12px", wordBreak: "break-all" }}>
                      {photos[activePhoto]}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {photos.map((photo, i) => (
                    <div key={i} onClick={() => setActivePhoto(i)} style={{
                      width: "48px", height: "48px", borderRadius: "6px",
                      border: activePhoto === i ? "2px solid #0f766e" : "2px solid #e5e7eb",
                      cursor: "pointer", overflow: "hidden", background: "#f3f4f6",
                    }}>
                      {isBase64Image(photo) || isUrl(photo) ? (
                        <img src={photo} alt={`Thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "10px", color: "#9ca3af" }}>{i + 1}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "13px", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
                No photos uploaded
              </div>
            )}
          </Section>

          {/* On-chain Transactions */}
          <Section
            title="On-chain Transactions"
            extra={<LiveDot color="#0f766e" size={6} />}
          >
            {transactions.length > 0 ? (
              transactions.map((tx, i) => <TxRow key={i} tx={tx} />)
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "13px" }}>
                No on-chain transactions recorded
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Full-screen Photo Modal */}
      {isPhotoExpanded && photos.length > 0 && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.95)", zIndex: 9999, overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            userSelect: "none"
          }}
          onMouseMove={(e) => {
            if (isDragging && zoomLevel > 1) {
              setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Top Bar Controls */}
          <div style={{ position: "fixed", top: "20px", right: "30px", zIndex: 10000, display: "flex", gap: "16px", alignItems: "center" }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(prev - 0.5, 1)); }}
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "16px", cursor: zoomLevel <= 1 ? "not-allowed" : "pointer", opacity: zoomLevel <= 1 ? 0.5 : 1 }}
            >
              −
            </button>
            <span style={{ color: "white", fontSize: "14px", minWidth: "40px", textAlign: "center" }}>{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.5, 4)); }}
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "16px", cursor: zoomLevel >= 4 ? "not-allowed" : "pointer", opacity: zoomLevel >= 4 ? 0.5 : 1 }}
            >
              +
            </button>
            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.3)" }}></div>
            <button 
              style={{
                background: "rgba(255,255,255,0.2)", color: "white", border: "none",
                borderRadius: "50%", width: "40px", height: "40px",
                fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
              onClick={(e) => { e.stopPropagation(); setIsPhotoExpanded(false); setZoomLevel(1); setPan({x:0, y:0}); }}
            >
              ✕
            </button>
          </div>
          
          {/* Main Image Container */}
          <div 
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
            onMouseDown={(e) => setClickStart({ x: e.clientX, y: e.clientY })}
            onClick={(e) => {
              const dx = Math.abs(e.clientX - clickStart.x);
              const dy = Math.abs(e.clientY - clickStart.y);
              if (dx > 5 || dy > 5) return; // Ignore drag events
              
              e.stopPropagation();
              setZoomLevel(prev => prev > 1 ? 1 : 2);
              setPan({ x: 0, y: 0 });
            }}
          >
            {(() => {
              const photoSrc = photos[activePhoto] || "";
              const isVideo = typeof photoSrc === 'string' && photoSrc.match(/\.(mp4|webm|mov)$/i);
              
              if (isVideo) {
                return <video src={photoSrc} controls style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }} />;
              }
              
              return (
                <img 
                  src={photoSrc} 
                  alt={`Photo Full ${activePhoto + 1}`} 
                  draggable="false"
                  onMouseDown={(e) => {
                    if (zoomLevel > 1) {
                      e.preventDefault();
                      setIsDragging(true);
                      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                    }
                  }}
                  style={{ 
                    maxWidth: "100vw", maxHeight: "80vh", objectFit: "contain",
                    cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`, 
                    transition: isDragging ? "none" : "transform 0.2s ease-out",
                    willChange: "transform"
                  }}
                />
              );
            })()}
          </div>
          
          {/* Gallery Controls in Modal */}
          <div style={{ position: "absolute", bottom: "20px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: "12px", background: "rgba(0,0,0,0.6)", padding: "6px 16px", borderRadius: "20px", color: "white", fontSize: "14px", letterSpacing: "0.5px" }}>
              Photo {activePhoto + 1} of {photos.length}
            </div>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", maxWidth: "90vw", paddingBottom: "10px" }}>
              {photos.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => { setActivePhoto(i); setZoomLevel(1); setPan({x:0, y:0}); }}
                  style={{
                    width: "56px", height: "56px", borderRadius: "8px", cursor: "pointer", flexShrink: 0,
                    border: activePhoto === i ? "3px solid #34d399" : "3px solid transparent",
                    background: typeof photo === 'string' && photo && !photo.match(/\.(mp4|webm|mov)$/i) ? `url(${photo}) center/cover no-repeat` : "#1f2937", 
                    backgroundColor: "#1f2937", opacity: activePhoto === i ? 1 : 0.5,
                    transition: "all 0.2s", transform: activePhoto === i ? "scale(1.1)" : "scale(1)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {typeof photo === 'string' && photo.match(/\.(mp4|webm|mov)$/i) && <span style={{fontSize: "20px", color: "white"}}>🎥</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetails;
