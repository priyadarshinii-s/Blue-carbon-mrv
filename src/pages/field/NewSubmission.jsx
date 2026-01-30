const NewSubmission = () => {
  const handleSubmit = () => {
    alert("Submission sent for verification");
  };

  return (
    <>
      <h1>New Field Submission</h1>
      <p className="page-subtitle">
        Submit verified plantation data for MRV review
      </p>

      <div className="card form-card">
        <div className="form-group">
          <label>Project</label>
          <select>
            <option>Mangrove Restoration – TN</option>
            <option>Seagrass Revival – Kerala</option>
          </select>
        </div>

        <div className="form-group">
          <label>GPS Location</label>
          <input
            type="text"
            value="Lat: 11.1271, Long: 78.6569"
            disabled
          />
          <small className="helper-text">
            Auto-captured from field device
          </small>
        </div>

        <div className="form-group">
          <label>Tree Count</label>
          <input
            type="number"
            placeholder="Enter number of trees planted"
          />
        </div>

        <div className="form-group">
          <label>Photo Evidence</label>
          <input type="file" multiple disabled />
          <small className="helper-text">
            Image upload enabled in next phase
          </small>
        </div>

        <div className="form-group">
          <label>Field Notes</label>
          <textarea placeholder="Optional field observations" />
        </div>

        <div className="form-actions">
          <button className="primary-btn">
            Submit for Verification
          </button>
        </div>
      </div>
    </>
  );
};

export default NewSubmission;
