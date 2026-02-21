const StatusBadge = ({ status }) => {
    const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
    return <span className={`badge ${normalized}`}>{status}</span>;
};

export default StatusBadge;
