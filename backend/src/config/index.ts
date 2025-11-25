import dotenv from 'dotenv';
import { connectDB } from './database';
import { app } from '../config/app';
import logger from '../utils/logger.util';

//for real time socket
import { Server } from 'socket.io';
import http from 'http';


dotenv.config();

const PORT = process.env.PORT ?? 3000;

// Create HTTP server for Express + Socket.IO
const server = http.createServer(app);

// Setup Socket.IO on same server
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3001',
      'http://localhost:3000',
      'http://10.0.2.2:8081'
    ],
    methods: ['GET', 'POST'],
  },
});


app.set('io', io); // <── important line

io.on('connection', (socket) => {
  logger.info('🟢 User connected:', socket.id);
  socket.on('joinDiscussion', (discussionId: string) => {
    socket.join(discussionId);
    logger.info(`📥 ${socket.id} joined ${discussionId}`);
  });
  socket.on('disconnect', () => { logger.info('🔴 User disconnected:', socket.id); });
});


connectDB().catch((err : unknown) => { console.error("Database connection failed:", err); });


// Start BOTH Express + Socket.IO
server.listen(PORT, () => {
  logger.info(` Server + Socket.IO running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed');
    process.exitCode = 0;
  });
});

process.on('SIGINT', () => {
  logger.info('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed');
    process.exitCode = 0;
  });
});




