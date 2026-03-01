import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const globalErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }

    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
            },
        });
        return;
    }

    if ((err as unknown as Record<string, unknown>).code === 11000) {
        res.status(409).json({
            success: false,
            error: {
                code: 'DUPLICATE_KEY',
                message: 'Duplicate field value. A record with this value already exists.',
            },
        });
        return;
    }

    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: 'Invalid resource identifier.',
            },
        });
        return;
    }

    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message:
                process.env.NODE_ENV === 'production'
                    ? 'An unexpected error occurred.'
                    : err.message,
        },
    });
};
