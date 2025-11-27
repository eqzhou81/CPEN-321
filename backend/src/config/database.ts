import mongoose from 'mongoose';
import logger from '../utils/logger.util';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI!;

    await mongoose.connect(uri);

    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (error: Error) => {
      logger.error("MongoDB connection error occurred.");
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exitCode = 0;
    });
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exitCode = 1;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB disconnected successfully');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error);
  }
};
