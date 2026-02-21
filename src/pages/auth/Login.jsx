import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState("wallet");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);

  const demoUsers = {
    ADMIN: { role: "ADMIN", email: "admin@nccr.gov.in", name: "Rajesh Kumar", walletAddress: "0x7a3B4c1D8e5F6a9B2c3D4e5F6a7B8c9D0e1F9f2E" },
    FIELD: { role: "FIELD", email: "field.officer@ngo.org", name: "Arun Kumar", walletAddress: "0x8b4C5d2E9f6G7a0B3c4D5e6F7a8B9c0D1e2F3a4B" },
    VALIDATOR: { role: "VALIDATOR", email: "validator@nccr.gov.in", name: "Priya Sharma", walletAddress: "0x9c5D6e3F0g7H8b1C4d5E6f7G8a9B0c1D2e3F4a5C" },
    VIEWER: { role: "VIEWER", email: "community@ngo.org", name: "Meera Patel", walletAddress: "0x0d6E7f4G1h8I9c2D5e6F7g8H9a0B1c2D3e4F5a6D" },
  };

  const handleLogin = (role) => {
    login(demoUsers[role]);
    if (role === "ADMIN") navigate("/admin/dashboard");
    if (role === "FIELD") navigate("/field/dashboard");
    if (role === "VALIDATOR") navigate("/validator/dashboard");
    if (role === "VIEWER") navigate("/user/dashboard");
  };

  const handleWalletConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      // In a real app, this would verify signature and determine role
      handleLogin("ADMIN");
    }, 2000);
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    // Mock: determine role from email
    if (email.includes("admin")) handleLogin("ADMIN");
    else if (email.includes("field")) handleLogin("FIELD");
    else if (email.includes("validator")) handleLogin("VALIDATOR");
    else handleLogin("VIEWER");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", justifyContent: "center",
      alignItems: "center", background: "#f6f8fa",
    }}>
      <div style={{ background: "white", padding: "32px", width: "420px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <h1 style={{ textAlign: "center", fontSize: "22px" }}>🌊 BlueCarbon MRV</h1>
        <p style={{ textAlign: "center", marginBottom: "24px", color: "#6b7280", fontSize: "14px" }}>
          Secure Role-Based Access
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", marginBottom: "20px", borderBottom: "2px solid #e5e7eb" }}>
          <button
            onClick={() => setActiveTab("wallet")}
            style={{
              flex: 1, padding: "10px", background: "none", border: "none",
              borderBottom: activeTab === "wallet" ? "2px solid #0f2a44" : "none",
              fontWeight: activeTab === "wallet" ? 600 : 400,
              cursor: "pointer", fontSize: "14px", marginBottom: "-2px",
            }}
          >
            🦊 Wallet Login
          </button>
          <button
            onClick={() => setActiveTab("email")}
            style={{
              flex: 1, padding: "10px", background: "none", border: "none",
              borderBottom: activeTab === "email" ? "2px solid #0f2a44" : "none",
              fontWeight: activeTab === "email" ? 600 : 400,
              cursor: "pointer", fontSize: "14px", marginBottom: "-2px",
            }}
          >
            📧 Email Login
          </button>
        </div>

        {activeTab === "wallet" ? (
          <div>
            <button
              className="primary-btn"
              style={{ width: "100%", padding: "14px", fontSize: "15px" }}
              onClick={handleWalletConnect}
              disabled={connecting}
            >
              {connecting ? "⏳ Connecting to MetaMask..." : "🦊 Connect MetaMask"}
            </button>
            <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", margin: "12px 0" }}>
              Sign message: "Login to BlueCarbon MRV – {new Date().toISOString().split("T")[0]}"
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="user@organization.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="primary-btn" type="submit" style={{ width: "100%", marginTop: "8px" }}>
              Login
            </button>
            <p style={{ textAlign: "center", marginTop: "12px" }}>
              <a href="#" style={{ fontSize: "13px", color: "#0f766e" }}>Forgot Password?</a>
            </p>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Demo Quick Login</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Demo login buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button className="secondary-btn" onClick={() => handleLogin("ADMIN")} style={{ padding: "10px", fontSize: "13px" }}>
            🛡️ Admin
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("FIELD")} style={{ padding: "10px", fontSize: "13px" }}>
            📋 Field Officer
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("VALIDATOR")} style={{ padding: "10px", fontSize: "13px" }}>
            ✅ Validator
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("VIEWER")} style={{ padding: "10px", fontSize: "13px" }}>
            👁️ Community
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          Don't have an account?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }} style={{ color: "#0f766e", fontWeight: 500 }}>
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
