import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";

const AuthModal = () => {
    const {
        isAuthModalOpen, authModalMode, closeAuthModal, setAuthModalMode,
        login, loginWithToken, connectWallet, walletAddress, signMessage
    } = useAuth();
    const navigate = useNavigate();

    const [connecting, setConnecting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        fullName: "", email: "", phone: "", organization: "", walletAddress: "", role: "",
    });

    const demoUsers = {
        ADMIN: { role: "ADMIN", email: "admin@nccr.gov.in", name: "Rajesh Kumar", walletAddress: "0x7a3B9f2E0000000000000000000000000000002E" },
        FIELD: { role: "FIELD", email: "field@ngo.org", name: "Arun Kumar", walletAddress: "0x8b4C3a4B00000000000000000000000000004B00" },
        VALIDATOR: { role: "VALIDATOR", email: "validator@nccr.gov.in", name: "Priya Sharma", walletAddress: "0x9c5D4a5C00000000000000000000000000005C00" },
        VIEWER: { role: "VIEWER", email: "community@ngo.org", name: "Meera Patel", walletAddress: "0x0d6E5a6D00000000000000000000000000006D00" },
    };

    useEffect(() => {
        if (isAuthModalOpen) {
            document.body.style.overflow = "hidden";
            setSubmitted(false);
            setError("");
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isAuthModalOpen]);

    if (!isAuthModalOpen) return null;

    const navigateByRole = (role) => {
        const paths = {
            ADMIN: "/admin/dashboard",
            FIELD: "/field/dashboard",
            FIELD_OFFICER: "/field/dashboard",
            VALIDATOR: "/validator/dashboard",
            VIEWER: "/user/dashboard",
            USER: "/user/dashboard",
        };
        navigate(paths[role] || "/user/dashboard");
    };

    const handleWalletConnect = async () => {
        setConnecting(true);
        setError("");
        try {
            const addr = await connectWallet();
            if (!addr) { setConnecting(false); return; }

            const { message, signature } = await signMessage(addr);

            const res = await authAPI.loginWallet(addr, signature, message);
            const { user, token } = res.data.data;
            loginWithToken(user, token);
            closeAuthModal();
            navigateByRole(user.role);
        } catch (err) {
            const msg = err.response?.data?.error?.message || err.message;
            if (msg.includes("not registered") || err.response?.status === 404) {
                setError("Wallet not registered. Please register first.");
            } else {
                setError(msg || "Login failed. Try again.");
            }
        } finally {
            setConnecting(false);
        }
    };

    const handleDemoLogin = async (roleKey) => {
        setConnecting(true);
        setError("");
        try {
            const res = await authAPI.loginDemo(roleKey);
            const { user, token } = res.data.data;
            loginWithToken(user, token);
            closeAuthModal();
            navigateByRole(user.role);
        } catch (err) {
            console.error("Demo login failed:", err);
            setError("Demo login currently unavailable. Backend may be down.");
        } finally {
            setConnecting(false);
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleConnectWallet = async () => {
        const addr = await connectWallet();
        if (addr) setForm({ ...form, walletAddress: addr });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.fullName || !form.email || !form.phone || !form.organization || !form.role) {
            alert("Please fill all required fields"); return;
        }
        const wallet = form.walletAddress || walletAddress;
        if (!wallet) {
            alert("Please connect your wallet"); return;
        }

        try {
            await authAPI.register({
                walletAddress: wallet,
                userName: form.fullName,
                email: form.email,
                phone: form.phone,
                organization: form.organization,
            });
            setSubmitted(true);
        } catch (err) {
            const msg = err.response?.data?.error?.message || "Registration failed";
            setError(msg);
        }
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

                        {error && (
                            <div style={{
                                background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
                                padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px",
                            }}>
                                {error}
                            </div>
                        )}

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
                                        { id: "ADMIN", label: "NCCR Admin" },
                                        { id: "FIELD", label: "Field Officer" },
                                        { id: "VALIDATOR", label: "Validator" },
                                        { id: "VIEWER", label: "Community" }
                                    ].map(d => (
                                        <button key={d.id} onClick={() => handleDemoLogin(d.id)} style={{
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
