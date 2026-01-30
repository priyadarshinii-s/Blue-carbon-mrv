const MintApproval = () => {
  return (
    <>
      <h1>Mint Approval</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Trees Verified</th>
            <th>CO₂ (t)</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>800</td>
            <td>24</td>
            <td>
              <button className="primary-btn">Approve Mint</button>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default MintApproval;
