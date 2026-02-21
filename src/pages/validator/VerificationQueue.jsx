import { useState } from "react";
import StatusBadge from "../../components/shared/StatusBadge";
import MapComponent from "../../components/shared/MapComponent";
import CalculationPreview from "../../components/shared/CalculationPreview";
import Timeline from "../../components/shared/Timeline";

const pendingQueue = [
  {
    id: 1, project: "Mangrove Restoration – TN", officer: "Arun Kumar",
    date: "21 Feb 2026", trees: 350, survivalRate: 85, gpsLat: 11.127, gpsLng: 78.656,
    siteCondition: { vegetationDensity: "dense", salinity: "28", pH: "7.2", floodingLevel: "moderate" },
    activities: ["Sapling Planting", "Fencing & Protection"],
    fieldNotes: "Good rains this month. Most saplings have taken root well. Some goat intrusion near north boundary.",
    photos: ["Photo_001.jpg", "Photo_002.jpg", "Photo_003.jpg", "Photo_004.jpg"],
    ipfsHashes: ["QmX1abc...", "QmX2def...", "QmX3ghi...", "QmX4jkl..."],
    submittedAt: "2026-02-21",
  },
  {
    id: 2, project: "Seagrass Revival – Kerala", officer: "Lakshmi Nair",
    date: "20 Feb 2026", trees: 180, survivalRate: 72, gpsLat: 10.85, gpsLng: 76.271,
    siteCondition: { vegetationDensity: "moderate", salinity: "32", pH: "8.1", floodingLevel: "high" },
    activities: ["Seedling Distribution", "Biodiversity Survey"],
    fieldNotes: "Tidal conditions were challenging. Lower survival rate due to storm last week.",
    photos: ["Photo_001.jpg", "Photo_002.jpg", "Photo_003.jpg"],
    ipfsHashes: ["QmY1abc...", "QmY2def...", "QmY3ghi..."],
    submittedAt: "2026-02-20",
  },
  {
    id: 3, project: "Saltmarsh Recovery – Gujarat", officer: "Vikram Singh",
    date: "19 Feb 2026", trees: 500, survivalRate: 90, gpsLat: 21.17, gpsLng: 72.831,
    siteCondition: { vegetationDensity: "dense", salinity: "24", pH: "6.8", floodingLevel: "low" },
    activities: ["Sapling Planting", "Community Training", "Soil Sampling"],
    fieldNotes: "Excellent conditions. New community members joined training session.",
    photos: ["Photo_001.jpg", "Photo_002.jpg", "Photo_003.jpg", "Photo_004.jpg", "Photo_005.jpg"],
    ipfsHashes: ["QmZ1abc...", "QmZ2def...", "QmZ3ghi...", "QmZ4jkl...", "QmZ5mno..."],
    submittedAt: "2026-02-19",
  },
];

const VerificationQueue = () => {
  const [selected, setSelected] = useState(null);
  const [queue, setQueue] = useState(pendingQueue);
  const [comment, setComment] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [saving, setSaving] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const handleDecision = (decision) => {
    if ((decision === "rejected" || decision === "correction") && !comment) {
      alert("Please add a comment explaining the rejection / correction needed.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setQueue((prev) => prev.filter((q) => q.id !== selected.id));
      setVerdict(decision);
      setSaving(false);
    }, 1500);
  };

  const timelineSteps = [
    { title: "Submitted by Field Officer", description: `GPS-tagged data and ${selected?.photos?.length || 0} photos`, date: selected?.submittedAt, completed: true },
    { title: "Under Verification", description: "Validator reviewing submission", active: true },
    { title: "Decision", description: "Approve, reject or request correction" },
    { title: "Mint Queue", description: "Awaiting admin mint approval (if approved)" },
  ];

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
              0x{Math.random().toString(16).slice(2)}...{Math.random().toString(16).slice(2, 10)}
            </div>
          </div>
        )}
        <div className="action-btns mt-20">
          <button className="primary-btn" onClick={() => { setVerdict(null); setSelected(null); setComment(""); setActivePhoto(0); }}>
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
          <button className="secondary-btn" onClick={() => { setSelected(null); setComment(""); setActivePhoto(0); }}>
            Back
          </button>
          <h1 style={{ margin: 0, fontSize: "20px" }}>Review: {selected.project}</h1>
          <StatusBadge status="pending" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div>
            <div className="card">
              <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Submission Data</h3>
              <div style={{ fontSize: "14px", lineHeight: "2.2" }}>
                <div><strong>Officer:</strong> {selected.officer}</div>
                <div><strong>Date:</strong> {selected.date}</div>
                <div><strong>Trees Counted:</strong> {selected.trees}</div>
                <div><strong>Survival Rate:</strong> {selected.survivalRate}%</div>
                <div><strong>GPS:</strong> {selected.gpsLat}°N, {selected.gpsLng}°E</div>
              </div>
            </div>

            <div className="card mt-20">
              <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Site Condition</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                <div><strong>Vegetation:</strong> {selected.siteCondition.vegetationDensity}</div>
                <div><strong>Salinity:</strong> {selected.siteCondition.salinity} ppt</div>
                <div><strong>pH:</strong> {selected.siteCondition.pH}</div>
                <div><strong>Flooding:</strong> {selected.siteCondition.floodingLevel}</div>
              </div>
            </div>

            <div className="card mt-20">
              <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Activities Completed</h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {selected.activities.map((a) => (
                  <span key={a} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="card mt-20">
              <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Field Notes</h3>
              <p style={{ fontSize: "13px", color: "#374151" }}>{selected.fieldNotes}</p>
            </div>

            <div className="mt-20">
              <CalculationPreview trees={selected.trees} survivalRate={selected.survivalRate} />
            </div>
          </div>


          <div>
            <div className="card">
              <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>GPS Location</h3>
              <MapComponent pins={[{ lat: selected.gpsLat, lng: selected.gpsLng }]} height="200px" />
            </div>

            <div className="card mt-20">
              <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>
                Photo Evidence ({selected.photos.length} files)
              </h3>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                {selected.photos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      padding: "6px 10px", fontSize: "12px",
                      background: activePhoto === i ? "#0f2a44" : "#f3f4f6",
                      color: activePhoto === i ? "white" : "#374151",
                      borderRadius: "6px", cursor: "pointer",
                    }}
                  >
                    {photo}
                  </div>
                ))}
              </div>
              <div style={{
                height: "140px", background: "#f3f4f6", borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", color: "#6b7280",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div>{selected.photos[activePhoto]}</div>
                  <div style={{ fontSize: "11px", marginTop: "4px" }}>IPFS: {selected.ipfsHashes[activePhoto]}</div>
                </div>
              </div>
            </div>

            <div className="card mt-20">
              <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Process Timeline</h3>
              <Timeline steps={timelineSteps} />
            </div>


            <div className="card mt-20">
              <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Validator Decision</h3>
              <div className="form-group">
                <label>Comments / Reason</label>
                <textarea
                  placeholder="Required for rejection/correction. Optional for approval."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
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
        </div>
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
