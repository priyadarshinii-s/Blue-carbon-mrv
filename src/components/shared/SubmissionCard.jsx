import StatusBadge from "./StatusBadge";

const SubmissionCard = ({ submission, onClick }) => {
    return (
        <div className="card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h3 style={{ fontSize: "15px", marginBottom: "6px" }}>{submission.project}</h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0" }}>
                        {submission.date}
                    </p>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0" }}>
                        Trees: {submission.treeCount}
                    </p>
                    {submission.fieldOfficer && (
                        <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0" }}>
                            {submission.fieldOfficer}
                        </p>
                    )}
                </div>
                <StatusBadge status={submission.status} />
            </div>
        </div>
    );
};

export default SubmissionCard;
