const SubmissionHistory = () => {
  return (
    <>
      <h1>Submission History</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>12 Aug 2025</td>
            <td>Pending</td>
          </tr>
          <tr>
            <td>Seagrass Revival – Kerala</td>
            <td>08 Aug 2025</td>
            <td>Approved</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default SubmissionHistory;
