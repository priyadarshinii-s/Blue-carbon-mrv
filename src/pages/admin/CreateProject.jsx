import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapComponent from "../../components/shared/MapComponent";
import PhotoUploader from "../../components/shared/PhotoUploader";

const CreateProject = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: "",
    type: "",
    location: "",
    description: "",
    area: "",
    startDate: "",
    endDate: "",
    plannedActivities: [],
    baselineNotes: "",
  });

  const activityOptions = [
    "Mangrove Planting",
    "Seagrass Restoration",
    "Saltmarsh Recovery",
    "Nursery Setup",
    "Hydrological Restoration",
    "Community Training",
    "Biodiversity Survey",
    "Soil Carbon Sampling",
  ];

  const handleChange = (e) => {
    setProject({ ...project, [e.target.name]: e.target.value });
  };

  const toggleActivity = (activity) => {
    setProject((prev) => ({
      ...prev,
      plannedActivities: prev.plannedActivities.includes(activity)
        ? prev.plannedActivities.filter((a) => a !== activity)
        : [...prev.plannedActivities, activity],
    }));
  };

  const handleSave = () => {
    if (!project.name || !project.type || !project.location) {
      alert("Please fill all required fields");
      return;
    }
    console.log("Project saved:", project);
    alert("Project created successfully");
    navigate("/admin/projects");
  };

  return (
    <>
      <h1>Create New Project</h1>
      <p className="page-subtitle">Define a new blue carbon project with all details</p>

      <div className="card form-card wide mt-20">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input type="text" name="name" placeholder="Eg: Mangrove Restoration – Odisha" value={project.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Ecosystem Type *</label>
            <select name="type" value={project.type} onChange={handleChange}>
              <option value="">Select type</option>
              <option value="MANGROVE">Mangrove</option>
              <option value="SEAGRASS">Seagrass</option>
              <option value="SALTMARSH">Salt Marsh</option>
              <option value="TIDAL_FLAT">Tidal Flat</option>
              <option value="COASTAL_WETLAND">Coastal Wetland</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location / State *</label>
            <input type="text" name="location" placeholder="State / Region" value={project.location} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Approximate Area (hectares)</label>
            <input type="number" name="area" placeholder="e.g. 25.5" value={project.area} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value={project.startDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="endDate" value={project.endDate} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" placeholder="Brief project description, goals, and methodology" value={project.description} onChange={handleChange} />
        </div>

        {/* Geofence Map */}
        <div className="form-group">
          <label>Geofence Polygon</label>
          <MapComponent editable={true} showPolygon={true} height="250px" />
          <small className="helper-text">Click on the map to draw a geofence polygon defining the project boundary</small>
        </div>

        {/* Planned Activities */}
        <div className="form-group">
          <label>Planned Activities</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            {activityOptions.map((a) => (
              <button
                key={a}
                type="button"
                className={project.plannedActivities.includes(a) ? "primary-btn" : "secondary-btn"}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => toggleActivity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Baseline Photos */}
        <div className="form-group">
          <PhotoUploader maxFiles={5} label="Baseline Photos / Videos" />
          <small className="helper-text">Upload baseline images before project starts (IPFS)</small>
        </div>

        <div className="form-group">
          <label>Baseline Notes</label>
          <textarea name="baselineNotes" placeholder="Notes about baseline conditions, existing vegetation, soil samples etc." value={project.baselineNotes} onChange={handleChange} />
        </div>

        <div className="form-actions" style={{ display: "flex", gap: "10px" }}>
          <button className="primary-btn" onClick={handleSave}>
            💾 Save Project
          </button>
          <button className="secondary-btn" onClick={() => navigate("/admin/projects")}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateProject;