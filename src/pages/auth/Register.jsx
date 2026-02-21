import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { connectWallet, walletAddress } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        organization: "",
        walletAddress: "",
        role: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleConnectWallet = () => {
        const addr = connectWallet();
        setForm({ ...form, walletAddress: addr });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.phone || !form.organization || !form.role) {
            alert("Please fill all required fields");
            return;
        }
        if (!form.walletAddress && !walletAddress) {
            alert("Please connect your wallet");
            return;
        }
        console.log("Registration submitted:", form);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", justifyContent: "center",
                alignItems: "center", background: "#f6f8fa",
            }}>
                <div style={{
                    background: "white", padding: "40px", width: "420px",
                    borderRadius: "8px", textAlign: "center", border: "1px solid #e5e7eb",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                    <h2 style={{ fontSize: "20px" }}>Registration Submitted</h2>
                    <p style={{ color: "#6b7280", fontSize: "14px", margin: "12px 0 24px" }}>
                        Your account is pending admin approval. You will receive an email once your account is activated.
                    </p>
                    <button className="primary-btn" onClick={() => navigate("/login")}>
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: "100vh", display: "flex", justifyContent: "center",
            alignItems: "center", background: "#f6f8fa", padding: "20px",
        }}>
            <div style={{
                background: "white", padding: "32px", width: "480px",
                borderRadius: "8px", border: "1px solid #e5e7eb",
            }}>
                <h1 style={{ textAlign: "center", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <img src="/vite.svg" alt="Logo" style={{ width: "24px", height: "24px" }} />
                    Register
                </h1>
                <p style={{ textAlign: "center", marginBottom: "24px", color: "#6b7280", fontSize: "14px" }}>
                    Create your Blue Carbon Registry account
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" placeholder="user@organization.org" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Phone (India) *</label>
                        <input type="tel" name="phone" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Organization / Panchayat *</label>
                        <input type="text" name="organization" placeholder="Enter organization name" value={form.organization} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Role Declaration *</label>
                        <select name="role" value={form.role} onChange={handleChange} required>
                            <option value="">Select your role</option>
                            <option value="NGO">NGO</option>
                            <option value="COMMUNITY">Community</option>
                            <option value="PANCHAYAT">Panchayat</option>
                        </select>
                        <small className="helper-text">Admin will assign your final role after verification</small>
                    </div>

                    <div className="form-group">
                        <label>Wallet Address *</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                name="walletAddress"
                                placeholder="Connect wallet to auto-fill"
                                value={form.walletAddress || walletAddress || ""}
                                readOnly
                                style={{ flex: 1 }}
                            />
                            <button type="button" className="secondary-btn" onClick={handleConnectWallet} style={{ whiteSpace: "nowrap" }}>
                                🦊 Connect
                            </button>
                        </div>
                    </div>

                    <button className="primary-btn" type="submit" style={{ width: "100%", marginTop: "12px", padding: "12px" }}>
                        Submit Registration
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
                    Already have an account?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }} style={{ color: "#0f766e", fontWeight: 500 }}>
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Register;
