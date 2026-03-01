import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PhotoUploader from "../../components/shared/PhotoUploader";
import MapComponent from "../../components/shared/MapComponent";
import { submissionsAPI, projectsAPI } from "../../services/api";

const TYPE_CONFIG = {
  MANGROVE: {
    activities: [
      "Sapling Planting", "Nursery Maintenance", "Hydrological Restoration",
      "Soil Sampling", "Community Training", "Fencing & Protection", "Biodiversity Survey"
    ],
    primaryMetric: { label: "Number of Surviving Saplings/Trees", name: "treeCount", type: "number", placeholder: "Enter count", required: true },
    secondaryMetric: { label: "Survival Rate (%)", name: "survivalRate", type: "number", min: 0, max: 100, placeholder: "e.g. 85" },
    siteConditions: [
      { label: "Vegetation Density", name: "vegetationDensity", type: "select", options: ["Sparse (<30%)", "Moderate (30-70%)", "Dense (>70%)"] },
      { label: "Salinity (ppt)", name: "salinity", type: "number", placeholder: "e.g. 25" },
      { label: "pH", name: "pH", type: "number", placeholder: "e.g. 7.2", step: "0.1" },
      { label: "Flooding Level", name: "floodingLevel", type: "select", options: ["None", "Low", "Moderate", "High / Tidal"] },
    ]
  },
  SEAGRASS: {
    activities: [
      "Seed/Shoot Transplants", "Buoy Installation", "Water Quality Monitoring",
      "Sediment Coring", "Diver Survey", "Macroalgae Clearing"
    ],
    primaryMetric: { label: "Shoot Density (shoots/m²)", name: "shootDensity", type: "number", placeholder: "e.g. 150", required: true },
    secondaryMetric: { label: "Coverage Area (%)", name: "coverageArea", type: "number", min: 0, max: 100, placeholder: "e.g. 45" },
    siteConditions: [
      { label: "Water Depth (m)", name: "waterDepth", type: "number", placeholder: "e.g. 2.5", step: "0.1" },
      { label: "Turbidity (NTU)", name: "turbidity", type: "number", placeholder: "e.g. 15" },
      { label: "Salinity (ppt)", name: "salinity", type: "number", placeholder: "e.g. 35" },
      { label: "Epiphyte Load", name: "epiphyteLoad", type: "select", options: ["Low", "Medium", "High"] },
    ]
  },
  SALTMARSH: {
    activities: [
      "Seed Sowing", "Invasive Species Removal", "Fencing & Protection",
      "Elevation Grading", "Tidal Channel Excavation", "Soil Carbon Sampling"
    ],
    primaryMetric: { label: "Grass Coverage (%)", name: "grassCoverage", type: "number", min: 0, max: 100, placeholder: "e.g. 60", required: true },
    secondaryMetric: { label: "Survival Rate (%)", name: "survivalRate", type: "number", min: 0, max: 100, placeholder: "e.g. 80" },
    siteConditions: [
      { label: "Elevation (m MSL)", name: "elevation", type: "number", placeholder: "e.g. 0.5", step: "0.1" },
      { label: "Inundation Frequency", name: "inundationFrequency", type: "select", options: ["Daily", "Spring Tides Only", "Storm Events Only", "Rare"] },
      { label: "Soil pH", name: "pH", type: "number", placeholder: "e.g. 6.8", step: "0.1" },
      { label: "Soil Compaction", name: "compaction", type: "select", options: ["Loose", "Moderate", "Dense"] },
    ]
  },
  MIXED: {
    activities: [
      "Sapling Planting", "Seedling Distribution", "Hydrological Restoration",
      "Soil Sampling", "Community Training", "Nursery Maintenance",
      "Fencing & Protection", "Biodiversity Survey", "Water Quality Monitoring"
    ],
    primaryMetric: { label: "Estimated Restored Area (%)", name: "restoredArea", type: "number", min: 0, max: 100, placeholder: "e.g. 50", required: true },
    secondaryMetric: { label: "Overall Survival Rate (%)", name: "survivalRate", type: "number", min: 0, max: 100, placeholder: "e.g. 85" },
    siteConditions: [
      { label: "Vegetation Density", name: "vegetationDensity", type: "select", options: ["Sparse", "Moderate", "Dense"] },
      { label: "Salinity (ppt)", name: "salinity", type: "number", placeholder: "e.g. 25" },
      { label: "pH", name: "pH", type: "number", placeholder: "e.g. 7.2", step: "0.1" },
      { label: "Water Depth (m)", name: "waterDepth", type: "number", placeholder: "e.g. 1.5", step: "0.1" },
    ]
  }
};

const NewSubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get("project") || "";

  const [projects, setProjects] = useState([]);
  const [selectedProjectType, setSelectedProjectType] = useState("MANGROVE");

  const [form, setForm] = useState({
    projectId: preselectedProject,
    dateOfVisit: new Date().toISOString().split("T")[0],
    gpsLat: "",
    gpsLng: "",
    primaryMetricValue: "",
    secondaryMetricValue: "",
    siteCondition: {},
    restorationActivities: [],
    carbonSamplingNotes: "",
    fieldNotes: "",
  });

  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    projectsAPI.getAll()
      .then((res) => {
        const projs = res.data.data.projects || [];
        setProjects(projs);

        if (preselectedProject) {
          const proj = projs.find(p => p.projectId === preselectedProject || p._id === preselectedProject);
          if (proj && proj.projectType) {
            setSelectedProjectType(proj.projectType);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load projects", err);
      });
  }, [preselectedProject]);

  const config = TYPE_CONFIG[selectedProjectType] || TYPE_CONFIG.MANGROVE;

  const handleProjectChange = (e) => {
    const pId = e.target.value;
    const proj = projects.find(p => p.projectId === pId || p._id === pId);
    if (proj && proj.projectType) {
      setSelectedProjectType(proj.projectType);
      setForm(prev => ({
        ...prev,
        projectId: pId,
        primaryMetricValue: "",
        secondaryMetricValue: "",
        siteCondition: {},
        restorationActivities: []
      }));
    } else {
      setForm({ ...form, projectId: pId });
    }
  };

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            gpsLat: pos.coords.latitude.toFixed(4),
            gpsLng: pos.coords.longitude.toFixed(4),
          }));
          setGpsLoading(false);
        },
        () => {
          setForm((prev) => ({ ...prev, gpsLat: "11.1271", gpsLng: "78.6569" }));
          setGpsLoading(false);
        }
      );
    } else {
      setForm((prev) => ({ ...prev, gpsLat: "11.1271", gpsLng: "78.6569" }));
      setGpsLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.projectId) newErrors.projectId = "Select a project";
    if (!form.primaryMetricValue) newErrors.primaryMetricValue = `${config.primaryMetric.label} is required`;
    if (!form.gpsLat || !form.gpsLng) newErrors.gps = "GPS location is required";
    if (photos.length < 3) newErrors.photos = "At least 3 photos are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    localStorage.setItem("field_submission_draft", JSON.stringify(form));
    alert("Draft saved locally");
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    let survivingTrees = 0;
    let survivalRate = 0;
    let dynamicSiteConditions = { ...form.siteCondition };

    if (selectedProjectType === "MANGROVE") {
      survivingTrees = parseInt(form.primaryMetricValue) || 0;
      survivalRate = parseFloat(form.secondaryMetricValue) || 0;
    } else if (selectedProjectType === "SEAGRASS") {
      dynamicSiteConditions.shootDensity = parseFloat(form.primaryMetricValue) || 0;
      dynamicSiteConditions.coverageArea = parseFloat(form.secondaryMetricValue) || 0;
    } else if (selectedProjectType === "SALTMARSH") {
      dynamicSiteConditions.grassCoverage = parseFloat(form.primaryMetricValue) || 0;
      survivalRate = parseFloat(form.secondaryMetricValue) || 0;
    } else {
      dynamicSiteConditions.restoredArea = parseFloat(form.primaryMetricValue) || 0;
      survivalRate = parseFloat(form.secondaryMetricValue) || 0;
    }

    const payload = {
      projectId: form.projectId,
      visitDate: form.dateOfVisit,
      survivingTrees,
      survivalRate,
      gps: { lat: parseFloat(form.gpsLat), lng: parseFloat(form.gpsLng) },
      siteCondition: dynamicSiteConditions,
      restorationLog: { activities: form.restorationActivities, notes: form.fieldNotes },
      carbonInputs: { notes: form.carbonSamplingNotes },
    };

    try {
      await submissionsAPI.create(payload);
      alert("Submission created successfully!");
      navigate("/field/history");
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Submission failed. Please try again.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1>New Field Submission</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>Record field data for {selectedProjectType} ecosystem</p>
        </div>
        <span style={{
          background: "#e0e7ff", color: "#4338ca", padding: "6px 12px",
          borderRadius: "20px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px"
        }}>
          {selectedProjectType} MODE
        </span>
      </div>

      <div className="card form-card wide" style={{ padding: "28px", margin: "0px auto", marginBottom: "20px" }}>

        <div className="form-group">
          <label>Project *</label>
          <select name="projectId" value={form.projectId} onChange={handleProjectChange}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.projectId || p._id} value={p.projectId || p._id}>{p.projectName} ({p.projectType})</option>
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
            <label>{config.primaryMetric.label} *</label>
            <input
              type={config.primaryMetric.type}
              name="primaryMetricValue"
              placeholder={config.primaryMetric.placeholder}
              value={form.primaryMetricValue}
              onChange={handleChange}
              min={config.primaryMetric.min}
            />
            {errors.primaryMetricValue && <small style={{ color: "#b91c1c" }}>{errors.primaryMetricValue}</small>}
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
          <label>{config.secondaryMetric.label}</label>
          <input
            type={config.secondaryMetric.type}
            name="secondaryMetricValue"
            placeholder={config.secondaryMetric.placeholder}
            min={config.secondaryMetric.min}
            max={config.secondaryMetric.max}
            value={form.secondaryMetricValue}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <PhotoUploader maxFiles={5} label="Photo Evidence (min 3 required)" onFilesChange={setPhotos} />
          {errors.photos && <small style={{ color: "#b91c1c" }}>{errors.photos}</small>}
        </div>

        <div className="form-group">
          <label style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>
            {selectedProjectType} Site Conditions
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {config.siteConditions.map((cond) => (
              <div key={cond.name} className="form-group">
                <label>{cond.label}</label>
                {cond.type === "select" ? (
                  <select name={cond.name} value={form.siteCondition[cond.name] || ""} onChange={handleSiteConditionChange}>
                    <option value="">Select</option>
                    {cond.options.map(opt => <option key={opt} value={opt.toLowerCase()}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={cond.type}
                    name={cond.name}
                    placeholder={cond.placeholder}
                    step={cond.step}
                    value={form.siteCondition[cond.name] || ""}
                    onChange={handleSiteConditionChange}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Restoration Activities Completed</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
            {config.activities.map((a) => (
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
          <button className="primary-btn" onClick={handleSubmit} disabled={submitting} style={{ padding: "12px 24px" }}>
            {submitting ? "Submitting…" : "Submit for Verification"}
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
