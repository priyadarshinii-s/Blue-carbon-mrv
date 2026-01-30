const VerificationHistory = () => {
  return (
    <>
      <h1>Verification History</h1>

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
            <td>10 Aug 2025</td>
            <td>Approved</td>
          </tr>
          <tr>
            <td>Seagrass Revival – Kerala</td>
            <td>05 Aug 2025</td>
            <td>Rejected</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default VerificationHistory;
