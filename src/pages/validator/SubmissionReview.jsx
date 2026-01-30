import { useParams } from "react-router-dom";

const SubmissionReview = () => {
  const { id } = useParams();

  return (
    <>
      <h1>Submission Review</h1>
      <p>Submission ID: {id}</p>

      <div className="card mt-20">
        <h3>Project Details</h3>
        <p><strong>Project:</strong> Mangrove Restoration – TN</p>
        <p><strong>Field Officer:</strong> Arun Kumar</p>
        <p><strong>Date:</strong> 12 Aug 2025</p>
        <p><strong>Trees Reported:</strong> 350</p>
      </div>

      <div className="card mt-20">
        <h3>Location</h3>
        <p>📍 GPS Coordinates (Map Placeholder)</p>
        <div
          style={{
            height: "180px",
            background: "#e5e7eb",
            borderRadius: "6px",
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
          }}
        >
          Map will be displayed here
        </div>
      </div>

      <div className="card mt-20">
        <h3>Photo Evidence</h3>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <div className="card" style={{ width: "100px", height: "80px" }}>
            Photo 1
          </div>
          <div className="card" style={{ width: "100px", height: "80px" }}>
            Photo 2
          </div>
          <div className="card" style={{ width: "100px", height: "80px" }}>
            Photo 3
          </div>
        </div>
      </div>

      <div className="card mt-20">
        <h3>Validator Decision</h3>
        <textarea placeholder="Add comments (optional)" />

        <div className="mt-20">
          <button className="primary-btn">Approve</button>
          <button className="secondary-btn" style={{ marginLeft: "10px" }}>
            Request Correction
          </button>
          <button className="secondary-btn" style={{ marginLeft: "10px" }}>
            Reject
          </button>
        </div>
      </div>
    </>
  );
};

export default SubmissionReview;
