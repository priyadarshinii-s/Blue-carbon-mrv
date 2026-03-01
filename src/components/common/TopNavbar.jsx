import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import WalletModal from "./WalletModal";

const roleLabels = {
  ADMIN: "NCCR Admin",
  FIELD: "Field Officer",
  VALIDATOR: "Validator",
  VIEWER: "Community Viewer",
};

const roleColors = {
  ADMIN: "#a78bfa",
  FIELD: "#2dd4bf",
  VALIDATOR: "#60a5fa",
  VIEWER: "#fbbf24",
};

const TopNavbar = () => {
  const { role, user, walletAddress, logout, isAuthenticated, openLogin } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return "Not connected";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="top-navbar frosted-navbar">
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                background: (roleColors[role] || "#9ca3af") + "25",
                color: roleColors[role] || "#9ca3af",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                border: `1px solid ${(roleColors[role] || "#9ca3af")}40`
              }}
            >
              {roleLabels[role] || role}
            </span>

            <div
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "6px",
                fontSize: "12px", cursor: "pointer", color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
              onClick={copyAddress}
              title={walletAddress || "Click to copy"}
            >
              <span>🔗</span>
              <span style={{ fontFamily: "monospace" }}>{shortenAddress(walletAddress)}</span>
              {copied && <span style={{ color: "#2dd4bf", fontSize: "11px" }}>Copied!</span>}
            </div>

            <NotificationBell />

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "14px", display: "flex", alignItems: "center", gap: "10px",
                  color: "white"
                }}
              >
                <span style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </span>
                <div style={{ textAlign: "left", display: "none", md: "block" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 500, opacity: 0.9 }}>{user?.name}</p>
                  <p style={{ margin: 0, fontSize: "10px", opacity: 0.6 }}>{user?.email}</p>
                </div>
              </button>

              {showProfile && (
                <div style={{
                  position: "absolute", top: "115%", right: 0,
                  background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", width: "200px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 100,
                  overflow: "hidden"
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "white" }}>{user?.name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowWallet(true); setShowProfile(false); }}
                    style={{
                      width: "100%", padding: "10px 16px", background: "none",
                      border: "none", textAlign: "left", cursor: "pointer",
                      fontSize: "13px", color: "rgba(255,255,255,0.8)",
                      transition: "background 0.2s",
                      display: "flex", alignItems: "center", gap: "10px"
                    }}
                    onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
                    onMouseOut={(e) => e.target.style.background = "none"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.36 0 .7-.14 1-.33A1.65 1.65 0 0 0 10.33 3H10a2 2 0 1 1 4 0v.1c0 .36.14.7.33 1 .3.19.64.33 1 .33.36 0 .7-.14 1-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.19.3-.33.64-.33 1 0 .36.14.7.33 1 .3.19.64.33 1 .33H21a2 2 0 1 1 0 4h-.1c-.36 0-.7.14-1 .33-.19.3-.33.64-.33 1z" />
                    </svg>
                    Wallet Settings
                  </button>
                  <button
                    onClick={() => { logout(); setShowProfile(false); }}
                    style={{
                      width: "100%", padding: "10px 16px", background: "none",
                      border: "none", textAlign: "left", cursor: "pointer",
                      fontSize: "13px", color: "#f87171", borderTop: "1px solid rgba(255,255,255,0.05)",
                      transition: "background 0.2s",
                      display: "flex", alignItems: "center", gap: "10px"
                    }}
                    onMouseOver={(e) => e.target.style.background = "rgba(248,113,113,0.05)"}
                    onMouseOut={(e) => e.target.style.background = "none"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="primary-btn"
              onClick={openLogin}
              style={{ background: "#0f766e", fontSize: "13px", padding: "8px 16px", border: "none" }}
            >
              Login
            </button>
          </div>
        )}
      </div>

      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
    </>
  );
};

export default TopNavbar;
