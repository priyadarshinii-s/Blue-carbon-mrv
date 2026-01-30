const Reports = () => {
  return (
    <>
      <h1>Reports & Audits</h1>

      <button className="secondary-btn">Export CSV</button>
      <button className="secondary-btn">Export PDF</button>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Year</th>
            <th>Credits</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>2025</td>
            <td>120</td>
            <td>Minted</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default Reports;
