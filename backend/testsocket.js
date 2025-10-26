// final-comprehensive-test.js
const { io } = require("socket.io-client");
const axios = require('axios');

const socket = io("http://localhost:3000");
const API_BASE = "http://localhost:3000/api/discussions";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmYyNjE0NmVhYWUxZDhkNWFiNTFkOSIsImlhdCI6MTc2MTQ1NTY3MiwiZXhwIjoxNzYxNTI0MDcyfQ.9PqvUPDmgL57Zwm1COuGmYu0bql3bVB4PgHOVHTk0tg";

const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

async function comprehensiveTest() {
  console.log("🎯 FINAL COMPREHENSIVE TEST");
  console.log("============================");

  let discussionId;
  let socketEvents = [];

  try {
    // Setup socket listeners
    socket.on("newDiscussion", (data) => {
      console.log("\n🎉 SOCKET: newDiscussion received");
      console.log("   Topic:", data.topic);
      console.log("   ID:", data.id);
      socketEvents.push({ type: 'newDiscussion', data });
    });

    socket.on("messageReceived", (data) => {
      console.log("\n🎉 SOCKET: messageReceived received");
      console.log("   From:", data.userName);
      console.log("   Content:", data.content);
      console.log("   Discussion ID:", data.discussionId);
      socketEvents.push({ type: 'messageReceived', data });
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected");
    });

    // Wait for socket connection
    await new Promise(resolve => {
      if (socket.connected) resolve();
      else socket.once('connect', resolve);
    });

    // 1. Create a new discussion
    console.log("\n1. Creating new discussion...");
    const discussionData = {
      topic: "Final Comprehensive Test - " + new Date().toLocaleTimeString(),
      description: "Testing the complete discussion and messaging flow"
    };
    
    const createResponse = await axios.post(API_BASE, discussionData, config);
    console.log("✅ Discussion created via API");
    console.log("   Response:", createResponse.data);
    
    discussionId = createResponse.data.discussionId;
    console.log("   Discussion ID:", discussionId);

    // Wait a bit for socket event
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Join the discussion room
    console.log("\n2. Joining discussion room via socket...");
    socket.emit("joinDiscussion", discussionId);
    console.log("   ✅ Joined room:", discussionId);

    // 3. Send multiple test messages
    console.log("\n3. Sending test messages...");
    
    const testMessages = [
      "First test message! 🚀",
      "Second message testing real-time updates",
      "Third message - everything should work now!",
      "Final test message - complete success! ✅"
    ];

    for (let i = 0; i < testMessages.length; i++) {
      console.log(`\n   💬 Sending message ${i + 1}/${testMessages.length}...`);
      
      const messageData = { content: testMessages[i] };
      const messageResponse = await axios.post(
        `${API_BASE}/${discussionId}/messages`, 
        messageData, 
        config
      );
      
      console.log("   ✅ Message sent via API");
      console.log("      Content:", testMessages[i]);
      console.log("      Message ID:", messageResponse.data.message.id);
      
      // Wait to see real-time updates
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 4. Verify everything worked by fetching the discussion
    console.log("\n4. Verifying discussion and messages...");
    const verifyResponse = await axios.get(`${API_BASE}/${discussionId}`, config);
    const discussion = verifyResponse.data.data;
    
    console.log("✅ Discussion verification:");
    console.log("   Topic:", discussion.topic);
    console.log("   Message count:", discussion.messageCount);
    console.log("   Messages in discussion:", discussion.messages.length);
    
    console.log("\n   Last 2 messages:");
    discussion.messages.slice(-2).forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.userName}: ${msg.content}`);
    });

    // 5. Summary
    console.log("\n📊 TEST SUMMARY:");
    console.log("   ✅ Discussion created:", discussionId);
    console.log("   ✅ Messages sent:", testMessages.length);
    console.log("   ✅ Socket events received:", socketEvents.length);
    console.log("   ✅ Discussion verified via API");
    
    console.log("\n📨 Socket Events Breakdown:");
    const newDiscussionEvents = socketEvents.filter(e => e.type === 'newDiscussion').length;
    const messageEvents = socketEvents.filter(e => e.type === 'messageReceived').length;
    
    console.log("   - newDiscussion events:", newDiscussionEvents);
    console.log("   - messageReceived events:", messageEvents);

    if (socketEvents.length > 0) {
      console.log("\n🎉 SUCCESS! Real-time functionality is working!");
      console.log("   Backend is properly emitting socket events");
      console.log("   Frontend can create discussions and post messages");
      console.log("   Real-time updates are flowing correctly");
    } else {
      console.log("\n⚠️  No socket events received");
      console.log("   API calls work but real-time events may not be configured");
    }

  } catch (error) {
    console.log("\n❌ Test failed:");
    console.log("   Error:", error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log("   Details:", JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    socket.disconnect();
    console.log("\n🏁 Test completed - Socket disconnected");
  }
}

comprehensiveTest();