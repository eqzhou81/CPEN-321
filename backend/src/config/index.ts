import dotenv from 'dotenv';
import { connectDB } from './database';
import { app } from '../config/app';

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
  console.log('🟢 User connected:', socket.id);
  socket.on('joinDiscussion', (discussionId: string) => {
    void socket.join(discussionId);
    console.log(`📥 ${socket.id} joined ${discussionId}`);
  });
  socket.on('disconnect', () => { console.log('🔴 User disconnected:', socket.id); });
});


void connectDB().catch((error: unknown) => {
  console.error('Failed to connect to database:', error);
  throw error;
});

// Start BOTH Express + Socket.IO
server.listen(PORT, () => {
  console.log(` Server + Socket.IO running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exitCode = 0;
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exitCode = 0;
  });
});




