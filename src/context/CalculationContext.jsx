import { createContext, useContext, useState, useEffect } from "react";
import { settingsAPI } from "../services/api";

const CalculationContext = createContext();

export const CalculationProvider = ({ children }) => {
    const [co2PerTree, setCo2PerTree] = useState(0.024);
    const [co2Factors, setCo2Factors] = useState({
        MANGROVE: 10.0,
        SALTMARSH: 6.5,
        SEAGRASS: 4.0,
        MIXED: 7.0,
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        settingsAPI.getFormula()
            .then(res => {
                const d = res.data.data;
                if (d.co2PerTree) setCo2PerTree(d.co2PerTree);
                if (d.co2Factors) setCo2Factors(d.co2Factors);
            })
            .catch(() => { })
            .finally(() => setLoaded(true));
    }, []);

    const updateFormula = async (params) => {
        const payload = {};
        if (params.co2PerTree !== undefined) payload.co2PerTree = parseFloat(params.co2PerTree);
        if (params.co2Factors) payload.co2Factors = params.co2Factors;

        const res = await settingsAPI.updateFormula(payload);
        const d = res.data.data;
        if (d.co2PerTree) setCo2PerTree(d.co2PerTree);
        if (d.co2Factors) setCo2Factors(d.co2Factors);
        return d;
    };

    return (
        <CalculationContext.Provider value={{ co2PerTree, co2Factors, updateFormula, loaded }}>
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
