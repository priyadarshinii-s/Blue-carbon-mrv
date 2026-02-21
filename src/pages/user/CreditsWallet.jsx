import { useState } from "react";
import TransactionModal from "../../components/common/TransactionModal";

const myCredits = [
    { id: 1, project: "Mangrove Restoration – TN", amount: 20, txHash: "0xabc123...def789", date: "07 Feb 2026", status: "active" },
    { id: 2, project: "Saltmarsh Recovery – Gujarat", amount: 15, txHash: "0x456abc...123def", date: "12 Jan 2026", status: "active" },
    { id: 3, project: "Coastal Wetland – WB", amount: 15, txHash: "0x789def...456abc", date: "01 Jan 2026", status: "retired" },
];

const CreditsWallet = () => {
    const [txModal, setTxModal] = useState({ open: false, status: "pending", txHash: "" });
    const [retiring, setRetiring] = useState(null);

    const activeCredits = myCredits.filter((c) => c.status === "active").reduce((sum, c) => sum + c.amount, 0);
    const retiredCredits = myCredits.filter((c) => c.status === "retired").reduce((sum, c) => sum + c.amount, 0);

    const handleRetire = (credit) => {
        if (!window.confirm(`Retire ${credit.amount} tCO₂e from "${credit.project}"?\nThis action is permanent and cannot be undone.`)) return;
        setRetiring(credit.id);
        setTxModal({ open: true, status: "pending", txHash: "" });
        setTimeout(() => {
            const hash = "0x" + Math.random().toString(16).slice(2, 42);
            setTxModal({ open: true, status: "success", txHash: hash });
            setRetiring(null);
        }, 3000);
    };

    return (
        <>
            <h1>Carbon Credits Wallet</h1>


            <div className="card-grid">
                <div className="card" style={{ borderLeft: "4px solid #0f766e" }}>
                    <h3 style={{ fontSize: "13px", color: "#6b7280" }}>Active Credits</h3>
                    <p style={{ fontSize: "32px", fontWeight: "bold", color: "#0f766e" }}>{activeCredits}</p>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>tCO₂e</p>
                </div>
                <div className="card" style={{ borderLeft: "4px solid #7c3aed" }}>
                    <h3 style={{ fontSize: "13px", color: "#6b7280" }}>Retired Credits</h3>
                    <p style={{ fontSize: "32px", fontWeight: "bold", color: "#7c3aed" }}>{retiredCredits}</p>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>tCO₂e (permanent)</p>
                </div>
                <div className="card" style={{ borderLeft: "4px solid #b45309" }}>
                    <h3 style={{ fontSize: "13px", color: "#6b7280" }}>Market Value (est.)</h3>
                    <p style={{ fontSize: "32px", fontWeight: "bold", color: "#b45309" }}>₹{(activeCredits * 850).toLocaleString()}</p>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>@ ₹850/tCO₂e</p>
                </div>
            </div>


            <div className="card mt-20" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 4px" }}>Wallet Address (ERC-20 Token Holder)</h3>
                    <p style={{ fontSize: "13px", fontFamily: "monospace", margin: 0 }}>0x7a3B4c1D8e5F6a9B2c3D4e5F6a7B8c9D0e1F9f2E</p>
                </div>
                <a href="https://mumbai.polygonscan.com/address/0x7a3B" target="_blank" rel="noopener noreferrer" className="secondary-btn" style={{ fontSize: "12px" }}>
                    View on Explorer ↗
                </a>
            </div>


            <div className="mt-30">
                <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>Credit History</h2>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Amount (tCO₂e)</th>
                            <th>Minted Date</th>
                            <th>Tx Hash</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myCredits.map((c) => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.project}</td>
                                <td>{c.amount}</td>
                                <td>{c.date}</td>
                                <td>
                                    <a href={`https://mumbai.polygonscan.com/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}>
                                        {c.txHash}
                                    </a>
                                </td>
                                <td>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                                        background: c.status === "active" ? "#f0fdf4" : "#f5f3ff",
                                        color: c.status === "active" ? "#166534" : "#6d28d9",
                                    }}>
                                        {c.status === "active" ? "Active" : "Retired"}
                                    </span>
                                </td>
                                <td>
                                    {c.status === "active" ? (
                                        <button
                                            className="secondary-btn"
                                            style={{ fontSize: "12px", padding: "4px 10px", color: "#7c3aed" }}
                                            onClick={() => handleRetire(c)}
                                            disabled={retiring === c.id}
                                        >
                                            {retiring === c.id ? "⏳..." : "Retire"}
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            <div className="card mt-20" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <h3 style={{ fontSize: "14px", marginBottom: "6px" }}>ℹ️ About Carbon Credit Retirement</h3>
                <p style={{ fontSize: "13px", color: "#78350f" }}>
                    Retiring a carbon credit permanently removes it from circulation, proving that the corresponding CO₂ offset has been claimed.
                    This is recorded permanently on the Polygon blockchain. Once retired, credits cannot be re-activated.
                </p>
            </div>

            <TransactionModal
                isOpen={txModal.open}
                onClose={() => setTxModal({ open: false, status: "pending", txHash: "" })}
                status={txModal.status}
                txHash={txModal.txHash}
                title="Retire Carbon Credits"
            />
        </>
    );
};

export default CreditsWallet;
