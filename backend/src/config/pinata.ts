import { logger } from '../utils/logger';

interface PinataConfig {
    apiKey: string;
    secretKey: string;
}

export const getPinataConfig = (): PinataConfig => {
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
        logger.warn('Pinata API keys not configured. IPFS uploads will fail.');
        return { apiKey: '', secretKey: '' };
    }

    return { apiKey, secretKey };
};
