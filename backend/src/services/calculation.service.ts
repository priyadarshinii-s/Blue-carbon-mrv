import { logger } from '../utils/logger';
import Settings from '../models/Settings';

interface CarbonCalculationInput {
    areaHa: number;
    survivalRate: number;
    co2Factor?: number;
    ecosystemType?: string;
    yearsFactor?: number;
}

interface CarbonCalculationResult {
    estimatedCredits: number;
    formula: string;
    inputs: CarbonCalculationInput;
}

const DEFAULT_CO2_FACTORS: Record<string, number> = {
    MANGROVE: 10.0,
    SALTMARSH: 6.5,
    SEAGRASS: 4.0,
    MIXED: 7.0,
};

const getSettingsFactors = async (): Promise<Record<string, number>> => {
    try {
        const settings = await Settings.findOne({ key: 'formula' }).lean();
        if (settings?.co2Factors) {
            return settings.co2Factors as unknown as Record<string, number>;
        }
    } catch (err) {
        logger.warn({ err }, 'Failed to load CO2 factors from DB, using defaults');
    }
    return DEFAULT_CO2_FACTORS;
};

export const calculateCarbonCredits = async (input: CarbonCalculationInput): Promise<CarbonCalculationResult> => {
    const { areaHa, survivalRate, ecosystemType, yearsFactor = 1 } = input;

    const factors = await getSettingsFactors();
    const co2Factor = input.co2Factor || factors[ecosystemType || 'MIXED'] || 7.0;

    const estimatedCredits = parseFloat(
        (areaHa * (survivalRate / 100) * co2Factor * yearsFactor).toFixed(4)
    );

    const formula = `${areaHa} ha × ${survivalRate}% survival × ${co2Factor} tCO2/ha/yr × ${yearsFactor} yr`;

    logger.debug({
        estimatedCredits,
        formula,
        input,
    }, 'Carbon credits calculated');

    return {
        estimatedCredits,
        formula,
        inputs: input,
    };
};

export const getCO2Factor = async (ecosystemType: string): Promise<number> => {
    const factors = await getSettingsFactors();
    return factors[ecosystemType] || factors.MIXED || 7.0;
};
