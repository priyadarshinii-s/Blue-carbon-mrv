import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AuthModal = () => {
    const {
        isAuthModalOpen, authModalMode, closeAuthModal, setAuthModalMode,
        login, connectWallet, walletAddress
    } = useAuth();
    const navigate = useNavigate();

    const [connecting, setConnecting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        fullName: "", email: "", phone: "", organization: "", walletAddress: "", role: "",
    });

    const demoUsers = {
        ADMIN: { role: "ADMIN", email: "admin@nccr.gov.in", name: "Rajesh Kumar", walletAddress: "0x7a3B…9f2E" },
        FIELD: { role: "FIELD", email: "field@ngo.org", name: "Arun Kumar", walletAddress: "0x8b4C…3a4B" },
        VALIDATOR: { role: "VALIDATOR", email: "validator@nccr.gov.in", name: "Priya Sharma", walletAddress: "0x9c5D…4a5C" },
        VIEWER: { role: "VIEWER", email: "community@ngo.org", name: "Meera Patel", walletAddress: "0x0d6E…5a6D" },
    };

    useEffect(() => {
        if (isAuthModalOpen) {
            document.body.style.overflow = "hidden";
            setSubmitted(false);
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isAuthModalOpen]);

    if (!isAuthModalOpen) return null;

    const handleLogin = (role) => {
        login(demoUsers[role]);
        closeAuthModal();
        const paths = { ADMIN: "/admin/dashboard", FIELD: "/field/dashboard", VALIDATOR: "/validator/dashboard", VIEWER: "/user/dashboard" };
        navigate(paths[role] || "/");
    };

    const handleWalletConnect = () => {
        setConnecting(true);
        setTimeout(() => { setConnecting(false); handleLogin("ADMIN"); }, 2000);
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleConnectWallet = () => setForm({ ...form, walletAddress: connectWallet() });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.phone || !form.organization || !form.role) {
            alert("Please fill all required fields"); return;
        }
        if (!form.walletAddress && !walletAddress) {
            alert("Please connect your wallet"); return;
        }
        setSubmitted(true);
    };

    return (
        <div className="modal-overlay" onClick={closeAuthModal}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>

                <button onClick={closeAuthModal} style={{
                    position: "absolute", top: "14px", right: "14px",
                    background: "#f1f3f5", border: "none", color: "#6b7280",
                    width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
                }}>&times;</button>

                {submitted ? (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
                        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>Registration Submitted</h2>
                        <p style={{ color: "#6b7280", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                            Your application has been received.<br />An admin will review and assign your role shortly.
                        </p>
                        <button onClick={closeAuthModal} style={{
                            width: "100%", padding: "12px", background: "#0f766e", color: "white",
                            border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                        }}>Done</button>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <div style={{
                                width: "44px", height: "44px", background: "#f0fdf9", borderRadius: "12px",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "14px", border: "1px solid #d1fae5",
                            }}>
                                <img src="/vite.svg" alt="Logo" style={{ width: "24px", height: "24px" }} />
                            </div>
                            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
                                {authModalMode === "LOGIN" ? "Welcome Back" : "Create an Account"}
                            </h1>
                            <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                                {authModalMode === "LOGIN"
                                    ? "Sign in to your MRV dashboard"
                                    : "Register to join the Blue Carbon ecosystem"}
                            </p>
                        </div>

                        {authModalMode === "LOGIN" ? (
                            <div>
                                <button onClick={handleWalletConnect} disabled={connecting} style={{
                                    width: "100%", padding: "12px", marginBottom: "12px",
                                    background: "#0f766e", color: "white",
                                    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                }}>
                                    {connecting ? "Connecting…" : <><span>🦊</span>Connect MetaMask</>}
                                </button>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
                                    <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                                    <span style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>Demo access</span>
                                    <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                    {[
                                        { id: "ADMIN", label: "NCCR Admin"},
                                        { id: "FIELD", label: "Field Officer"},
                                        { id: "VALIDATOR", label: "Validator"},
                                        { id: "VIEWER", label: "Community"}
                                    ].map(d => (
                                        <button key={d.id} onClick={() => handleLogin(d.id)} style={{
                                            background: "#f9fafb", color: "#374151",
                                            border: "1.5px solid #e5e7eb", padding: "10px 8px",
                                            borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                            transition: "all 0.15s",
                                        }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                                        >
                                        {d.label}
                                        </button>
                                    ))}
                                </div>

                                <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#9ca3af" }}>
                                    Don't have an account?{" "}
                                    <button onClick={() => setAuthModalMode("REGISTER")} style={{
                                        background: "none", border: "none", color: "#0f766e", fontWeight: 600,
                                        cursor: "pointer", padding: 0, fontSize: "13px",
                                    }}>Register</button>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Full Name</label>
                                        <input type="text" name="fullName" placeholder="Arun Kumar"
                                            value={form.fullName} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Email</label>
                                        <input type="email" name="email" placeholder="arun@ngo.org"
                                            value={form.email} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div style={{ height: "12px" }} />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Phone</label>
                                        <input type="tel" name="phone" placeholder="+91 98765 43210"
                                            value={form.phone} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Organization</label>
                                        <input type="text" name="organization" placeholder="Sundarbans NGO"
                                            value={form.organization} onChange={handleChange} required />
                                    </div>
                                </div>

                                <div style={{ height: "12px" }} />

                                <div className="form-group">
                                    <label>Primary Role</label>
                                    <select name="role" value={form.role} onChange={handleChange} required>
                                        <option value="">Select a role…</option>
                                        <option value="NGO">Non-Governmental Org</option>
                                        <option value="COMMUNITY">Local Community</option>
                                        <option value="PANCHAYAT">Gram Panchayat</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ marginBottom: "20px" }}>
                                    <label>Wallet Address</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <input type="text" value={walletAddress || form.walletAddress || ""} readOnly
                                            placeholder="Not connected" style={{ flex: 1, fontFamily: "monospace" }} />
                                        <button type="button" onClick={handleConnectWallet} style={{
                                            background: "#0f766e", border: "none", color: "white",
                                            padding: "0 16px", borderRadius: "8px", fontWeight: 600,
                                            fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap",
                                        }}>Connect</button>
                                    </div>
                                </div>

                                <button type="submit" style={{
                                    width: "100%", padding: "12px", background: "#0f766e", color: "white",
                                    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                                }}>Submit Registration</button>

                                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#9ca3af" }}>
                                    Already have an account?{" "}
                                    <button type="button" onClick={() => setAuthModalMode("LOGIN")} style={{
                                        background: "none", border: "none", color: "#0f766e", fontWeight: 600,
                                        cursor: "pointer", padding: 0, fontSize: "13px",
                                    }}>Log in</button>
                                </p>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
