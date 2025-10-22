import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import { errorHandler } from './dist/middleware/errorHandler.middleware.js';
import routes from './dist/routes/routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Connect to MongoDB
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cpen321';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('📡 API available at http://localhost:' + PORT + '/api');
    console.log('🌐 Frontend should connect to http://localhost:' + PORT + '/api');
    console.log('\n📋 Available job routes:');
    console.log('  POST   /api/jobs                 - Create job application');
    console.log('  GET    /api/jobs                 - Get all job applications');
    console.log('  GET    /api/jobs/:id             - Get job application by ID');
    console.log('  PUT    /api/jobs/:id             - Update job application');
    console.log('  DELETE /api/jobs/:id             - Delete job application');
    console.log('  GET    /api/jobs/search          - Search job applications');
    console.log('  GET    /api/jobs/by-company      - Get jobs by company');
    console.log('  GET    /api/jobs/statistics      - Get job statistics');
    console.log('  POST   /api/jobs/:id/similar     - Find similar jobs');
    console.log('  POST   /api/jobs/scrape          - Scrape job from URL');
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
