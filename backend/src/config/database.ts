import mongoose from 'mongoose';
import logger from '../utils/logger.util';


export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(uri);

    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on("error", (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error("MongoDB connection error:", errorMessage, errorStack);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', () => {
      mongoose.connection.close().then(() => {
        logger.info('MongoDB connection closed through app termination');
        process.exitCode = 0;
      }).catch((error: unknown) => {
        logger.error('Error closing MongoDB connection:', error);
        process.exitCode = 1;
      });
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
