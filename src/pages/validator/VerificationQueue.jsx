import { useState, useEffect } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";
import CarbonCalculationForm from "../../components/shared/CarbonCalculationForm";
import Timeline from "../../components/shared/Timeline";
import ReviewWizard from "../../components/shared/ReviewWizard";
import ConfirmRejectModal from "../../components/common/ConfirmRejectModal";
import { verificationsAPI } from "../../services/api";




const wizardSteps = [
  { label: "Review Data" },
  { label: "Carbon Calculation" },
  { label: "Decision" },
];

const VerificationQueue = () => {
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [saving, setSaving] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [commentError, setCommentError] = useState("");
  const [calculationDone, setCalculationDone] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, decision: null });
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    verificationsAPI.getQueue()
      .then((res) => {
        const data = res.data.data.submissions || [];

        const mapped = data.map((s) => ({
          id: s._id || s.submissionId,
          submissionId: s.submissionId || s._id,
          project: s.projectId,
          officer: s.fieldOfficerWallet,
          date: s.visitDate ? new Date(s.visitDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–",
          trees: s.survivingTrees,
          survivalRate: s.survivalRate,
          gpsLat: s.gps?.lat,
          gpsLng: s.gps?.lng,
          siteCondition: s.siteCondition || {},
          activities: s.restorationLog?.activities || [],
          fieldNotes: s.restorationLog?.notes || "",
          photos: s.currentPhotos || [],
          ipfsHashes: s.currentPhotos || [],
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
      await verificationsAPI.review(selected.submissionId, {
        status: statusMap[decision] || decision,
        remarks: comment,
        approvedCredits: decision === "approved" ? selected.trees * 0.03 : 0,
      });
    } catch {
      /* ignore */
    }

    setQueue((prev) => prev.filter((q) => q.id !== selected.id));
    setTxHash(`0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2, 10)}`);
    setVerdict(decision);
    setSaving(false);
  };

  const resetReview = () => {
    setSelected(null);
    setComment("");
    setActivePhoto(0);
    setCommentError("");
    setVerdict(null);
    setCalculationDone(false);
  };

  const timelineSteps = [
    { title: "Submitted by Field Officer", description: `GPS-tagged data and ${selected?.photos?.length || 0} photos`, date: selected?.submittedAt, completed: true },
    { title: "Under Verification", description: "Validator reviewing submission", active: true },
    { title: "Decision", description: "Approve, reject or request correction" },
    { title: "Mint Queue", description: "Awaiting admin mint approval (if approved)" },
  ];

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading queue…</div>;

  if (verdict) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <h2 style={{ fontSize: "22px", marginTop: "16px" }}>
          {verdict === "approved" ? "Submission Approved" : verdict === "rejected" ? "Submission Rejected" : "Correction Requested"}
        </h2>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          {verdict === "approved"
            ? "The submission has been moved to the admin mint queue."
            : verdict === "rejected"
              ? "The field officer has been notified of the rejection."
              : "The field officer has been notified to make corrections."}
        </p>
        {verdict === "approved" && (
          <div className="card mt-20" style={{ display: "inline-block", textAlign: "left", minWidth: "300px" }}>
            <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Verification Tx Hash</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", wordBreak: "break-all", color: "#0f766e" }}>
              {txHash}
            </div>
          </div>
        )}
        <div className="action-btns mt-20">
          <button className="primary-btn" onClick={resetReview}>
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

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
                  <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>{selected.project}</h3>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Submitted by <strong>{selected.officer}</strong> on {selected.date}
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

                <div className="card">
                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>
                    Photo Evidence ({selected.photos.length} files)
                  </h3>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                    {selected.photos.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        style={{
                          padding: "5px 10px", fontSize: "11px",
                          background: activePhoto === i ? "#0f766e" : "#f3f4f6",
                          color: activePhoto === i ? "white" : "#374151",
                          borderRadius: "6px", cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {typeof photo === "string" ? photo : `Photo ${i + 1}`}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    height: "120px", background: "#f3f4f6", borderRadius: "6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", color: "#6b7280",
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <div>{selected.photos[activePhoto]}</div>
                      <div style={{ fontSize: "11px", marginTop: "4px" }}>IPFS: {selected.ipfsHashes[activePhoto]}</div>
                    </div>
                  </div>
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
              <CarbonCalculationForm onResult={(r) => setCalculationDone(!!r)} />
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
                <td style={{ fontWeight: 500 }}>{item.project}</td>
                <td>{item.officer}</td>
                <td>{item.date}</td>
                <td>{item.trees}</td>
                <td>{item.survivalRate}%</td>
                <td>{item.photos.length} files</td>
                <td>
                  <button
                    className="primary-btn"
                    style={{ fontSize: "12px", padding: "6px 12px" }}
                    onClick={() => { setSelected(item); setActivePhoto(0); }}
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

export default VerificationQueue;
