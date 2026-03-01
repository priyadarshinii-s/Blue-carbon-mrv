import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';
import { UserRole } from '../types';

export const restrictTo = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required.'));
        }

        if (!roles.includes(req.user.role as UserRole)) {
            return next(
                new ForbiddenError(
                    `Role '${req.user.role}' is not authorized to access this resource.`
                )
            );
        }

        next();
    };
};
