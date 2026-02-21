import { useNavigate } from "react-router-dom";

const Landing = () => {
    const navigate = useNavigate();

    const stats = [
        { label: "Projects Active", value: "24", icon: "🌿" },
        { label: "Trees Planted", value: "18,450", icon: "🌳" },
        { label: "CO₂ Removed (tCO₂e)", value: "6,720", icon: "🌍" },
        { label: "Credits Minted", value: "6,500", icon: "💎" },
    ];

    const steps = [
        { step: "1", title: "Register & Connect Wallet", desc: "Create your account and connect MetaMask to the Polygon network." },
        { step: "2", title: "Create or Get Assigned Project", desc: "NGOs create blue carbon projects. Field officers get assigned for data collection." },
        { step: "3", title: "Submit Field Data", desc: "Field officers submit GPS-tagged photos, tree counts, and site conditions." },
        { step: "4", title: "Verification", desc: "Independent validators review submissions with photo evidence and GPS data." },
        { step: "5", title: "Mint Carbon Credits", desc: "Admin approves minting of tokenized carbon credits on blockchain." },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#f6f8fa" }}>
            {/* Top Bar */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 40px", background: "#0f2a44", color: "white",
            }}>
                <h1 style={{ fontSize: "20px", margin: 0, color: "white" }}>🌊 BlueCarbon MRV</h1>
                <button
                    className="primary-btn"
                    style={{ background: "#0f766e" }}
                    onClick={() => navigate("/login")}
                >
                    Launch App
                </button>
            </div>

            {/* Hero Section */}
            <div style={{
                textAlign: "center", padding: "80px 20px 60px",
                background: "linear-gradient(135deg, #0f2a44 0%, #164e63 100%)",
                color: "white",
            }}>
                <h1 style={{ fontSize: "36px", margin: "0 0 16px", color: "white" }}>
                    Blockchain-Powered Blue Carbon MRV Registry
                </h1>
                <p style={{ fontSize: "18px", color: "#cfd8e3", maxWidth: "700px", margin: "0 auto 32px" }}>
                    Transparent monitoring, reporting, and verification of coastal carbon sequestration projects.
                    Powered by Polygon blockchain for immutable trust.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button className="primary-btn" style={{ padding: "14px 32px", fontSize: "16px", background: "#0f766e" }} onClick={() => navigate("/login")}>
                        Get Started
                    </button>
                    <button className="secondary-btn" style={{ padding: "14px 32px", fontSize: "16px" }} onClick={() => navigate("/register")}>
                        Register
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px", padding: "40px", maxWidth: "1000px", margin: "0 auto",
            }}>
                {stats.map((s) => (
                    <div key={s.label} className="card" style={{ textAlign: "center", borderLeft: "4px solid #0f766e" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>{s.icon}</div>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a" }}>{s.value}</p>
                        <h3 style={{ fontSize: "13px", color: "#6b7280" }}>{s.label}</h3>
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "32px", fontSize: "24px" }}>How It Works</h2>
                {steps.map((s) => (
                    <div key={s.step} style={{
                        display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start",
                    }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: "#0f2a44", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "bold", fontSize: "14px", flexShrink: 0,
                        }}>
                            {s.step}
                        </div>
                        <div>
                            <strong style={{ fontSize: "15px" }}>{s.title}</strong>
                            <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0" }}>{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Public Project Map */}
            <div style={{ padding: "0 40px 60px", maxWidth: "1000px", margin: "0 auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: "24px" }}>Active Projects Map</h2>
                <div style={{
                    height: "300px", background: "#e8f0f8", borderRadius: "8px",
                    border: "1px solid #d1d5db", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#6b7280", position: "relative", overflow: "hidden",
                }}>
                    <div style={{
                        position: "absolute", inset: 0, opacity: 0.1,
                        backgroundImage: "linear-gradient(#0f2a44 1px, transparent 1px), linear-gradient(90deg, #0f2a44 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                    }} />
                    <div style={{ textAlign: "center", zIndex: 1 }}>
                        <span style={{ fontSize: "48px" }}>🗺️</span>
                        <p style={{ marginTop: "8px", fontSize: "14px" }}>Public project map – 24 active projects across India</p>
                        <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "12px", fontSize: "13px" }}>
                            <span>📍 Tamil Nadu (8)</span>
                            <span>📍 Kerala (5)</span>
                            <span>📍 Odisha (4)</span>
                            <span>📍 Gujarat (4)</span>
                            <span>📍 West Bengal (3)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                background: "#0f2a44", color: "#cfd8e3", textAlign: "center",
                padding: "20px", fontSize: "13px",
            }}>
                BlueCarbon MRV Registry v1.0 | Powered by Polygon Blockchain |{" "}
                <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0f766e" }}>
                    Explorer
                </a>
            </div>
        </div>
    );
};

export default Landing;
