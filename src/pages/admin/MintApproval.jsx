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
  const [txModal, setTxModal] = useState({ open: false, status: "pending", txHash: "", blockNumber: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [mintError, setMintError] = useState("");

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
          totalMinted: item.totalMinted || 0,
          survivalRate: 0,
          co2: item.unmintedCredits || 0,
          verifiedDate: item.project?.updatedAt
            ? new Date(item.project.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "–",
          projectCreatedAt: item.project?.createdAt
            ? new Date(item.project.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "–",
          onChainEnabled: item.onChainEnabled || false,
          status: "awaiting_mint",
        }));
        setMintQueue(mapped);
      })
      .catch(() => setMintQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMint = async () => {
    setTxModal({ open: true, status: "pending", txHash: "", blockNumber: null });
    setMintError("");
    try {
      const res = await adminAPI.mint(selectedItem.projectId, {
        year: new Date().getFullYear().toString(),
        amount: selectedItem.co2,
      });

      const data = res.data?.data;
      const txHash = data?.txHash || "";
      const blockNumber = data?.blockNumber || null;
      const onChainStatus = data?.onChainStatus || "confirmed";

      setTxModal({
        open: true,
        status: onChainStatus === "confirmed" || onChainStatus === "pending" ? "success" : "error",
        txHash,
        blockNumber,
      });
      setMintQueue(prev => prev.filter(q => q.id !== selectedItem.id));
    } catch (err) {
      const errorMsg = err?.response?.data?.error?.message || "Transaction failed. Please try again.";
      setMintError(errorMsg);
      setTxModal({ open: true, status: "error", txHash: "", blockNumber: null });
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
    setMintError("");
  };

  const timelineSteps = [
    { title: "Project Registered", description: "Project registered on the platform", date: selectedItem ? selectedItem.projectCreatedAt : "–", completed: true },
    { title: "Validator Reviewed", description: "Photo evidence and GPS verified by validator", date: selectedItem ? selectedItem.verifiedDate : "–", completed: true },
    { title: "Awaiting Mint Approval", description: "Admin to approve and mint carbon credits on-chain", active: true },
    { title: "Credits Minted", description: "ERC-20 tokens minted on Ethereum (Sepolia)" },
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
                <th>Project</th><th>Field Officer</th><th>Validator</th><th>Total Credits</th><th>Already Minted</th><th>Mintable (tCO₂e)</th><th>Verified Date</th><th>Chain</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mintQueue.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.project}</td>
                  <td>{item.fieldOfficer}</td>
                  <td>{item.validator}</td>
                  <td>{item.trees}</td>
                  <td>{item.totalMinted}</td>
                  <td>
                    <span style={{
                      background: "#ecfdf5", color: "#065f46", fontWeight: 600,
                      padding: "2px 8px", borderRadius: "10px", fontSize: "13px"
                    }}>
                      {item.co2}
                    </span>
                  </td>
                  <td>{item.verifiedDate}</td>
                  <td>
                    {item.onChainEnabled ? (
                      <span style={{
                        background: "#dbeafe", color: "#1e40af", fontSize: "11px",
                        padding: "2px 6px", borderRadius: "4px", fontWeight: 500,
                      }}>On-Chain</span>
                    ) : (
                      <span style={{
                        background: "#f3f4f6", color: "#6b7280", fontSize: "11px",
                        padding: "2px 6px", borderRadius: "4px",
                      }}>Off-Chain</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="primary-btn"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => setSelectedItem(item)}
                    >
                      Review
                    </button>
                  </td>
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
                    <div><strong>Total Credits:</strong> {selectedItem.trees} tCO₂e</div>
                    <div><strong>Already Minted:</strong> {selectedItem.totalMinted} tCO₂e</div>
                    <div>
                      <strong>Mintable Credits:</strong>{" "}
                      <span style={{ color: "#065f46", fontWeight: 700, fontSize: "16px" }}>
                        {selectedItem.co2} tCO₂e
                      </span>
                    </div>
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

                {/* On-chain information box */}
                <div style={{
                  background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px",
                  padding: "12px 16px", marginBottom: "16px", fontSize: "13px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px" }}>⛓️</span>
                    <strong style={{ color: "#1e40af" }}>On-Chain Minting</strong>
                  </div>
                  <p style={{ color: "#374151", margin: 0 }}>
                    Clicking "Approve & Mint" will mint <strong>{selectedItem.co2} BCC tokens</strong> (ERC-20)
                    on the blockchain. Metadata will be stored on IPFS. This action is irreversible.
                  </p>
                </div>

                {mintError && (
                  <div style={{
                    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px",
                    padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#991b1b",
                  }}>
                    <strong>Mint Error:</strong> {mintError}
                  </div>
                )}

                <div className="form-group">
                  <label>Rejection Reason (required if rejecting)</label>
                  <textarea placeholder="Provide reason for rejection" value={rejectReason}
                    onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }} />
                  {rejectError && <div className="inline-error">{rejectError}</div>}
                </div>
                <div className="action-btns">
                  <button className="primary-btn" onClick={handleMint}>
                    ⛓️ Approve & Mint On-Chain
                  </button>
                  <button className="secondary-btn" style={{ color: "#b91c1c" }} onClick={handleReject}>Reject</button>
                </div>
              </div>
            </div>
          </ReviewWizard>

          <ConfirmRejectModal isOpen={rejectModalOpen} reason={rejectReason}
            onClose={() => setRejectModalOpen(false)} onConfirm={confirmReject} />
        </>
      )}

      <TransactionModal
        isOpen={txModal.open}
        onClose={() => { setTxModal({ open: false, status: "pending", txHash: "", blockNumber: null }); setSelectedItem(null); }}
        status={txModal.status}
        txHash={txModal.txHash}
        blockNumber={txModal.blockNumber}
      />
    </>
  );
};

export default MintApproval;
