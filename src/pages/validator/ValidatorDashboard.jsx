const ValidatorDashboard = () => {
  return (
    <>
      <h1>Validator Dashboard</h1>
      <p>Overview of pending verifications</p>

      <div className="card-grid">
        <div className="card">
          <h3>Pending Submissions</h3>
          <p>6</p>
        </div>

        <div className="card">
          <h3>Approved</h3>
          <p>18</p>
        </div>

        <div className="card">
          <h3>Rejected</h3>
          <p>2</p>
        </div>
      </div>
    </>
  );
};

export default ValidatorDashboard;
