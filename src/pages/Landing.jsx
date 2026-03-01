import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI, reportsAPI } from "../services/api";

const SLIDES = ["/mangrove.jpg", "/saltmarsh.jpg", "/seagrass.jpg"];
const INTERVAL_MS = 5000;

const Landing = () => {
    const navigate = useNavigate();
    const { openLogin, openRegister, isAuthenticated, logout } = useAuth();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [statsData, setStatsData] = useState({
        projects: 0,
        trees: 0,
        co2: 0,
        credits: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, INTERVAL_MS);

        reportsAPI.getDashboardStats()
            .then(res => {
                const community = res.data.data.community || {};
                setStatsData({
                    projects: community.activeProjects || 0,
                    trees: Math.round((community.totalGlobalCredits || 0) * 0.8),
                    co2: community.totalGlobalCredits || 0,
                    credits: community.totalGlobalCredits || 0
                });
            })
            .catch(err => console.error("Error fetching landing stats:", err));

        return () => clearInterval(timer);
    }, []);

    const stats = [
        { label: "Projects Active", value: statsData.projects.toString(), icon: "🌿" },
        { label: "Trees Planted", value: statsData.trees.toLocaleString(), icon: "🌳" },
        { label: "CO₂ Removed (tCO₂e)", value: statsData.co2.toLocaleString(), icon: "🌍" },
        { label: "Credits Minted", value: statsData.credits.toLocaleString(), icon: "💎" },
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

            <div className="frosted-navbar" style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 40px",
            }}>
                <h1 style={{ fontSize: "20px", margin: 0, color: "white", display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src="/vite.svg" alt="Logo" style={{ width: "24px", height: "24px" }} />
                    Blue Carbon Registry
                </h1>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {!isAuthenticated ? (
                        <>
                            <button
                                className="primary-btn"
                                onClick={openLogin}
                                style={{ background: "#0f766e", fontSize: "14px", padding: "10px 24px", border: "none" }}
                            >
                                Login
                            </button>
                            <button
                                className="primary-btn"
                                onClick={openRegister}
                                style={{ background: "#0f766e", fontSize: "14px", padding: "10px 24px", border: "none" }}
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <button
                            className="primary-btn"
                            style={{ background: "#0f766e", letterSpacing: "0.4px" }}
                            onClick={logout}
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>

            <div style={{
                position: "relative",
                height: "70vh",
                minHeight: "500px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
            }}>
                {SLIDES.map((src, i) => (
                    <div
                        key={src}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: i === currentSlide ? 0.8 : 0,
                            transition: "opacity 1.5s ease-in-out",
                            zIndex: i === currentSlide ? 2 : 1,
                        }}
                    />
                ))}

                <div style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.65) 100%)",
                    pointerEvents: "none",
                }} />

                <div style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 4,
                    opacity: 0.03,
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    pointerEvents: "none",
                }} />

                <div style={{
                    position: "relative",
                    zIndex: 4,
                    textAlign: "center",
                    padding: "0 24px",
                    maxWidth: "780px",
                }}>
                    <h1 style={{
                        fontSize: "clamp(36px, 6vw, 62px)",
                        fontWeight: 900,
                        color: "#ffffff",
                        lineHeight: 1.1,
                        letterSpacing: "-0.5px",
                        marginBottom: "20px",
                        textShadow: "0 2px 16px rgba(0,0,0,0.5)",
                    }}>
                        Blue Carbon Registry
                    </h1>
                    <p style={{
                        fontSize: "clamp(16px, 2.2vw, 20px)",
                        color: "rgba(255,255,255,0.9)",
                        maxWidth: "600px",
                        margin: "0 auto 36px",
                        lineHeight: 1.6,
                        textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                    }}>
                        Transparent MRV for coastal carbon sequestration projects, powered by blockchain.
                    </p>
                    <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                            className="primary-btn"
                            style={{
                                padding: "15px 40px",
                                fontSize: "16px",
                                letterSpacing: "0.4px",
                                background: "#0d9488"
                            }}
                            onClick={isAuthenticated ? () => navigate("/dashboard") : openLogin}
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Explore Registry"}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px", padding: "40px", maxWidth: "1000px", margin: "0 auto",
            }}>
                {stats.map((s) => (
                    <div key={s.label} className="card" style={{ textAlign: "center", borderLeft: "4px solid #0f766e" }}>
                        <div style={{ fontSize: "28px", marginBottom: "6px" }}>{s.icon}</div>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#0f2a44", marginBottom: "4px" }}>{s.value}</p>
                        <h3 style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>{s.label}</h3>
                    </div>
                ))}
            </div>

            <div style={{ padding: "40px 20px 60px", maxWidth: "800px", margin: "0 auto" }}>
                <h2 style={{ textAlign: "center", marginBottom: "32px", fontSize: "24px" }}>How It Works</h2>
                {steps.map((s) => (
                    <div key={s.step} style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
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

            <div style={{ background: "#0f2a44", color: "#cfd8e3", textAlign: "center", padding: "20px", fontSize: "13px" }}>
                Blue Carbon Registry v1.0
            </div>
        </div>
    );
};

export default Landing;
