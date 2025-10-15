import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { connectDB } from './database';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler.middleware';
import router from '../../routes/routes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

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

connectDB();
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
