import jwt from 'jsonwebtoken';
import { IJwtPayload } from '../types';

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return secret;
};

const getJwtExpire = (): string => {
    return process.env.JWT_EXPIRE || '24h';
};

export const signToken = (payload: IJwtPayload): string => {
    const expiresIn = getJwtExpire();
    return jwt.sign(payload as object, getJwtSecret(), {
        expiresIn,
    } as jwt.SignOptions);
};

export const verifyToken = (token: string): IJwtPayload => {
    return jwt.verify(token, getJwtSecret()) as IJwtPayload;
};
