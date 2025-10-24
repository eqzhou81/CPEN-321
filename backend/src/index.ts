import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import { errorHandler } from './middleware/errorHandler.middleware';
import routes from './routes/routes';

// Load environment variables
dotenv.config();

export function createApp(): express.Application {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://10.0.2.2:3000',  // Android emulator localhost
      'http://localhost:3000'  // Local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ 
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API routes
  app.use('/api', routes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cpen321';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  connectDatabase().then(() => {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend should connect to http://localhost:${PORT}/api`);
      console.log(`📱 Android emulator should connect to http://10.0.2.2:${PORT}/api`);
    });
  }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
