import { Request, Response, NextFunction } from 'express';
import { verifyWalletSignature as verifySignature } from '../services/walletVerify.service';
import { UnauthorizedError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const verifyWalletSignature = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const walletAddress = req.headers['x-wallet-address'] as string;
        const signature = req.headers['x-wallet-signature'] as string;
        const message = req.headers['x-wallet-message'] as string;

        if (!walletAddress || !signature || !message) {
            throw new UnauthorizedError(
                'Wallet verification headers required: x-wallet-address, x-wallet-signature, x-wallet-message'
            );
        }

        const recoveredAddress = verifySignature(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new UnauthorizedError('Wallet signature verification failed.');
        }

        if (req.user && req.user.walletAddress !== walletAddress.toLowerCase()) {
            throw new UnauthorizedError('Wallet address does not match authenticated user.');
        }

        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            logger.error({ err: error }, 'Wallet signature verification error');
            next(new UnauthorizedError('Wallet signature verification failed.'));
        }
    }
};
