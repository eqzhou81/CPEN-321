import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { connectDB } from './database';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.middleware';
import router from '../routes/routes';
import path from 'path';

//for real time socket
import { Server } from 'socket.io';
import{discussionModel} from '../models/discussions.model'
import mongoose from "mongoose";
import http from 'http';


dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Create HTTP server for Express + Socket.IO
const server = http.createServer(app);

// Setup Socket.IO on same server
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://10.0.2.2:8081'
    ],
    methods: ['GET', 'POST'],
  },
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinDiscussion', (discussionId) => {
    socket.join(discussionId);
    console.log(`User ${socket.id} joined room ${discussionId}`);
  });

 socket.on('newMessage', async (discussionId, messageData) => {
  try {
    console.log(' Broadcasting new message:', messageData);

    const discussion = await discussionModel.findById(discussionId);
      if (!discussion) return;

      const newMessage = {
        _id: new mongoose.Types.ObjectId().toString(), // generate if not from Mongo
        userId: messageData.userId,
        userName: messageData.userName,
        content: messageData.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      discussion.messages.push(newMessage);
      discussion.messageCount = discussion.messages.length;
      discussion.lastActivityAt = new Date();

      await discussion.save();

    io.to(discussionId).emit('messageReceived', {
      // 👇 this ensures "id" is always present
      id: messageData._id || messageData.id || new Date().getTime().toString(),
      userId: messageData.userId,
      userName: messageData.userName,
      content: messageData.content,
      createdAt: messageData.createdAt ?? new Date(),
      updatedAt: messageData.updatedAt ?? new Date(),
    });

    console.log(` Message broadcasted to discussion ${discussionId}`);
  } catch (err) {
    console.error('Failed to broadcast message:', err);
  }
});

  socket.on('disconnect', () => {
    console.log(' User disconnected:', socket.id);
  });

});


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

// Start BOTH Express + Socket.IO
server.listen(PORT, () => {
  console.log(` Server + Socket.IO running on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
