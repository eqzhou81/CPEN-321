import mongoose from 'mongoose';

// ✅ This setup file runs for unmocked tests - ensures real database connections

console.log('🔧 Setting up unmocked test environment');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';

// Set test environment
process.env.NODE_ENV = 'test';

// Connect to database before tests start
beforeAll(async () => {
  console.log('🔧 Unmocked test setup - connecting to:', uri);

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000, // Increased timeout to 10s
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
      console.error('Make sure MongoDB is running at:', uri);
      // Don't throw - let tests fail individually
    }
  }
}, 15000); // 15 second timeout for beforeAll

afterAll(async () => {
  console.log('🔧 Closing database connection...');
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
}, 10000); // 10 second timeout for afterAll

// Increase timeout for database operations
jest.setTimeout(30000);