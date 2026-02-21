import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProjectStepper from "../../components/shared/ProjectStepper";
import EcosystemTypeCards from "../../components/shared/EcosystemTypeCards";
import LocationMapWithDraw from "../../components/shared/LocationMapWithDraw";
import PhotoUploader from "../../components/shared/PhotoUploader";
import DraftRecoveryBanner from "../../components/shared/DraftRecoveryBanner";
import ConfirmationTxModal from "../../components/shared/ConfirmationTxModal";
import ProjectSuccessScreen from "../../components/shared/ProjectSuccessScreen";

const DRAFT_KEY = "user_project_draft";
const STEPS = ["Basic Details", "Location", "Evidence", "Timeline"];

const activityOptions = [
    "Sapling Planting", "Seedling Distribution", "Hydrological Restoration", "Soil Sampling",
    "Community Training", "Nursery Maintenance", "Fencing & Protection", "Biodiversity Survey",
    "Water Quality Monitoring", "Carbon Sampling", "Wildlife Census", "Drone Survey",
];

const emptyForm = {
    name: "", ecosystemType: "", description: "", organization: "",
    location: "", lat: "", lng: "", area: "",
    photos: [], videos: [],
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    endDate: "", activities: [], notes: "",
};

const UserCreateProject = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [success, setSuccess] = useState(null);
    const draftTimer = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) setShowDraftBanner(true);
    }, []);

    useEffect(() => {
        clearTimeout(draftTimer.current);
        draftTimer.current = setTimeout(() => {
            if (form.name || form.ecosystemType) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
            }
        }, 30000);
        return () => clearTimeout(draftTimer.current);
    }, [form, step]);

    const handleRestoreDraft = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(DRAFT_KEY));
            if (saved) { setForm(saved.form); setStep(saved.step); }
        } catch { }
        setShowDraftBanner(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setShowDraftBanner(false);
    };

    const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));
    const toggleActivity = (a) =>
        set("activities", form.activities.includes(a)
            ? form.activities.filter((x) => x !== a)
            : [...form.activities, a]);

    const simulateIPFSUpload = (files) => {
        files.forEach((f, i) => {
            setUploadProgress((p) => ({ ...p, [i]: 0 }));
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    const current = (prev[i] || 0) + Math.random() * 22;
                    if (current >= 100) { clearInterval(interval); return { ...prev, [i]: 100 }; }
                    return { ...prev, [i]: Math.min(current, 99) };
                });
            }, 180);
        });
    };

    const validateStep = () => {
        const errs = {};
        if (step === 0) {
            if (!form.name || form.name.length < 5) errs.name = "Name must be at least 5 characters";
            if (!form.ecosystemType) errs.ecosystemType = "Select an ecosystem type";
            if (!form.description || form.description.length < 50) errs.description = "Description must be at least 50 characters";
        }
        if (step === 1) {
            if (!form.location) errs.location = "Location name is required";
            if (!form.area || parseFloat(form.area) < 0.1) errs.area = "Area must be at least 0.1 ha";
        }
        if (step === 2) {
            if (form.photos.length < 3) errs.photos = "At least 3 baseline photos are required";
        }
        if (step === 3) {
            if (!form.startDate) errs.startDate = "Start date is required";
            if (form.endDate && form.endDate < form.startDate) errs.endDate = "End date must be after start date";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step === 2 && form.photos.length > 0) simulateIPFSUpload(form.photos);
        setStep((s) => s + 1);
    };

    const handleBack = () => setStep((s) => s - 1);

    const handleSaveDraft = () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
        alert("Draft saved!");
    };

    const handleSubmitClick = () => {
        if (!validateStep()) return;
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = () => {
        setSubmitting(true);
        setShowConfirmModal(false);
        setTimeout(() => {
            setSubmitting(false);
            localStorage.removeItem(DRAFT_KEY);
            const id = "BCR-" + Math.random().toString(36).slice(2, 8).toUpperCase();
            const tx = "0x" + Math.random().toString(16).slice(2, 42);
            setSuccess({ id, tx, name: form.name });
        }, 3000);
    };

    if (success) {
        return <ProjectSuccessScreen projectId={success.id} projectName={success.name} txHash={success.tx} isAdmin={false} />;
    }

    if (submitting) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "20px" }}>
                <div style={{ fontSize: "64px", animation: "spin 2s linear infinite" }}>🌿</div>
                <h2 style={{ fontSize: "20px", color: "#0f2a44" }}>Registering your project...</h2>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Uploading to IPFS and writing to Polygon</p>
            </div>
        );
    }

    return (
        <>
            {showDraftBanner && <DraftRecoveryBanner onRestore={handleRestoreDraft} onDiscard={handleDiscardDraft} />}
            {showConfirmModal && (
                <ConfirmationTxModal
                    projectName={form.name}
                    onConfirm={handleConfirmSubmit}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h1>Register a New Project</h1>
                <button className="secondary-btn" style={{ fontSize: "13px" }} onClick={handleSaveDraft}>Save Draft</button>
            </div>
            <p className="page-subtitle">Submit your blue carbon project to the MRV Registry</p>

            <div className="card wide mt-20" style={{ padding: "28px" }}>
                <ProjectStepper steps={STEPS} currentStep={step} />

                {step === 0 && (
                    <div>
                        <h3 style={{ marginBottom: "20px", color: "#0f2a44", fontSize: "16px" }}>Tell us about your project</h3>
                        <div className="form-group">
                            <label>Project Name * <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 400 }}>({form.name.length}/100)</span></label>
                            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pichavaram Mangrove Restoration" maxLength={100} />
                            {errors.name && <small style={{ color: "#b91c1c" }}>{errors.name}</small>}
                        </div>

                        <div className="form-group">
                            <label style={{ marginBottom: "12px", display: "block" }}>Ecosystem Type *</label>
                            <EcosystemTypeCards value={form.ecosystemType} onChange={(v) => set("ecosystemType", v)} />
                            {errors.ecosystemType && <small style={{ color: "#b91c1c", display: "block", marginTop: "8px" }}>{errors.ecosystemType}</small>}
                        </div>

                        <div className="form-group">
                            <label>Project Description * <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 400 }}>({form.description.length}/800)</span></label>
                            <textarea
                                value={form.description}
                                onChange={(e) => set("description", e.target.value)}
                                placeholder="Describe the goals, methodology, expected impact, and community involvement of this project (min 50 characters)..."
                                rows={5} maxLength={800}
                            />
                            {errors.description && <small style={{ color: "#b91c1c" }}>{errors.description}</small>}
                        </div>

                        <div className="form-group">
                            <label>Organization / Community Name</label>
                            <input type="text" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="Your NGO, Panchayat, or organization name" />
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h3 style={{ marginBottom: "20px", color: "#0f2a44", fontSize: "16px" }}>Where is your project located?</h3>
                        <div className="form-group">
                            <label>Region / Location Name *</label>
                            <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Pichavaram, Tamil Nadu" />
                            {errors.location && <small style={{ color: "#b91c1c" }}>{errors.location}</small>}
                        </div>
                        <div className="form-group">
                            <label style={{ marginBottom: "10px", display: "block" }}>Map & Geofence</label>
                            <LocationMapWithDraw
                                onLocationChange={(data) => {
                                    if (data.lat) { set("lat", data.lat); set("lng", data.lng); }
                                    if (data.area) set("area", String(data.area));
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Approximate Area (ha) *</label>
                            <input type="number" value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Auto-filled from polygon, or enter manually" min="0.1" step="0.1" />
                            {errors.area && <small style={{ color: "#b91c1c" }}>{errors.area}</small>}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 style={{ marginBottom: "20px", color: "#0f2a44", fontSize: "16px" }}>Upload Baseline Evidence</h3>
                        <div className="form-group">
                            <PhotoUploader maxFiles={8} label="Baseline Photos * (minimum 3, maximum 8)" onFilesChange={(files) => set("photos", files)} />
                            {errors.photos && <small style={{ color: "#b91c1c", display: "block", marginTop: "8px" }}>{errors.photos}</small>}
                            <small className="helper-text">JPG, PNG, WEBP — Max 10MB each. Photos are stored permanently on IPFS.</small>
                        </div>

                        {Object.keys(uploadProgress).length > 0 && (
                            <div style={{ marginTop: "16px" }}>
                                <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#0f2a44" }}>IPFS Upload Progress</p>
                                {Object.entries(uploadProgress).map(([i, pct]) => (
                                    <div key={i} style={{ marginBottom: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}>
                                            <span>Photo {parseInt(i) + 1}</span><span>{Math.round(pct)}%</span>
                                        </div>
                                        <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "6px" }}>
                                            <div style={{ width: `${pct}%`, background: "#0f766e", height: "6px", borderRadius: "999px", transition: "width 0.2s" }} />
                                        </div>
                                        {pct >= 100 && <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>CID: QmX{Math.random().toString(36).slice(2, 14)}...</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: "20px" }}>
                            <PhotoUploader maxFiles={3} label="Baseline Videos (optional, max 3)" onFilesChange={(files) => set("videos", files)} />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h3 style={{ marginBottom: "20px", color: "#0f2a44", fontSize: "16px" }}>Timeline & Planned Activities</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="form-group">
                                <label>Planned Start Date *</label>
                                <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                                {errors.startDate && <small style={{ color: "#b91c1c" }}>{errors.startDate}</small>}
                            </div>
                            <div className="form-group">
                                <label>Planned End Date</label>
                                <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                                {errors.endDate && <small style={{ color: "#b91c1c" }}>{errors.endDate}</small>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Planned Activities</label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                                {activityOptions.map((a) => (
                                    <button key={a} type="button"
                                        className={form.activities.includes(a) ? "primary-btn" : "secondary-btn"}
                                        style={{ fontSize: "12px", padding: "6px 12px" }}
                                        onClick={() => toggleActivity(a)}
                                    >{a}</button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Additional Notes (optional)</label>
                            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any other context or remarks..." rows={3} />
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                    <button type="button" className="secondary-btn" onClick={step === 0 ? () => navigate("/user/projects") : handleBack}>
                        {step === 0 ? "Cancel" : "Back"}
                    </button>
                    {step < STEPS.length - 1 ? (
                        <button type="button" className="primary-btn" onClick={handleNext} style={{ padding: "10px 28px" }}>Continue</button>
                    ) : (
                        <button type="button" className="primary-btn" onClick={handleSubmitClick} style={{ padding: "10px 28px", background: "#0f766e" }}>
                            Submit Project
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserCreateProject;
