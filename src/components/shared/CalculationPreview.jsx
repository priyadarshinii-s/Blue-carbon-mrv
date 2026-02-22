import { useCalculation } from "../../context/CalculationContext";

const CalculationPreview = ({ trees = 0, survivalRate = 85 }) => {
    const { co2PerTree } = useCalculation();
    const survivingTrees = Math.round(trees * (survivalRate / 100));
    const totalCO2 = (survivingTrees * co2PerTree).toFixed(2);

    return (
        <div className="card" style={{ borderLeft: "4px solid #0f766e" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Carbon Calculation Preview</h3>
            <div style={{ fontSize: "13px", lineHeight: "2", fontFamily: "monospace", color: "#374151" }}>
                <div>Trees planted: <strong>{trees}</strong></div>
                <div>Survival rate: <strong>{survivalRate}%</strong></div>
                <div>Surviving trees: <strong>{survivingTrees}</strong></div>
                <div>CO₂/tree/year: <strong>{co2PerTree} tCO₂e</strong></div>
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "6px", paddingTop: "6px" }}>
                    <span style={{ color: "#0f766e" }}>≈ <strong style={{ fontSize: "16px" }}>{totalCO2}</strong> tCO₂e/year</span>
                </div>
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
                Formula: Surviving Trees × {co2PerTree} tCO₂e (IPCC Tier 1 Blue Carbon)
            </div>
        </div>
    );
};

export default CalculationPreview;
