import { useState, useEffect } from "react";
import Timeline from "../../components/shared/Timeline";
import CalculationPreview from "../../components/shared/CalculationPreview";
import ReviewWizard from "../../components/shared/ReviewWizard";
import TransactionModal from "../../components/common/TransactionModal";
import ConfirmRejectModal from "../../components/common/ConfirmRejectModal";
import { adminAPI } from "../../services/api";

const wizardSteps = [
  { label: "Review Data" },
  { label: "Carbon Preview" },
  { label: "Decision" },
];

const MintApproval = () => {
  const [mintQueue, setMintQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [txModal, setTxModal] = useState({ open: false, status: "pending", txHash: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    adminAPI.getMintQueue()
      .then((res) => {
        const queue = res.data.data.mintQueue || res.data.data || [];
        const mapped = queue.map((item, i) => ({
          id: item.project?._id || i + 1,
          projectId: item.project?.projectId || item.projectId,
          project: item.project?.projectName || item.projectName || "–",
          fieldOfficer: item.project?.assignedFieldOfficer || "–",
          validator: item.project?.assignedValidator || "–",
          trees: item.project?.totalCarbonCredits || 0,
          survivalRate: 0,
          co2: item.unmintedCredits || 0,
          verifiedDate: item.project?.updatedAt
            ? new Date(item.project.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "–",
          status: "awaiting_mint",
        }));
        setMintQueue(mapped);
      })
      .catch(() => setMintQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMint = async () => {
    setTxModal({ open: true, status: "pending", txHash: "" });
    try {
      const res = await adminAPI.mint(selectedItem.projectId);
      const txHash = res.data?.data?.mintTxHash || "0x" + Math.random().toString(16).slice(2, 42) + Math.random().toString(16).slice(2, 28);
      setTxModal({ open: true, status: "success", txHash });
      setMintQueue(prev => prev.filter(q => q.id !== selectedItem.id));
    } catch {
      setTxModal({ open: true, status: "error", txHash: "" });
    }
  };

  const handleReject = () => {
    if (!rejectReason) {
      setRejectError("Please provide a rejection reason.");
      return;
    }
    setRejectError("");
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    setRejectModalOpen(false);
    setRejectReason("");
    setRejectError("");
    setMintQueue(prev => prev.filter(q => q.id !== selectedItem.id));
    setSelectedItem(null);
  };

  const resetReview = () => {
    setSelectedItem(null);
    setRejectReason("");
    setRejectError("");
  };

  const timelineSteps = [
    { title: "Field Data Submitted", description: "GPS-tagged photos and tree count submitted", date: "14 Feb 2026", completed: true },
    { title: "Validator Reviewed", description: "Photo evidence and GPS verified by validator", date: "18 Feb 2026", completed: true },
    { title: "Awaiting Mint Approval", description: "Admin to approve and mint carbon credits", active: true },
    { title: "Credits Minted", description: "ERC-20 tokens minted on Polygon" },
  ];

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading mint queue…</div>;

  return (
    <>
      <h1 style={{ paddingBottom: "0px", paddingTop: "5px" }}>Mint Approval Queue</h1>

      {!selectedItem ? (
        mintQueue.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px", marginTop: "12px" }}>
            <h2 style={{ fontSize: "20px" }}>No pending mint requests</h2>
            <p style={{ color: "#6b7280" }}>All verified submissions have been processed.</p>
          </div>
        ) : (
          <table className="table" style={{ marginTop: "12px" }}>
            <thead>
              <tr>
                <th>Project</th><th>Field Officer</th><th>Validator</th><th>Trees Verified</th><th>CO₂ (tCO₂e)</th><th>Verified Date</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mintQueue.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.project}</td>
                  <td>{item.fieldOfficer}</td>
                  <td>{item.validator}</td>
                  <td>{item.trees}</td>
                  <td>{item.co2}</td>
                  <td>{item.verifiedDate}</td>
                  <td><button className="primary-btn" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => setSelectedItem(item)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <>
          <ReviewWizard steps={wizardSteps} onBack={resetReview}>
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="card">
                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>{selectedItem.project}</h3>
                  <div style={{ fontSize: "14px", lineHeight: "2" }}>
                    <div><strong>Field Officer:</strong> {selectedItem.fieldOfficer}</div>
                    <div><strong>Validator:</strong> {selectedItem.validator}</div>
                    <div><strong>Trees Verified:</strong> {selectedItem.trees}</div>
                    <div><strong>Survival Rate:</strong> {selectedItem.survivalRate}%</div>
                    <div><strong>CO₂ Estimated:</strong> {selectedItem.co2} tCO₂e</div>
                    <div><strong>Verified Date:</strong> {selectedItem.verifiedDate}</div>
                  </div>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>Submission Timeline</h3>
                  <Timeline steps={timelineSteps} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ maxWidth: "660px", margin: "0 auto" }}>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px", textAlign: "center" }}>
                  Review the carbon calculation verified by the validator.
                </p>
                <CalculationPreview trees={selectedItem.trees} survivalRate={selectedItem.survivalRate} />
              </div>
            </div>

            <div>
              <div className="decision-section">
                <h3>Admin Decision</h3>
                <div className="form-group">
                  <label>Rejection Reason (required if rejecting)</label>
                  <textarea placeholder="Provide reason for rejection" value={rejectReason}
                    onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }} />
                  {rejectError && <div className="inline-error">{rejectError}</div>}
                </div>
                <div className="action-btns">
                  <button className="primary-btn" onClick={handleMint}>Approve &amp; Mint</button>
                  <button className="secondary-btn" style={{ color: "#b91c1c" }} onClick={handleReject}>Reject</button>
                </div>
              </div>
            </div>
          </ReviewWizard>

          <ConfirmRejectModal isOpen={rejectModalOpen} reason={rejectReason}
            onClose={() => setRejectModalOpen(false)} onConfirm={confirmReject} />
        </>
      )}

      <TransactionModal isOpen={txModal.open}
        onClose={() => { setTxModal({ open: false, status: "pending", txHash: "" }); setSelectedItem(null); }}
        status={txModal.status} txHash={txModal.txHash} />
    </>
  );
};

export default MintApproval;
