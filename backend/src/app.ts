import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import router from './routes/routes';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

export { app };