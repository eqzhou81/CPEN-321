import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { connectDB } from './src/config /config/database';
import router from './src/routes/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8081',
    'http://10.0.2.2:3000',  // Android emulator localhost
    'http://localhost:3000'  // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API routes
app.use('/api', router);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Error handling middleware
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error: unknown, req: any, res: any, next: any) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend should connect to http://localhost:${PORT}/api`);
      console.log(`💾 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
