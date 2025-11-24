import mongoose from 'mongoose';

// ✅ This setup file runs for unmocked tests - ensures real database connections

console.log('🔧 Setting up unmocked test environment');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';

// Connect to database before tests start
(global as any).beforeAll = (global as any).beforeAll || ((fn: any) => fn());
(global as any).afterAll = (global as any).afterAll || ((fn: any) => fn());
(global as any).jest = (global as any).jest || { setTimeout: () => {} };

(global as any).beforeAll(async () => {
  console.log('🔧 Unmocked test setup - mongoose type:', typeof mongoose.connect);
  console.log('🔧 Unmocked test setup - connection type:', typeof mongoose.connection.collection);

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
        socketTimeoutMS: 45000,
      });
      console.log('✅ Test database connected');
    } catch (error) {
      console.error('❌ Test database connection failed:', error);
      throw error;
    }
  }
});

(global as any).afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Increase timeout for database operations
(global as any).jest.setTimeout(20000);