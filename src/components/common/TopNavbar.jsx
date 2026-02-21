import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import WalletModal from "./WalletModal";

const roleLabels = {
  ADMIN: "NCCR Admin",
  FIELD: "Field Officer",
  VALIDATOR: "Validator",
  VIEWER: "Community Viewer",
};

const roleColors = {
  ADMIN: "#7c3aed",
  FIELD: "#0f766e",
  VALIDATOR: "#1d4ed8",
  VIEWER: "#b45309",
};

const TopNavbar = () => {
  const { role, user, walletAddress, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <div className="top-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              background: (roleColors[role] || "#6b7280") + "20",
              color: roleColors[role] || "#6b7280",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {roleLabels[role] || role}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Wallet Address */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "#f3f4f6", padding: "4px 10px", borderRadius: "6px",
              fontSize: "13px", cursor: "pointer",
            }}
            onClick={copyAddress}
            title={walletAddress || "Click to copy"}
          >
            <span>🔗</span>
            <span>{shortenAddress(walletAddress)}</span>
            {copied && <span style={{ color: "#0f766e", fontSize: "11px" }}>Copied!</span>}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "18px", padding: "4px",
            }}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "14px", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <span style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#0f2a44", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 600,
              }}>
                {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </span>
              <span style={{ fontSize: "13px" }}>{user?.email}</span>
            </button>

            {showProfile && (
              <div style={{
                position: "absolute", top: "100%", right: 0,
                background: "white", border: "1px solid #e5e7eb",
                borderRadius: "8px", width: "200px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100,
                marginTop: "4px",
              }}>
                <button
                  onClick={() => { setShowWallet(true); setShowProfile(false); }}
                  style={{
                    width: "100%", padding: "10px 16px", background: "none",
                    border: "none", textAlign: "left", cursor: "pointer",
                    fontSize: "13px", borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  🔗 Wallet Settings
                </button>
                <button
                  onClick={() => { logout(); setShowProfile(false); }}
                  style={{
                    width: "100%", padding: "10px 16px", background: "none",
                    border: "none", textAlign: "left", cursor: "pointer",
                    fontSize: "13px", color: "#b91c1c",
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
    </>
  );
};

export default TopNavbar;
