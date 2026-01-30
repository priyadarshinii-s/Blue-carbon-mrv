const UserManagement = () => {
  return (
    <>
      <h1>User Management</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Arun Kumar</td>
            <td>Coastal NGO</td>
            <td>Pending</td>
            <td>
              <select>
                <option>Assign Role</option>
                <option>Field Officer</option>
                <option>Validator</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default UserManagement;
