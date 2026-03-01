import { useState } from "react";
import { useCalculation } from "../../context/CalculationContext";

const FormulaSettings = () => {
    const { co2PerTree, co2Factors, updateFormula } = useCalculation();
    const [inputValue, setInputValue] = useState(co2PerTree.toString());
    const [factors, setFactors] = useState({ ...co2Factors });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isSaving, setIsSaving] = useState(false);

    const handleFactorChange = (key, value) => {
        setFactors(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus({ type: "", message: "" });

        const val = parseFloat(inputValue);
        if (isNaN(val) || val <= 0) {
            setStatus({ type: "error", message: "Please enter a valid positive number for CO₂ per tree." });
            setIsSaving(false);
            return;
        }

        const parsedFactors = {};
        for (const [key, value] of Object.entries(factors)) {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                setStatus({ type: "error", message: `Invalid value for ${key} factor.` });
                setIsSaving(false);
                return;
            }
            parsedFactors[key] = num;
        }

        try {
            await updateFormula({ co2PerTree: val, co2Factors: parsedFactors });
            setStatus({ type: "success", message: "Formula saved to database!" });
        } catch (err) {
            setStatus({ type: "error", message: "Failed to save settings." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <h1 style={{ marginBottom: "20px" }}>Formula Calculation Settings</h1>

            <div className="card" style={{ padding: "30px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                    Update the global parameters used for carbon sequestration calculations across the platform.
                    Changes are saved to the database and take effect immediately for all users.
                </p>

                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                            CO₂ per Tree per Year (tCO₂e)
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="number"
                                step="0.001"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                style={{ paddingRight: "60px", fontSize: "16px", fontWeight: 500 }}
                                placeholder="e.g. 0.024"
                            />
                            <span style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "12px"
                            }}>tCO₂e</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                            Based on IPCC Tier 1 defaults for mangrove/blue carbon ecosystems.
                        </p>
                    </div>

                    <h3 style={{ fontSize: "14px", marginBottom: "12px", fontWeight: 600 }}>CO₂ Factors by Ecosystem (tCO₂/ha/yr)</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                        {Object.entries(factors).map(([key, value]) => (
                            <div className="form-group" key={key} style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: "12px" }}>{key}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={value}
                                    onChange={(e) => handleFactorChange(key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button type="submit" className="primary-btn" disabled={isSaving} style={{ minWidth: "140px" }}>
                            {isSaving ? "Saving..." : "Save to Database"}
                        </button>

                        {status.message && (
                            <span style={{
                                fontSize: "14px",
                                color: status.type === "success" ? "#059669" : "#dc2626",
                                fontWeight: 500
                            }}>
                                {status.type === "success" ? "✓ " : "⚠ "}
                                {status.message}
                            </span>
                        )}
                    </div>
                </form>
            </div>

            <div className="card mt-20" style={{ background: "#f0fdfa", border: "1px dashed #5eead4" }}>
                <h3 style={{ fontSize: "14px", color: "#0f766e", marginBottom: "8px" }}>Current Active Formula</h3>
                <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#134e4a" }}>
                    Total CO₂ = (Trees × Survival Rate) × <span style={{ fontWeight: 700, color: "#0d9488" }}>{co2PerTree}</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                    Ecosystem factors: {Object.entries(co2Factors).map(([k, v]) => `${k}: ${v}`).join(", ")}
                </div>
            </div>
        </div>
    );
};

export default FormulaSettings;
