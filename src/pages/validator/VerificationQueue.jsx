import React, { useState, useEffect } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";
import CarbonCalculationForm from "../../components/shared/CarbonCalculationForm";
import Timeline from "../../components/shared/Timeline";
import ReviewWizard from "../../components/shared/ReviewWizard";
import TxSuccessScreen from "../../components/shared/TxSuccessScreen";
import ConfirmRejectModal from "../../components/common/ConfirmRejectModal";
import ArrowLeftIcon from "../../components/common/ArrowLeftIcon";
import { verificationsAPI, projectsAPI, adminAPI } from "../../services/api";
import { useAccount } from "wagmi";
import { useApproveProject } from "../../hooks/useContractActions";




const wizardSteps = [
  { label: "Review Data" },
  { label: "Carbon Calculation" },
  { label: "Decision" },
];

const VerificationQueue = () => {
  const { address } = useAccount();
  const { writeAsync } = useApproveProject();
  
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [expandedPhotoIndex, setExpandedPhotoIndex] = useState(0);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clickStart, setClickStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [commentError, setCommentError] = useState("");
  const [calculationDone, setCalculationDone] = useState(false);
  const [calculatedCredits, setCalculatedCredits] = useState(0);
  const [rejectModal, setRejectModal] = useState({ open: false, decision: null });
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    Promise.all([
      verificationsAPI.getQueue(),
      projectsAPI.getAll().catch(() => ({ data: { data: { projects: [] } } })),
      adminAPI.getUsers().catch(() => ({ data: { data: { users: [] } } }))
    ])
      .then(([queueRes, projRes, usersRes]) => {
        const data = queueRes.data.data.submissions || [];
        const projs = projRes.data?.data?.projects || [];
        const allUsers = usersRes.data?.data?.users || [];
        
        const pMap = {};
        const pStatusMap = {};
        const pBaselineMap = {};
        projs.forEach(p => {
          pMap[p.projectId] = p.projectName;
          pStatusMap[p.projectId] = p.status;
          pBaselineMap[p.projectId] = p.baselinePhotos || [];
          if (p._id) {
            pMap[p._id] = p.projectName;
            pStatusMap[p._id] = p.status;
            pBaselineMap[p._id] = p.baselinePhotos || [];
          }
        });

        // Build wallet-to-name map
        const uMap = {};
        allUsers.forEach(u => {
          uMap[u.walletAddress] = u.userName;
          if (u.walletAddress) uMap[u.walletAddress.toLowerCase()] = u.userName;
        });

        const mapped = data.map((s) => ({
          id: s._id || s.submissionId,
          submissionId: s.submissionId || s._id,
          project: s.projectId,
          projectName: pMap[s.projectId] || s.projectId,
          projectStatus: pStatusMap[s.projectId] || "pending",
          officer: s.fieldOfficerWallet,
          officerName: uMap[s.fieldOfficerWallet] || uMap[s.fieldOfficerWallet?.toLowerCase()] || null,
          date: s.visitDate ? new Date(s.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–",
          trees: s.survivingTrees,
          survivalRate: s.survivalRate,
          gpsLat: s.gps?.lat,
          gpsLng: s.gps?.lng,
          siteCondition: s.siteCondition || {},
          activities: s.restorationLog?.activities || [],
          fieldNotes: s.restorationLog?.notes || "",
          photos: (s.currentPhotos || []).map(url => url?.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/').replace(/\/project-\d+\//, '/')),
          baselinePhotos: (pBaselineMap[s.projectId] || []).map(url => url?.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/').replace(/\/project-\d+\//, '/')),
          ipfsHashes: (s.currentPhotos || []).map(url => url?.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/').replace(/\/project-\d+\//, '/')),
          submittedAt: s.createdAt,
        }));
        setQueue(mapped);
      })
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDecision = async (decision) => {
    if ((decision === "rejected" || decision === "correction") && !comment) {
      setCommentError("Please add a comment explaining the rejection / correction needed.");
      return;
    }
    setCommentError("");

    if (decision === "rejected" || decision === "correction") {
      setRejectModal({ open: true, decision });
      return;
    }

    await executeDecision(decision);
  };

  const executeDecision = async (decision) => {
    setSaving(true);
    setRejectModal({ open: false, decision: null });

    const statusMap = { approved: "Approved", rejected: "Rejected", correction: "NeedsCorrection" };

    try {
      const res = await verificationsAPI.review(selected.submissionId, {
        status: statusMap[decision] || decision,
        remarks: comment,
        approvedCredits: decision === "approved" ? calculatedCredits : 0,
      });

      const verification = res.data?.data?.verification;
      const reportURI = res.data?.data?.reportURI;
      let finalTxHash = verification?.approvalTxHash || "";

      if (decision === "approved") {
        console.log("⏱️ [Verification] Pre-flight wallet checks:");
        console.log("  → Wallet address:", address || "NOT CONNECTED");
        console.log("  → writeAsync available:", !!writeAsync);
        console.log("  → reportURI:", reportURI);

        if (!address) {
          alert("Please connect your Web3 wallet (MetaMask) to approve this project on-chain.");
          throw new Error("Wallet not connected.");
        }
        if (!writeAsync || !reportURI) {
          throw new Error("Smart contract connection or report URI missing.");
        }

        try {
          console.log("⏱️ [Verification] Triggering MetaMask for project approval...");
          const t1 = performance.now();
          const txHash = await writeAsync(selected.project, address, reportURI);
          console.log(`⏱️ [Verification] Wallet tx took ${((performance.now() - t1) / 1000).toFixed(1)}s`);
          finalTxHash = txHash;
          setTxHash(txHash);

          // Confirm tx with backend
          await verificationsAPI.confirmTx(selected.submissionId, { txHash });
        } catch (txErr) {
          console.error("Wallet transaction failed:", txErr);
          throw new Error("Transaction was rejected or failed. You will need to retry from the dashboard.");
        }
      }

      setQueue((prev) => prev.filter((q) => q.id !== selected.id));
      setVerdict(decision);
    } catch (err) {
      console.error("Review failed:", err);
      // Depending on requirements we might show an alert here
      alert(err.message || "Failed to process the review.");
    }

    setSaving(false);
  };

  const resetReview = () => {
    setSelected(null);
    setComment("");
    setExpandedPhotoIndex(0);
    setIsPhotoExpanded(false);
    setCommentError("");
    setVerdict(null);
    setCalculationDone(false);
    setCalculatedCredits(0);
  };

  const timelineSteps = [
    { title: "Submitted by Field Officer", description: `GPS-tagged data and ${selected?.photos?.length || 0} photos`, date: selected?.submittedAt ? new Date(selected.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–", completed: true },
    { title: "Under Verification", description: "Validator reviewing submission", active: true },
    { title: "Decision", description: "Approve, reject or request correction" },
    { title: "Mint Queue", description: "Awaiting admin mint approval (if approved)" },
  ];

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading queue…</div>;

  if (verdict) {
    const isApproved = verdict === "approved";
    const isRejected = verdict === "rejected";
    
    let message = "";
    if (isApproved) {
      message = "The submission has been verified and the project has been approved on Polygon. It is now in the mint queue.";
    } else if (isRejected) {
      message = "The field officer has been notified of the rejection.";
    } else {
      message = "The field officer has been notified to make corrections.";
    }

    return (
      <TxSuccessScreen
        title={isApproved ? "Submission Approved" : isRejected ? "Submission Rejected" : "Correction Requested"}
        message={message}
        txHash={isApproved ? txHash : undefined}
        actionButtons={[
          { label: <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ArrowLeftIcon size={14} /> Back to Queue</span>, onClick: resetReview, primary: true }
        ]}
      />
    );
  }

  const combinedPhotos = selected ? [...(selected.baselinePhotos || []), ...(selected.photos || [])] : [];

  if (selected) {
    return (
      <>
        <ReviewWizard
          steps={wizardSteps}
          onBack={resetReview}
          stepGates={[true, calculationDone, true]}
        >
          { }
          <div>
            <div className="card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{selected.projectName}</h3>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Submitted by <strong>{selected.officerName ? `${selected.officerName} (${selected.officer?.slice(0, 6)}…${selected.officer?.slice(-4)})` : selected.officer}</strong> on {selected.date}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", marginRight: "6px" }}>Project Status:</span>
                    <StatusBadge status={(selected.projectStatus || "pending").toLowerCase()} />
                  </div>
                </div>
                <StatusBadge status="pending" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "16px", padding: "12px", background: "var(--bg)", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trees</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{selected.trees}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Survival</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{selected.survivalRate}%</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Latitude</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{selected.gpsLat}°N</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Longitude</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{selected.gpsLng}°E</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <div className="card" style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Site Condition</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                    <div><strong>Vegetation:</strong> {selected.siteCondition.vegetationDensity || "–"}</div>
                    <div><strong>Salinity:</strong> {selected.siteCondition.salinity || "–"} ppt</div>
                    <div><strong>pH:</strong> {selected.siteCondition.pH || "–"}</div>
                    <div><strong>Flooding:</strong> {selected.siteCondition.floodingLevel || "–"}</div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Activities Completed</h3>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {(selected.activities || []).map((a) => (
                      <span key={a} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Field Notes</h3>
                  <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{selected.fieldNotes || "No notes"}</p>
                </div>
              </div>

              <div>
                <div className="card" style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>GPS Location</h3>
                  <MapComponent pins={[{ lat: selected.gpsLat, lng: selected.gpsLng }]} height="180px" />
                </div>

              </div>
            </div>

          <div className="card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "20px", flexDirection: "column" }}>
                
                {/* Baseline Images Section */}
                <div>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #e5e7eb" }}>
                    Baseline Images (Project Creation)
                  </h3>
                  {selected.baselinePhotos && selected.baselinePhotos.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                      {selected.baselinePhotos.map((photo, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div 
                            style={{ 
                              height: "200px", background: "#111827", borderRadius: "8px", 
                              overflow: "hidden", position: "relative", cursor: "zoom-in",
                              border: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                            title="Click to expand"
                            onClick={() => {
                              setExpandedPhotoIndex(i);
                              setIsPhotoExpanded(true);
                              setZoomLevel(1);
                              setPan({ x: 0, y: 0 });
                            }}
                          >
                            {photo?.match(/\.(mp4|webm|mov)$/i) ? (
                              <video src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <img 
                                src={photo} 
                                alt={`Baseline ${i + 1}`} 
                                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available'; }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: "6px", color: "#6b7280", fontSize: "13px" }}>
                      No baseline images available
                    </div>
                  )}
                </div>

                {/* Field Officer Uploads Section */}
                <div style={{ marginTop: "10px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #e5e7eb" }}>
                    Field Officer Uploads (Current Submission)
                  </h3>
                  {selected.photos.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                      {selected.photos.map((photo, i) => {
                        const globalIndex = (selected.baselinePhotos?.length || 0) + i;
                        return (
                        <div key={globalIndex} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div 
                            style={{ 
                              height: "200px", background: "#111827", borderRadius: "8px", 
                              overflow: "hidden", position: "relative", cursor: "zoom-in",
                              border: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                            title="Click to expand"
                            onClick={() => {
                              setExpandedPhotoIndex(globalIndex);
                              setIsPhotoExpanded(true);
                              setZoomLevel(1);
                              setPan({ x: 0, y: 0 });
                            }}
                          >
                            {photo?.match(/\.(mp4|webm|mov)$/i) ? (
                              <video src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <img 
                                src={photo} 
                                alt={`Evidence ${i + 1}`} 
                                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available'; }}
                              />
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div style={{ padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: "6px", color: "#6b7280", fontSize: "13px" }}>
                      No field photos provided
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Process Timeline</h3>
              <Timeline steps={timelineSteps} />
            </div>
          </div>

          { }
          <div>
            <div style={{ maxWidth: "660px", margin: "0 auto" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px", textAlign: "center" }}>
                Enter the verified field data below to calculate the estimated carbon sequestration.
              </p>
              <CarbonCalculationForm onResult={(r) => {
                setCalculationDone(!!r);
                if (r) setCalculatedCredits(parseFloat(r.totalCO2) || 0);
              }} />
            </div>
          </div>

          { }
          <div>
            <div className="decision-section">
              <h3>Validator Decision</h3>
              <div className="form-group">
                <label>Comments / Reason</label>
                <textarea
                  placeholder="Required for rejection/correction. Optional for approval."
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setCommentError(""); }}
                  rows={3}
                />
                {commentError && <div className="inline-error">{commentError}</div>}
              </div>

              <div className="action-btns">
                <button className="primary-btn" onClick={() => handleDecision("approved")} disabled={saving}>
                  {saving ? "Processing..." : "Approve"}
                </button>
                <button className="secondary-btn" onClick={() => handleDecision("correction")} disabled={saving} style={{ color: "#b45309" }}>
                  Request Correction
                </button>
                <button className="secondary-btn" onClick={() => handleDecision("rejected")} disabled={saving} style={{ color: "#b91c1c" }}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </ReviewWizard>

        <ConfirmRejectModal
          isOpen={rejectModal.open}
          reason={comment}
          onClose={() => setRejectModal({ open: false, decision: null })}
          onConfirm={() => executeDecision(rejectModal.decision)}
        />

        {/* Full-screen Photo Modal (WhatsApp Style) */}
        {isPhotoExpanded && selected && (combinedPhotos.length > 0) && (
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
                const photoSrc = combinedPhotos[expandedPhotoIndex] || "";
                const isVideo = typeof photoSrc === 'string' && photoSrc.match(/\.(mp4|webm|mov)$/i);
                
                if (isVideo) {
                  return <video src={photoSrc} controls style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain" }} />;
                }
                
                return (
                  <img 
                    src={photoSrc} 
                    alt={`Evidence Full ${expandedPhotoIndex + 1}`} 
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
                Photo {expandedPhotoIndex + 1} of {combinedPhotos.length}
              </div>
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", maxWidth: "90vw", paddingBottom: "10px" }}>
                {combinedPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => { setExpandedPhotoIndex(i); setZoomLevel(1); setPan({x:0, y:0}); }}
                    style={{
                      width: "56px", height: "56px", borderRadius: "8px", cursor: "pointer", flexShrink: 0,
                      border: expandedPhotoIndex === i ? "3px solid #34d399" : "3px solid transparent",
                      background: typeof photo === 'string' && photo ? `url(${photo}) center/cover no-repeat` : "#1f2937", 
                      backgroundColor: "#1f2937", opacity: expandedPhotoIndex === i ? 1 : 0.5,
                      transition: "all 0.2s", transform: expandedPhotoIndex === i ? "scale(1.1)" : "scale(1)"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <h1>Verification Queue</h1>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>{queue.length} submissions pending</div>

      {queue.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2 style={{ fontSize: "20px", marginTop: "16px" }}>All caught up!</h2>
          <p style={{ color: "#6b7280" }}>No pending submissions in your queue.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Field Officer</th>
              <th>Submitted</th>
              <th>Trees</th>
              <th>Survival %</th>
              <th>Photos</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ marginBottom: "4px" }}>{item.projectName}</div>
                  <StatusBadge status={(item.projectStatus || "pending").toLowerCase()} />
                </td>
                <td>{item.officerName ? `${item.officerName}` : `${item.officer?.slice(0, 6)}…${item.officer?.slice(-4)}`}</td>
                <td>{item.date}</td>
                <td>{item.trees}</td>
                <td>{item.survivalRate}%</td>
                <td>{item.photos.length} files</td>
                <td>
                  <button
                    className="primary-btn"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => { setSelected(item); setExpandedPhotoIndex(0); }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', margin: '20px' }}>
          <h2>Something went wrong in VerificationQueue.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', fontSize: '12px' }}>
            <summary>Click for error details</summary>
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function VerificationQueueWrapper(props) {
  return (
    <ErrorBoundary>
      <VerificationQueue {...props} />
    </ErrorBoundary>
  );
}
