import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (role) => {
  const demoUsers = {
    ADMIN: {
      role: "ADMIN",
      email: "admin@nccr.gov.in",
    },
    FIELD: {
      role: "FIELD",
      email: "field.officer@ngo.org",
    },
    VALIDATOR: {
      role: "VALIDATOR",
      email: "validator@nccr.gov.in",
    },
    VIEWER: {
      role: "VIEWER",
      email: "community.viewer@ngo.org",
    },
  };

  login(demoUsers[role]);

  if (role === "ADMIN") navigate("/admin/dashboard");
  if (role === "FIELD") navigate("/field/dashboard");
  if (role === "VALIDATOR") navigate("/validator/dashboard");
  if (role === "VIEWER") navigate("/viewer/dashboard");
};


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f6f8fa",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          width: "380px",
          borderRadius: "8px",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Blue Carbon MRV</h1>
        <p style={{ textAlign: "center", marginBottom: "20px" }}>
          Role-based Secure Access
        </p>

        <label>Email</label>
        <input type="email" placeholder="user@organization.org" />

        <label className="mt-20">Select Role (Demo)</label>
        <select>
          <option>NCCR Admin</option>
          <option>Field Officer</option>
          <option>Validator</option>
          <option>Community Viewer</option>
        </select>

        <button
          className="secondary-btn"
          style={{ width: "100%", marginTop: "15px" }}
        >
          Connect Wallet (MetaMask)
        </button>

        {/* Demo login buttons */}
        <button
          className="primary-btn"
          style={{ width: "100%", marginTop: "15px" }}
          onClick={() => handleLogin("ADMIN")}
        >
          Login as Admin
        </button>

        <button
          className="secondary-btn"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={() => handleLogin("FIELD")}
        >
          Login as Field Officer
        </button>

        <button
          className="secondary-btn"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={() => handleLogin("VALIDATOR")}
        >
          Login as Validator
        </button>

        <button
          className="secondary-btn"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={() => handleLogin("VIEWER")}
        >
          Login as Community Viewer
        </button>
      </div>
    </div>
  );
};

export default Login;
