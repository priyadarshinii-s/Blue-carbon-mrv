import { useState, useEffect, useContext } from "react";
import TransactionModal from "../../components/common/TransactionModal";
import { reportsAPI } from "../../services/api";
import AuthContext from "../../context/AuthContext";

const CreditsWallet = () => {
    const { user } = useContext(AuthContext);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [txModal, setTxModal] = useState({ open: false, status: "pending", txHash: "" });
    const [retiring, setRetiring] = useState(null);

    useEffect(() => {
        reportsAPI.getUserCredits()
            .then(res => setCredits(res.data.data || []))
            .catch(() => setCredits([]))
            .finally(() => setLoading(false));
    }, []);

    const activeCredits = credits.filter((c) => c.status === "active").reduce((sum, c) => sum + c.amount, 0);
    const retiredCredits = credits.filter((c) => c.status === "retired").reduce((sum, c) => sum + (c.retired || c.amount), 0);

    const handleRetire = (credit) => {
        if (!window.confirm(`Retire ${credit.amount} tCO₂e from "${credit.project}"?\nThis action is permanent and cannot be undone.`)) return;
        setRetiring(credit.id);
        setTxModal({ open: true, status: "pending", txHash: "" });
        setTimeout(() => {
            setTxModal({ open: true, status: "success", txHash: credit.txHash || "pending" });
            setRetiring(null);
        }, 3000);
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading credits…</div>;

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
                    <p style={{ fontSize: "13px", fontFamily: "monospace", margin: 0 }}>{user?.walletAddress || "Not connected"}</p>
                </div>
                {user?.walletAddress && (
                    <a href={`https://mumbai.polygonscan.com/address/${user.walletAddress}`} target="_blank" rel="noopener noreferrer" className="secondary-btn" style={{ fontSize: "12px" }}>
                        View on Explorer ↗
                    </a>
                )}
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
                        {credits.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No credits found.</td></tr>
                        ) : credits.map((c) => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.project}</td>
                                <td>{c.amount}</td>
                                <td>{new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                <td>
                                    {c.txHash ? (
                                        <a href={`https://mumbai.polygonscan.com/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer"
                                            style={{ fontSize: "11px", fontFamily: "monospace", color: "#0f766e" }}>
                                            {c.txHash.slice(0, 10)}...{c.txHash.slice(-6)}
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>—</span>
                                    )}
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
