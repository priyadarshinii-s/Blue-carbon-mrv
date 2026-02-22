import { createContext, useContext, useState, useEffect } from "react";

const CalculationContext = createContext();

export const CalculationProvider = ({ children }) => {
    // Default CO2 per tree factor (tCO2e/tree/year)
    const [co2PerTree, setCo2PerTree] = useState(0.024);

    // In a real app, we might load this from a backend/database
    // For now, we'll initialize with default and allow runtime updates

    const updateFormula = (params) => {
        if (params.co2PerTree !== undefined) {
            setCo2PerTree(parseFloat(params.co2PerTree));
        }
    };

    return (
        <CalculationContext.Provider value={{ co2PerTree, updateFormula }}>
            {children}
        </CalculationContext.Provider>
    );
};

export const useCalculation = () => {
    const context = useContext(CalculationContext);
    if (!context) {
        throw new Error("useCalculation must be used within a CalculationProvider");
    }
    return context;
};
