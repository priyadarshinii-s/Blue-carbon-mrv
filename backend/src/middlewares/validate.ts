import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/AppError';

export const validate = (schema: ZodSchema) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                next(new BadRequestError(`Validation failed: ${messages.join('; ')}`));
            } else {
                next(error);
            }
        }
    };
};
