import mongoose from 'mongoose';
import { createLogger } from './logger';

const logger = createLogger('mongodb');

export async function connectDatabase(serviceName: string): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info({ service: serviceName }, 'MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err, service: serviceName }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn({ service: serviceName }, 'MongoDB disconnected');
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    logger.error({ err, service: serviceName }, 'Failed to connect to MongoDB');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}