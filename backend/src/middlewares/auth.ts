import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { UnauthorizedError } from '../utils/AppError';
import User from '../models/User';
import { logger } from '../utils/logger';

export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new UnauthorizedError('Access denied. No token provided.');
        }

        const decoded = verifyToken(token);

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new UnauthorizedError('User associated with this token no longer exists.');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
        } else {
            logger.error({ err: error }, 'JWT verification failed');
            next(new UnauthorizedError('Invalid or expired token.'));
        }
    }
};

export const optionalProtect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (error) {

        next();
    }
};
