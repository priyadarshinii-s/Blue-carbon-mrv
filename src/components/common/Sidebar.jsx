import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ items }) => {
    const { logout } = useAuth();

    return (
        <aside className="sidebar">
            <h2 className="logo">🌊 Blue Carbon MRV</h2>

            <nav>
                {items.map((item) => (
                    <NavLink key={item.path} to={item.path}>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: "auto" }}>
                <button className="logout-link" onClick={logout}>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
