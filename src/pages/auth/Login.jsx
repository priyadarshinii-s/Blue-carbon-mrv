import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      handleLogin("ADMIN");
    }, 2000);
  };

  return (
    <div style={{
      height: "100vh", display: "flex", justifyContent: "center",
      alignItems: "center", background: "#f6f8fa",
    }}>
      <div style={{ background: "white", padding: "36px", width: "420px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <h1 style={{ textAlign: "center", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
          <img src="/vite.svg" alt="Logo" style={{ width: "24px", height: "24px" }} />
          Blue Carbon Registry
        </h1>
        <p style={{ textAlign: "center", marginBottom: "28px", color: "#6b7280", fontSize: "14px" }}>
          Connect your wallet to access the registry
        </p>

        <button
          className="primary-btn"
          style={{ width: "100%", padding: "14px", fontSize: "15px", marginBottom: "10px" }}
          onClick={handleWalletConnect}
          disabled={connecting}
        >
          {connecting ? "⏳ Connecting to MetaMask..." : "🦊 Connect MetaMask"}
        </button>

        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginBottom: "24px" }}>
          Sign message to authenticate securely on Polygon
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Demo Quick Login</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button className="secondary-btn" onClick={() => handleLogin("ADMIN")} style={{ padding: "10px", fontSize: "13px" }}>
            Admin
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("FIELD")} style={{ padding: "10px", fontSize: "13px" }}>
            Field Officer
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("VALIDATOR")} style={{ padding: "10px", fontSize: "13px" }}>
            Validator
          </button>
          <button className="secondary-btn" onClick={() => handleLogin("VIEWER")} style={{ padding: "10px", fontSize: "13px" }}>
            Community
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          New organisation?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate("/register"); }} style={{ color: "#0f766e", fontWeight: 500 }}>
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
