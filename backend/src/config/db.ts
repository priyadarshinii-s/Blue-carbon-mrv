import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        logger.fatal('MONGO_URI is not defined in environment variables');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        logger.fatal({ err: error }, 'MongoDB connection failed');
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB connection error');
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting reconnect...');
    });
};

export default connectDB;
