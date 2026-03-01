import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';

import connectDB from './config/db';
import { logger } from './utils/logger';
import { globalErrorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './utils/AppError';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import submissionRoutes from './routes/submission.routes';
import verificationRoutes from './routes/verification.routes';
import adminRoutes from './routes/admin.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(helmet());

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-wallet-address',
            'x-wallet-signature',
            'x-wallet-message',
        ],
    })
);

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many requests, please try again later.',
        },
    },
});
app.use('/api/', generalLimiter);

const submissionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Submission rate limit exceeded. Max 10 per minute.' } },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());

app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/submissions', submissionLimiter, submissionRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.all('*', (req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
});

app.use(globalErrorHandler);

const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger.info(`📋 API docs: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start server');
        process.exit(1);
    }
};

process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ err: reason }, 'UNHANDLED REJECTION — shutting down');
    process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
    logger.fatal({ err: error }, 'UNCAUGHT EXCEPTION — shutting down');
    process.exit(1);
});

startServer();

export default app;
