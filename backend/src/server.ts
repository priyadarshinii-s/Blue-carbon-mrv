import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import uploadRoutes from './routes/upload.routes';
import { startBlockchainListener, stopBlockchainListener } from './services/blockchain.listener';
import { blockchainHealthCheck, isBlockchainConfigured } from './services/blockchain.service';

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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(mongoSanitize());

app.get('/api/health', async (_req, res) => {
    let blockchain = null;
    try {
        const configured = await isBlockchainConfigured();
        if (configured) {
            blockchain = await blockchainHealthCheck();
        }
    } catch {
        blockchain = { connected: false, error: 'Failed to connect' };
    }

    res.status(200).json({
        success: true,
        data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            blockchain,
        },
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

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

        // Start blockchain event listener (non-blocking)
        startBlockchainListener().catch((err) => {
            logger.warn({ err }, 'Blockchain event listener failed to start — on-chain sync disabled');
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

// ── Graceful shutdown — stop blockchain listener before exit ──
async function gracefulShutdown(signal: string): Promise<void> {
    logger.info(`${signal} received — shutting down gracefully`);
    try {
        await stopBlockchainListener();
    } catch (err) {
        logger.error({ err }, 'Error stopping blockchain listener during shutdown');
    }
    process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export default app;
