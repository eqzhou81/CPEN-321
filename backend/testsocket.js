// Change in testsocket.js
const { io } = require("socket.io-client");


const socket = io("http://127.0.0.1:3000"); // or your backend URL
console.log("have not connected to server yet")

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  // Join a discussion room
  const discussionId = "68fac58f26f124d111623dc6";
  socket.emit("joinDiscussion", discussionId);
  console.log("Joined discussion:", discussionId);

  // Send a message
  socket.emit("newMessage", discussionId, {
    userId: "tester123",
    userName: "Test User",
    content: "Hello from test client!",
  });

  // Listen for broadcasted messages
  socket.on("messageReceived", (message) => {
    console.log("💬 Message received:", message);
  });
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
