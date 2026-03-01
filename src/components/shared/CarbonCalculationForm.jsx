import { useState, useEffect } from "react";
import { useCalculation } from "../../context/CalculationContext";

const CarbonCalculationForm = ({ onResult }) => {
    const { co2PerTree: defaultCo2 } = useCalculation();
    const [trees, setTrees] = useState("");
    const [survivalRate, setSurvivalRate] = useState("");
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        const t = parseFloat(trees);
        const sr = parseFloat(survivalRate);
        const co2 = defaultCo2;

        if (!t || !sr || isNaN(sr) || t <= 0 || sr <= 0 || sr > 100) {
            setResult(null);
            onResult?.(null);
            return;
        }

        const survivingTrees = Math.round(t * (sr / 100));
        const totalCO2 = (survivingTrees * co2).toFixed(3);
        const r = { trees: t, survivalRate: sr, co2PerTree: co2, survivingTrees, totalCO2 };
        setResult(r);
        onResult?.(r);
    };

    const allFilled = trees && survivalRate;

    return (
        <div className="card" style={{ borderLeft: "4px solid #0f766e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "15px", margin: 0 }}>Carbon Calculation</h3>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    Constant: <strong>{defaultCo2}</strong> tCO₂e/tree/year
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Trees Verified</label>
                    <input
                        type="number"
                        placeholder="e.g. 350"
                        value={trees}
                        onChange={(e) => { setTrees(e.target.value); setResult(null); onResult?.(null); }}
                        min="1"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "12px" }}>Survival Rate (%)</label>
                    <input
                        type="number"
                        placeholder="e.g. 85"
                        value={survivalRate}
                        onChange={(e) => { setSurvivalRate(e.target.value); setResult(null); onResult?.(null); }}
                        min="0" max="100"
                    />
                </div>
            </div>

            <button
                style={{
                    width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600,
                    background: allFilled ? "#0f766e" : "#9ca3af",
                    color: "white", border: "none", borderRadius: "var(--radius)",
                    cursor: allFilled ? "pointer" : "not-allowed",
                    transition: "background 0.15s",
                }}
                onClick={handleCalculate}
                disabled={!allFilled}
            >
                Calculate
            </button>

            {result && (
                <div style={{
                    marginTop: "16px", padding: "14px",
                    background: "#f0fdf4", borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                }}>
                    <div style={{ fontSize: "13px", lineHeight: "2", fontFamily: "monospace", color: "#374151" }}>
                        <div>Trees verified: <strong>{result.trees}</strong></div>
                        <div>Survival rate: <strong>{result.survivalRate}%</strong></div>
                        <div>Surviving trees: <strong>{result.survivingTrees}</strong></div>
                        <div>CO₂/tree/year: <strong>{result.co2PerTree} tCO₂e</strong></div>
                        <div style={{ borderTop: "1px solid #bbf7d0", marginTop: "6px", paddingTop: "6px" }}>
                            <span style={{ color: "#0f766e" }}>
                                ≈ <strong style={{ fontSize: "17px" }}>{result.totalCO2}</strong> tCO₂e/year
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px" }}>
                        Formula: Surviving Trees × {result.co2PerTree} tCO₂e
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarbonCalculationForm;
