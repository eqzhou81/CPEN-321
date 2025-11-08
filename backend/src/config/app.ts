import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.middleware';
import router from '../routes/routes';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Setup Socket.IO
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

// ✅ Store io in app for controllers to access
app.set('io', io);

// ✅ Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);
  
  socket.on('joinDiscussion', (discussionId: string) => {
    socket.join(discussionId);
    console.log(`📥 ${socket.id} joined ${discussionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

// ✅ Export app, server, and io
export { app, server, io };