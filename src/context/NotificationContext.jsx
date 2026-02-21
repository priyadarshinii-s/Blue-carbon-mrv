import { createContext, useContext, useState } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([
        { id: 1, message: "Submission #24 pending review", read: false, time: "5 min ago" },
        { id: 2, message: "Credits minted for Mangrove TN", read: false, time: "1 hour ago" },
        { id: 3, message: "New user registration: Neha Gupta", read: true, time: "2 hours ago" },
    ]);

    const markRead = (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const addNotification = (message) => {
        setNotifications((prev) => [
            { id: Date.now(), message, read: false, time: "now" },
            ...prev,
        ]);
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
    return ctx;
};

export default NotificationContext;
