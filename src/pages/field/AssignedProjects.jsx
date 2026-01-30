const AssignedProjects = () => {
  return (
    <>
      <h1>Assigned Projects</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>Tamil Nadu</td>
            <td>Active</td>
          </tr>
          <tr>
            <td>Seagrass Revival – Kerala</td>
            <td>Kerala</td>
            <td>Active</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default AssignedProjects;
