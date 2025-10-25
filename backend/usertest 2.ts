// createTestUser.ts
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { userModel } from './src/models/user.model';

dotenv.config();

async function createTestUserAndToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    let testUser = await userModel.findByEmail('test@example.com');

    if (testUser) {
      console.log('ℹ️  User already exists, using existing user:');
    } else {
      // Create new test user
      testUser = await userModel.create({
        googleId: 'test-google-id-123',
        email: 'test@example.com',
        name: 'Test User',
      });
      console.log('✅ Test user created:');
    }

    console.log('   User ID:', testUser._id.toString());
    console.log('   Email:', testUser.email);
    console.log('   Name:', testUser.name);

    // Generate JWT token
    const token = jwt.sign(
      { id: testUser._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log('\n🔑 JWT Token (valid for 7 days):');
    console.log(token);
    console.log('\n📋 Copy this for Authorization header:');
    console.log(`Bearer ${token}`);
    console.log('\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

createTestUserAndToken();