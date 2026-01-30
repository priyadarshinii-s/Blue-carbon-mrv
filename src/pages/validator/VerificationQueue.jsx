import { useNavigate } from "react-router-dom";

const VerificationQueue = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Verification Queue</h1>
      <p>Submissions awaiting verification</p>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Date</th>
            <th>Trees</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>12 Aug 2025</td>
            <td>350</td>
            <td>
              <button
                className="primary-btn"
                onClick={() => navigate("/validator/review/1")}
              >
                Review
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="empty-state">
            No submissions pending verification.
      </p>
    </>
  );
};

export default VerificationQueue;
