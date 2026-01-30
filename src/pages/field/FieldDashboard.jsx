const FieldDashboard = () => {
  return (
    <>
      <h1>Field Officer Dashboard</h1>
      <p>Your assigned projects & submission status</p>

      <div className="card-grid">
        <div className="card">
          <h3>Assigned Projects</h3>
          <p>3</p>
        </div>

        <div className="card">
          <h3>Pending Submissions</h3>
          <p>2</p>
        </div>

        <div className="card">
          <h3>Approved</h3>
          <p>5</p>
        </div>
      </div>
    </>
  );
};

export default FieldDashboard;
