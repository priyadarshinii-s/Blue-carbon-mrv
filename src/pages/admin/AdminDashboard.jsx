// import "./dashboard.css";

const AdminDashboard = () => {
  return (
    <>
      <h1>Admin Dashboard</h1>
      <p className="subtitle">
        Overview of projects, submissions and carbon credits
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Total Projects</h3>
          <p>12</p>
        </div>

        <div className="card">
          <h3>Pending Submissions</h3>
          <p>8</p>
        </div>

        <div className="card">
          <h3>Verified CO₂ (t)</h3>
          <p>245.6</p>
        </div>

        <div className="card">
          <h3>Credits Minted</h3>
          <p>240</p>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
