import { ethers } from 'ethers';
import { logger } from '../utils/logger';

export const verifyWalletSignature = (message: string, signature: string): string => {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        logger.debug({ recoveredAddress }, 'Wallet signature verified');
        return recoveredAddress;
    } catch (error) {
        logger.error({ err: error }, 'Failed to verify wallet signature');
        throw new Error('Invalid wallet signature');
    }
};

export const generateLoginMessage = (walletAddress: string, nonce?: string): string => {
    const timestamp = Date.now();
    const loginNonce = nonce || Math.random().toString(36).substring(2, 15);
    return `Sign this message to authenticate with Blue Carbon MRV Registry.\n\nWallet: ${walletAddress}\nNonce: ${loginNonce}\nTimestamp: ${timestamp}`;
};
