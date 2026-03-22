import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";
import { projectsAPI, adminAPI, submissionsAPI } from "../../services/api";

const formatDate = (d) => {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatDateTime = (d) => {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const Section = ({ title, icon, children }) => (
  <div className="card" style={{ marginBottom: "20px" }}>
    <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#0f2a44" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const InfoItem = ({ label, value, mono, full }) => (
  <div style={{ gridColumn: full ? "span 2" : undefined }}>
    <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</div>
    <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937", fontFamily: mono ? "monospace" : "inherit", wordBreak: mono ? "break-all" : "normal" }}>
      {value || "–"}
    </div>
  </div>
);

const WalletWithName = ({ address, usersMap, color = "#374151" }) => {
  if (!address) return <span style={{ color: "#9ca3af" }}>Not Assigned</span>;
  const name = usersMap[address] || usersMap[address.toLowerCase()];
  return (
    <div>
      {name && <div style={{ fontWeight: 600, color, fontSize: "14px" }}>{name}</div>}
      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#6b7280", wordBreak: "break-all" }}>{address}</div>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [usersMap, setUsersMap] = useState({});
  const [mapPins, setMapPins] = useState([]);
  const [fetchedPhotos, setFetchedPhotos] = useState([]);

  useEffect(() => {
    // Normalize baseline photo URLs: Rewrite gateway.pinata.cloud → ipfs.io and strip subfolders
    const bp = project?.baselinePhotos || [];
    const normalized = bp
      .filter(url => url && typeof url === 'string')
      .map(url => url.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/').replace(/\/project-\d+\//, '/'));
    setFetchedPhotos(normalized);
  }, [project]);

  useEffect(() => {
    // Fetch users for name resolution
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

    // Fetch project
    projectsAPI.getById(id)
      .then((res) => {
        const proj = res.data.data.project;
        setProject(proj);
        // Fetch submissions for this project to get GPS pins
        fetchMapPins(proj.projectId);
      })
      .catch(() => {
        projectsAPI.getAll()
          .then((res) => {
            const projs = res.data.data.projects || [];
            const found = projs.find(p => p.projectId === id || p._id === id);
            setProject(found || null);
            if (found) fetchMapPins(found.projectId);
          })
          .catch(() => setProject(null));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fetchMapPins = (projectId) => {
    // Try to get pins from the public pins endpoint, then filter for this project
    projectsAPI.getMapPins()
      .then(res => {
        const allPins = res.data.data.pins || [];
        // Filter pins that match this project name
        const projectPins = allPins.filter(p => p.label && p.label.includes(projectId));
        if (projectPins.length > 0) {
          setMapPins(projectPins);
        } else if (allPins.length > 0) {
          // Fallback: use all pins that mention this project's name
          setMapPins(allPins.filter(p => p.label));
        }
      })
      .catch(() => {});

    // Also try submissions API for GPS data and field photos
    submissionsAPI.getMy()
      .then(res => {
        const subs = res.data.data.submissions || res.data.data || [];
        const projectSubs = subs.filter(s => s.projectId === projectId);
        
        // Extract GPS pins
        const pins = projectSubs
          .filter(s => s.gps?.lat && s.gps?.lng)
          .map(s => ({
            lat: s.gps.lat,
            lng: s.gps.lng,
            label: `Submission ${s.submissionId || ''} - ${new Date(s.visitDate || s.createdAt).toLocaleDateString()}`
          }));
        if (pins.length > 0) setMapPins(prev => prev.length > 0 ? prev : pins);

        // Extract and append submission photos to the main gallery
        const subPhotos = projectSubs.flatMap(s => s.currentPhotos || [])
                                     .filter(url => url && typeof url === 'string')
                                     .map(url => url.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/').replace(/\/project-\d+\//, '/'));
        
        if (subPhotos.length > 0) {
          setFetchedPhotos(prev => [...new Set([...prev, ...subPhotos])]);
        }
      })
      .catch(() => {});
  };

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
      Loading project details…
    </div>
  );

  if (!project) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
      <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Project Not Found</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>The project you're looking for doesn't exist or has been removed.</p>
      <button className="primary-btn" onClick={() => navigate("/admin/projects")}>Back to Projects</button>
    </div>
  );

  const photos = fetchedPhotos;
  const videos = project.baselineVideos || [];
  const ecosystems = project.ecosystemTypes || [];
  const activities = project.plannedActivities || [];

  const isBase64Image = (str) => str && (str.startsWith("data:image") || str.startsWith("data:video"));
  const isUrl = (str) => str && (str.startsWith("http://") || str.startsWith("https://"));

  return (
    <>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "24px", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/admin/projects")}
            style={{
              background: "#e5e7eb", border: "none", width: "40px", height: "40px",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: "20px", color: "#4b5563", transition: "all 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "#d1d5db"}
            onMouseOut={e => e.currentTarget.style.background = "#e5e7eb"}
            title="Back to Projects"
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", color: "#0f2a44" }}>{project.projectName}</h1>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              ID: <span style={{ fontFamily: "monospace" }}>{project.projectId}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={project.status?.toLowerCase()} />
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px", marginBottom: "24px",
      }}>
        {[
          { label: "Ecosystem", value: project.projectType, icon: "🌿" },
          { label: "Area", value: `${project.approximateAreaHa || 0} ha`, icon: "📐" },
          { label: "Carbon Credits", value: `${project.totalCarbonCredits || 0} tCO₂e`, icon: "💎" },
          { label: "Status", value: project.status, icon: "📊" },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: "16px 12px" }}>
            <div style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f2a44" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left Column */}
        <div>
          <Section title="Project Information" icon="📋">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <InfoItem label="Project Name" value={project.projectName} />
              <InfoItem label="Ecosystem Type" value={project.projectType} />
              <InfoItem label="Location" value={project.location} />
              <InfoItem label="Area" value={`${project.approximateAreaHa || 0} ha`} />
              <InfoItem label="Start Date" value={formatDate(project.startDate)} />
              <InfoItem label="End Date" value={formatDate(project.endDate)} />
              <InfoItem label="Owner Wallet" value={project.ownerWallet} mono />
              <InfoItem label="Carbon Credits" value={`${project.totalCarbonCredits || 0} tCO₂e`} />
              {project.blockchainProjectHash && (
                <InfoItem label="Blockchain Hash" value={project.blockchainProjectHash} mono full />
              )}
            </div>
            {project.description && (
              <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Description</div>
                <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.7", margin: 0 }}>{project.description}</p>
              </div>
            )}
          </Section>

          {/* Assignments with names */}
          <Section title="Assignments" icon="👥">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Field Officer</div>
                <WalletWithName address={project.assignedFieldOfficer} usersMap={usersMap} color="#166534" />
              </div>
              <div style={{ padding: "14px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <div style={{ fontSize: "11px", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Validator</div>
                <WalletWithName address={project.assignedValidator} usersMap={usersMap} color="#1e40af" />
              </div>
            </div>
          </Section>

          <Section title="Timeline" icon="🕐">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <InfoItem label="Created At" value={formatDateTime(project.createdAt)} />
              <InfoItem label="Last Updated" value={formatDateTime(project.updatedAt)} />
              <InfoItem label="Project Start" value={formatDate(project.startDate)} />
              <InfoItem label="Project End" value={formatDate(project.endDate)} />
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div>
          {ecosystems.length > 0 && (
            <Section title="Ecosystem Types" icon="🌊">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {ecosystems.map(t => (
                  <span key={t} style={{
                    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca",
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 500,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {activities.length > 0 && (
            <Section title="Planned Activities" icon="🛠️">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {activities.map(a => (
                  <span key={a} style={{
                    background: "linear-gradient(135deg, #dcfce7, #bbf7d0)", color: "#166534",
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 500,
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          <Section title="Location & Geofence" icon="📍">
            {mapPins.length > 0 ? (
              <MapComponent pins={mapPins} height="220px" />
            ) : (
              <div style={{
                height: "180px", background: "#f3f4f6", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#9ca3af", fontSize: "14px", border: "1px dashed #d1d5db",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🗺️</div>
                  No geofence data available
                </div>
              </div>
            )}
            {project.location && (
              <div style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
                📌 {project.location}
              </div>
            )}
          </Section>

          {/* Baseline Photos - properly renders base64 images */}
          <Section title={`Baseline Photos (${photos.length})`} icon="📷">
            {photos.length > 0 ? (
              <>
                <div style={{
                  height: "280px", background: "#f3f4f6", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", marginBottom: "10px",
                  border: "1px solid #e5e7eb",
                }}>
                  {isBase64Image(photos[activePhoto]) || isUrl(photos[activePhoto]) ? (
                    <img
                      src={photos[activePhoto]}
                      alt={`Baseline ${activePhoto + 1}`}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: "#6b7280" }}>
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                      <div style={{ fontSize: "13px", fontFamily: "monospace", wordBreak: "break-all", padding: "12px" }}>
                        {photos[activePhoto]}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>IPFS Hash</div>
                    </div>
                  )}
                </div>
                {/* Thumbnail strip */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      style={{
                        width: "60px", height: "60px", borderRadius: "6px",
                        border: activePhoto === i ? "2px solid #0f766e" : "2px solid #e5e7eb",
                        cursor: "pointer", overflow: "hidden", transition: "all 0.15s",
                        background: "#f3f4f6",
                      }}
                    >
                      {isBase64Image(photo) || isUrl(photo) ? (
                        <img src={photo} alt={`Thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "11px", color: "#9ca3af" }}>
                          {i + 1}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                height: "120px", background: "#f9fafb", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#9ca3af", fontSize: "14px", border: "1px dashed #d1d5db",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>📷</div>
                  No baseline photos uploaded
                </div>
              </div>
            )}
          </Section>

          {/* Baseline Videos */}
          {videos.length > 0 && (
            <Section title={`Baseline Videos (${videos.length})`} icon="🎥">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {videos.map((v, i) => (
                  <div key={i}>
                    {isBase64Image(v) || isUrl(v) ? (
                      <video
                        src={v}
                        controls
                        style={{ width: "100%", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                    ) : (
                      <div style={{
                        padding: "10px 14px", background: "#f8fafc", borderRadius: "8px",
                        border: "1px solid #e2e8f0", fontSize: "13px", fontFamily: "monospace",
                        color: "#374151", wordBreak: "break-all",
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                        <span>🎬</span> {v}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectDetails;
