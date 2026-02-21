import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const WalletModal = ({ isOpen, onClose }) => {
    const { walletAddress, connectWallet, disconnectWallet } = useAuth();
    const [connecting, setConnecting] = useState(false);

    if (!isOpen) return null;

    const handleConnect = () => {
        setConnecting(true);
        setTimeout(() => {
            connectWallet();
            setConnecting(false);
        }, 1500);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontSize: "17px", margin: 0 }}>🦊 Wallet Settings</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
                </div>

                <div className="card" style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Network</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />
                        Polygon Mumbai Testnet
                    </div>
                </div>

                {walletAddress ? (
                    <div>
                        <div className="card" style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Connected Wallet</div>
                            <div style={{ fontSize: "12px", fontFamily: "monospace", wordBreak: "break-all" }}>{walletAddress}</div>
                        </div>
                        <button className="secondary-btn" style={{ color: "#b91c1c", width: "100%" }} onClick={() => { disconnectWallet(); onClose(); }}>
                            Disconnect Wallet
                        </button>
                    </div>
                ) : (
                    <div>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
                            Connect your MetaMask wallet to sign transactions and manage carbon credits.
                        </p>
                        <button className="primary-btn" style={{ width: "100%", padding: "12px" }} onClick={handleConnect} disabled={connecting}>
                            {connecting ? "⏳ Connecting..." : "🦊 Connect MetaMask"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletModal;
