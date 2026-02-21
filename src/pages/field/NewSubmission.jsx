import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PhotoUploader from "../../components/shared/PhotoUploader";
import MapComponent from "../../components/shared/MapComponent";

const projects = [
  { id: "1", name: "Mangrove Restoration – TN" },
  { id: "2", name: "Seagrass Revival – Kerala" },
  { id: "3", name: "Saltmarsh Recovery – Gujarat" },
];

const activityOptions = [
  "Sapling Planting",
  "Seedling Distribution",
  "Hydrological Restoration",
  "Soil Sampling",
  "Community Training",
  "Nursery Maintenance",
  "Fencing & Protection",
  "Biodiversity Survey",
];

const NewSubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [form, setForm] = useState({
    projectId: preselectedProject,
    dateOfVisit: new Date().toISOString().split("T")[0],
    gpsLat: "",
    gpsLng: "",
    treeCount: "",
    survivalRate: "",
    siteCondition: {
      vegetationDensity: "",
      salinity: "",
      pH: "",
      floodingLevel: "",
    },
    restorationActivities: [],
    carbonSamplingNotes: "",
    fieldNotes: "",
  });

  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSiteConditionChange = (e) => {
    setForm({
      ...form,
      siteCondition: { ...form.siteCondition, [e.target.name]: e.target.value },
    });
  };

  const toggleActivity = (activity) => {
    setForm((prev) => ({
      ...prev,
      restorationActivities: prev.restorationActivities.includes(activity)
        ? prev.restorationActivities.filter((a) => a !== activity)
        : [...prev.restorationActivities, activity],
    }));
  };

  const captureGPS = () => {
    setGpsLoading(true);

    setTimeout(() => {
      setForm((prev) => ({ ...prev, gpsLat: "11.1271", gpsLng: "78.6569" }));
      setGpsLoading(false);
    }, 1500);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.projectId) newErrors.projectId = "Select a project";
    if (!form.treeCount) newErrors.treeCount = "Tree count is required";
    if (!form.gpsLat || !form.gpsLng) newErrors.gps = "GPS location is required";
    if (photos.length < 3) newErrors.photos = "At least 3 photos are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    console.log("Draft saved:", form);
    alert("Draft saved locally");
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    console.log("Submitted:", form, photos);
    alert("Submission sent for verification! IPFS hashes would be generated and metadata written to SubmissionRegistry.");
    navigate("/field/history");
  };

  return (
    <>
      <h1>New Field Submission</h1>
      <p className="page-subtitle">Submit verified plantation data for MRV review</p>

      <div className="card form-card wide mt-20">

        <div className="form-group">
          <label>Project *</label>
          <select name="projectId" value={form.projectId} onChange={handleChange}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.projectId && <small style={{ color: "#b91c1c" }}>{errors.projectId}</small>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          <div className="form-group">
            <label>Date of Visit</label>
            <input type="date" name="dateOfVisit" value={form.dateOfVisit} onChange={handleChange} />
          </div>


          <div className="form-group">
            <label>Number of Surviving Saplings/Trees *</label>
            <input type="number" name="treeCount" placeholder="Enter count" value={form.treeCount} onChange={handleChange} min="0" />
            {errors.treeCount && <small style={{ color: "#b91c1c" }}>{errors.treeCount}</small>}
          </div>
        </div>


        <div className="form-group">
          <label>GPS Location *</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <input type="text" name="gpsLat" placeholder="Latitude" value={form.gpsLat} onChange={handleChange} style={{ flex: 1 }} />
            <input type="text" name="gpsLng" placeholder="Longitude" value={form.gpsLng} onChange={handleChange} style={{ flex: 1 }} />
            <button type="button" className="primary-btn" onClick={captureGPS} disabled={gpsLoading} style={{ whiteSpace: "nowrap" }}>
              {gpsLoading ? "⏳ Capturing..." : "📍 Use Current Location"}
            </button>
          </div>
          {errors.gps && <small style={{ color: "#b91c1c" }}>{errors.gps}</small>}
          <small className="helper-text">Auto-captured from field device or enter manually</small>
        </div>


        <div className="form-group">
          <MapComponent
            pins={form.gpsLat ? [{ lat: parseFloat(form.gpsLat), lng: parseFloat(form.gpsLng) }] : []}
            height="200px"
          />
        </div>


        <div className="form-group">
          <label>Survival Rate (%)</label>
          <input type="number" name="survivalRate" placeholder="e.g. 85" min="0" max="100" value={form.survivalRate} onChange={handleChange} />
        </div>


        <div className="form-group">
          <PhotoUploader maxFiles={5} label="Photo Evidence (min 3 required)" onFilesChange={setPhotos} />
          {errors.photos && <small style={{ color: "#b91c1c" }}>{errors.photos}</small>}
        </div>


        <div className="form-group">
          <label style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Site Condition Assessment</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label>Vegetation Density</label>
              <select name="vegetationDensity" value={form.siteCondition.vegetationDensity} onChange={handleSiteConditionChange}>
                <option value="">Select</option>
                <option value="sparse">Sparse (&lt;30%)</option>
                <option value="moderate">Moderate (30-70%)</option>
                <option value="dense">Dense (&gt;70%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Salinity (ppt)</label>
              <input type="number" name="salinity" placeholder="e.g. 25" value={form.siteCondition.salinity} onChange={handleSiteConditionChange} />
            </div>
            <div className="form-group">
              <label>pH</label>
              <input type="number" name="pH" placeholder="e.g. 7.2" step="0.1" value={form.siteCondition.pH} onChange={handleSiteConditionChange} />
            </div>
            <div className="form-group">
              <label>Flooding Level</label>
              <select name="floodingLevel" value={form.siteCondition.floodingLevel} onChange={handleSiteConditionChange}>
                <option value="">Select</option>
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High / Tidal</option>
              </select>
            </div>
          </div>
        </div>


        <div className="form-group">
          <label>Restoration Activities Completed</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            {activityOptions.map((a) => (
              <button
                key={a}
                type="button"
                className={form.restorationActivities.includes(a) ? "primary-btn" : "secondary-btn"}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => toggleActivity(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>


        <div className="form-group">
          <label>Carbon Sampling Notes</label>
          <textarea name="carbonSamplingNotes" placeholder="Notes about soil carbon samples, methodology, measurements..." value={form.carbonSamplingNotes} onChange={handleChange} />
        </div>


        <div className="form-group">
          <label>Additional Field Notes</label>
          <textarea name="fieldNotes" placeholder="Optional observations, weather conditions, wildlife sightings..." value={form.fieldNotes} onChange={handleChange} />
        </div>


        <div className="form-actions" style={{ display: "flex", gap: "10px" }}>
          <button className="primary-btn" onClick={handleSubmit} style={{ padding: "12px 24px" }}>
            Submit for Verification
          </button>
          <button className="secondary-btn" onClick={handleSaveDraft} style={{ padding: "12px 24px" }}>
            Save Draft
          </button>
        </div>
      </div>
    </>
  );
};

export default NewSubmission;
