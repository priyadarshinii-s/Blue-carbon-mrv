const ViewerDashboard = () => {
  return (
    <>
      <h1>Community Impact Dashboard</h1>
      <p>Public view of verified blue carbon initiatives</p>

      <div className="card-grid">
        <div className="card">
          <h3>Total Trees Verified</h3>
          <p>18,450</p>
        </div>

        <div className="card">
          <h3>CO₂ Removed (tons)</h3>
          <p>6,720</p>
        </div>

        <div className="card">
          <h3>Carbon Credits Issued</h3>
          <p>6,720</p>
        </div>
      </div>
    </>
  );
};

export default ViewerDashboard;
