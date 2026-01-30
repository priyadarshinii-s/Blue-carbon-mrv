import { useNavigate } from "react-router-dom";

const ProjectManagement = () => {
  const navigate = useNavigate(); // ✅ THIS WAS MISSING

  return (
    <>
      <h1>Project Management</h1>

      <button
        className="primary-btn"
        onClick={() => navigate("/admin/projects/create")}
      >
        Create New Project
      </button>

      <table className="table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Credits</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Mangrove Restoration – TN</td>
            <td>Mangrove</td>
            <td>Active</td>
            <td>120</td>
          </tr>

          <tr>
            <td>Seagrass Revival – Kerala</td>
            <td>Seagrass</td>
            <td>Pending</td>
            <td>–</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default ProjectManagement;
