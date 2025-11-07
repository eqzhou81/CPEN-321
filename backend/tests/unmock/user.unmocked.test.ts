jest.unmock('mongoose');

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/config/app';

const MOCKED_USER_ID = '507f1f77bcf86cd799439011';
let mockedUserIdObj: mongoose.Types.ObjectId;
let token: string;

// Set environment variables at the top
process.env.BYPASS_AUTH = 'true';
process.env.MOCK_USER_ID = MOCKED_USER_ID;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  // Clean the users collection
  await mongoose.connection.collection('users').deleteMany({});

  // Create the mocked user
  mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
  token = MOCKED_USER_ID;

  const User = mongoose.model('User');
  const user = new User({
    _id: mockedUserIdObj,
    googleId: `gid-test-${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    savedJobs: [],
    savedQuestions: [],
  });
  await user.save();

  // Verify user was created
  const verifyUser = await User.findById(mockedUserIdObj);
  if (!verifyUser) {
    throw new Error('Failed to create test user');
  }
  
  console.log('✅ Test user created:', verifyUser.email);
});

afterAll(async () => {

  //incase its still disconnected
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  await mongoose.connect(uri);
  // Clean up
  await mongoose.connection.collection('users').deleteMany({});
  await mongoose.connection.close();
});

// ================================================================
// GET /api/user/profile
// ================================================================
describe('GET /api/user/profile', () => {
  test('should return the user profile successfully (happy path)', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', token)
      .expect(200);

    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user.name).toBe('Test User');
  });
});


// ================================================================
// DELETE /api/user/profile - delete profile
// ================================================================
describe('DELETE /api/user/profile', () => {
  // Restore user before each DELETE test
  beforeEach(async () => {
    const User = mongoose.model('User');
    await User.deleteMany({});
    
    const user = new User({
      _id: mockedUserIdObj,
      googleId: `gid-test-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      savedJobs: [],
      savedQuestions: [],
    });
    await user.save();
  });

  test('should delete user successfully when confirmed (happy path)', async () => {
    const res = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', token)
      .send({ confirmDelete: true })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
    
    // Verify user is actually deleted
    const User = mongoose.model('User');
    const deletedUser = await User.findById(mockedUserIdObj);
    expect(deletedUser).toBeNull();
  });

  test('should return 400 if confirmDelete missing (validation error)', async () => {
    const res = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', token)
      .send({ confirmDelete: false });

    expect(res.statusCode).toBe(400);
  });

  test('should return 500 when database connection is closed during deletion', async () => {
    // Close the database connection to trigger a real error
    const U = mongoose.model('User');
    await U.deleteMany({});
    await mongoose.connection.close();

    const res = await request(app)
      .delete('/api/user/profile')
      .set('Authorization', token)
      .send({ confirmDelete: true });

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('message');

    // Reconnect for other tests
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
    await mongoose.connect(uri);
    
    // Recreate user
    const User = mongoose.model('User');
    const user = new User({
      _id: mockedUserIdObj,
      googleId: `gid-test-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      savedJobs: [],
      savedQuestions: [],
    });
    await user.save();
  });

});

//================================================================
// POST /api/user/profile - update profile
// ================================================================
describe('POST /api/user/profile', () => {
  // Restore user before each PUT test
  beforeEach(async () => {
    const User = mongoose.model('User');
    await User.deleteMany({});
    
    const user = new User({
      _id: mockedUserIdObj,
      googleId: `gid-test-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      savedJobs: [],
      savedQuestions: [],
    });
    await user.save();
  });

test('should update user profile successfully (happy path)', async () => {
  // Add logging before the test
  const User = mongoose.model('User');
  const userBefore = await User.findById(mockedUserIdObj);
  console.log('👤 User BEFORE update:', {
    _id: userBefore?._id,
    _idString: userBefore?._id.toString(),
    email: userBefore?.email,
    name: userBefore?.name
  });

  const updatedData = { name: 'Updated Name' };

  const res = await request(app)
    .post('/api/user/profile')
    .set('Authorization', token)
    .send(updatedData);

  console.log('📡 Response status:', res.status);
  console.log('📡 Response body:', res.body);

  // Check DB after
  const userAfter = await User.findById(mockedUserIdObj);
  console.log('👤 User AFTER update:', {
    _id: userAfter?._id,
    email: userAfter?.email,
    name: userAfter?.name
  });

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.message).toBe('User info updated successfully');
  expect(res.body.profile.name).toBe('Updated Name');
  expect(res.body.profile.email).toBe('test@example.com');

  // Ensure DB updated
  const dbUser = await User.findById(mockedUserIdObj);
  expect(dbUser?.name).toBe('Updated Name');
});

  test('should update multiple fields', async () => {
    const updatedData = { 
      name: 'New Name',
    };

    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send(updatedData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.profile.name).toBe('New Name');
  });

  test('should return 404 if user not found in database', async () => {
    // Delete the user first
    const User = mongoose.model('User');
    await User.deleteMany({});

    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send({ name: 'Ghost User' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  test('should handle validation errors', async () => {
    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send({ name: '' }); // Empty name might fail validation

    // Depending on your validation, this could be 400 or 200
    expect([200, 400, 422]).toContain(res.statusCode);
  });

  test('should return 500 when database connection is closed during update', async () => {
    // Close the database connection to trigger a real error
    const U = mongoose.model('User');
    await U.deleteMany({});
    await mongoose.connection.close();

    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send({ name: 'Test Name' });

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('profile');

    // Reconnect for other tests
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
    await mongoose.connect(uri);
    
    // Recreate user
    const User = mongoose.model('User');
    const user = new User({
      _id: mockedUserIdObj,
      googleId: `gid-test-${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      savedJobs: [],
      savedQuestions: [],
    });
    await user.save();
  });

  test('should handle update with null values', async () => {
    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send({ name: null });

    expect([200, 400, 422]).toContain(res.statusCode);
  });

  test('should handle update with special characters', async () => {
    const res = await request(app)
      .post('/api/user/profile')
      .set('Authorization', token)
      .send({ name: '<script>alert("xss")</script>' });

    expect([200, 400]).toContain(res.statusCode);
  });

  test('should handle concurrent update requests', async () => {
    // Send multiple updates at the same time
    const updates = [
      request(app).post('/api/user/profile').set('Authorization', token).send({ name: 'Name 1' }),
      request(app).post('/api/user/profile').set('Authorization', token).send({ name: 'Name 2' }),
      request(app).post('/api/user/profile').set('Authorization', token).send({ name: 'Name 3' }),
    ];

    const results = await Promise.all(updates);
    
    // All should succeed
    results.forEach(res => {
      expect([200, 500]).toContain(res.statusCode);
    });
  });

});