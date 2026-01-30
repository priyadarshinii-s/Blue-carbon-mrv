const ViewerProjects = () => {
  return (
    <>
      <h1>Verified Projects</h1>
      <p>Read-only access to validated project data</p>

      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Location</th>
            <th>Trees Verified</th>
            <th>CO₂ Removed (t)</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>Tamil Nadu</td>
            <td>12,300</td>
            <td>4,500</td>
            <td><span className="badge approved">Verified</span></td>
          </tr>
          <tr>
            <td>Seagrass Revival – Kerala</td>
            <td>Kerala</td>
            <td>6,150</td>
            <td>2,220</td>
            <td><span className="badge approved">Verified</span></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default ViewerProjects;
