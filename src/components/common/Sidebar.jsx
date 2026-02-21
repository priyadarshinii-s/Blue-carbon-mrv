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
                <button className="logout-link" onClick={logout}>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
