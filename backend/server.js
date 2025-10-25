import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Allowed origins (for both API + sockets)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://10.0.2.2:3000",
  "http://10.0.2.2:8081",
  "http://localhost:3000",
];

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// === Socket.IO event handlers ===
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinDiscussion", (discussionId) => {
    socket.join(discussionId);
    console.log(`User ${socket.id} joined room ${discussionId}`);
  });

  socket.on("newMessage", (discussionId, message) => {
    console.log(`💬 New message in ${discussionId}:`, message);
    io.to(discussionId).emit("messageReceived", message);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// === Express API routes ===
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.post("/api/auth/signin", (req, res) => {
  res.json({
    message: "User signed in successfully",
    data: {
      user: { _id: "123", name: "Test User", email: "test@example.com" },
      token: "mock-token-123",
    },
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend can connect to ws://localhost:${PORT}`);
});
