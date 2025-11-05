import mongoose from 'mongoose';

// ✅ Suppress noisy console output during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

jest.setTimeout(20000);