import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ items }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <aside className="sidebar">
            <h2
                className="logo"
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                onClick={() => navigate("/")}
                title="Go to Landing Page"
            >
                <img src="/vite.svg" alt="Logo" style={{ width: "28px", height: "28px" }} />
                Blue Carbon MRV
            </h2>

            <nav>
                {items.map((item) => (
                    <NavLink key={item.path} to={item.path}>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: "auto", letterSpacing: "0.4px" }}>
                <button
                    className="logout-link"
                    onClick={logout}
                    style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
