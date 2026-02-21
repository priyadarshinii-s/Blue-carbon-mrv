import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";

const NotificationBell = () => {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: "relative", background: "none", border: "none",
                    cursor: "pointer", fontSize: "18px", padding: "4px",
                }}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute", top: "-2px", right: "-2px",
                        background: "#b91c1c", color: "white",
                        borderRadius: "50%", width: "16px", height: "16px",
                        fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700,
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
                    <div className="notif-dropdown" style={{ zIndex: 100 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
                            <strong style={{ fontSize: "13px" }}>Notifications</strong>
                            <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#0f766e" }}>
                                Mark all read
                            </button>
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "#9ca3af" }}>
                                No notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    style={{
                                        padding: "10px 14px", cursor: "pointer",
                                        background: n.read ? "transparent" : "#f0f9ff",
                                        borderBottom: "1px solid #f3f4f6",
                                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "13px" }}>{n.message}</div>
                                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{n.time}</div>
                                    </div>
                                    {!n.read && (
                                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0f766e", flexShrink: 0, marginTop: "4px" }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
