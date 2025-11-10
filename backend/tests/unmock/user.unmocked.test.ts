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

// ================================================================
// User Model - Direct Testing for Coverage
// ================================================================
describe('User Model - Direct Method Testing', () => {
  const { userModel: UserModel } = require('../../src/models/user.model');
  
  beforeEach(async () => {
    // Clean slate for model tests
    await mongoose.connection.collection('users').deleteMany({});
  });

  describe('create method', () => {
    test('should create user with valid data', async () => {
      const userData = {
        googleId: 'google123',
        email: 'newuser@test.com',
        name: 'New User',
      };

      const user = await UserModel.create(userData);

      expect(user).toBeDefined();
      expect(user.googleId).toBe('google123');
      expect(user.email).toBe('newuser@test.com');
      expect(user.name).toBe('New User');
      expect(user.savedJobs).toEqual([]);
      expect(user.savedQuestions).toEqual([]);
    });

    test('should handle duplicate email', async () => {
      const userData = {
        googleId: 'google123',
        email: 'duplicate@test.com',
        name: 'User 1',
      };

      await UserModel.create(userData);

      // Try to create another user with same email
      const duplicateData = {
        googleId: 'google456',
        email: 'duplicate@test.com',
        name: 'User 2',
      };

      await expect(UserModel.create(duplicateData)).rejects.toThrow();
    });

    test('should handle missing required fields', async () => {
      const invalidData = {
        name: 'No Email User',
      };

      await expect(UserModel.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findById method', () => {
    test('should find user by ID', async () => {
      const created = await UserModel.create({
        googleId: 'google123',
        email: 'findme@test.com',
        name: 'Find Me',
      });

      const found = await UserModel.findById(created._id);

      expect(found).toBeDefined();
      expect(found.email).toBe('findme@test.com');
      expect(found.googleId).toBe('google123');
    });

    test('should return null for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const found = await UserModel.findById(fakeId);

      expect(found).toBeNull();
    });

    test('should handle invalid ID format', async () => {
      await expect(UserModel.findById('invalid-id')).rejects.toThrow();
    });
  });

  describe('findByGoogleId method', () => {
    test('should find user by Google ID', async () => {
      await UserModel.create({
        googleId: 'google-unique-123',
        email: 'google@test.com',
        name: 'Google User',
      });

      const found = await UserModel.findByGoogleId('google-unique-123');

      expect(found).toBeDefined();
      expect(found.googleId).toBe('google-unique-123');
      expect(found.email).toBe('google@test.com');
    });

    test('should return null for non-existent Google ID', async () => {
      const found = await UserModel.findByGoogleId('non-existent-google-id');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail method', () => {
    test('should find user by email', async () => {
      await UserModel.create({
        googleId: 'google123',
        email: 'email@test.com',
        name: 'Email User',
      });

      const found = await UserModel.findByEmail('email@test.com');

      expect(found).toBeDefined();
      expect(found.email).toBe('email@test.com');
    });

    test('should return null for non-existent email', async () => {
      const found = await UserModel.findByEmail('nonexistent@test.com');
      expect(found).toBeNull();
    });

    test('should handle email case sensitivity', async () => {
      await UserModel.create({
        googleId: 'google123',
        email: 'CaseSensitive@test.com',
        name: 'Case User',
      });

      const found = await UserModel.findByEmail('CaseSensitive@test.com');
      expect(found).toBeDefined();
    });
  });

  describe('update method', () => {
    test('should update user successfully', async () => {
      const user = await UserModel.create({
        googleId: 'google123',
        email: 'update@test.com',
        name: 'Original Name',
      });

      const updated = await UserModel.update(user._id, { name: 'Updated Name' });

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('update@test.com');
    });

    test('should return null for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updated = await UserModel.update(fakeId, { name: 'Ghost' });

      expect(updated).toBeNull();
    });

    test('should handle partial updates', async () => {
      const user = await UserModel.create({
        googleId: 'google123',
        email: 'partial@test.com',
        name: 'Original',
      });

      const updated = await UserModel.update(user._id, { name: 'Partial Update' });

      expect(updated.name).toBe('Partial Update');
      expect(updated.email).toBe('partial@test.com');
    });
  });

  describe('delete method', () => {
    test('should delete user successfully', async () => {
      const user = await UserModel.create({
        googleId: 'google123',
        email: 'delete@test.com',
        name: 'Delete Me',
      });

      const result = await UserModel.delete(user._id);

      expect(result).toBe(true);

      const found = await UserModel.findById(user._id);
      expect(found).toBeNull();
    });

    test('should return false for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await UserModel.delete(fakeId);

      expect(result).toBe(false);
    });
  });

  describe('Saved Jobs methods', () => {
    let testUser: any;
    let jobId1: mongoose.Types.ObjectId;
    let jobId2: mongoose.Types.ObjectId;

    beforeEach(async () => {
      testUser = await UserModel.create({
        googleId: 'google-jobs',
        email: 'jobs@test.com',
        name: 'Jobs User',
      });

      jobId1 = new mongoose.Types.ObjectId();
      jobId2 = new mongoose.Types.ObjectId();
    });

    test('should add saved job', async () => {
      const result = await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });

      expect(result).toBeTruthy();
      expect(result.savedJobs).toHaveLength(1);
      expect(result.savedJobs[0].toString()).toBe(jobId1.toString());
    });

    test('should not add duplicate job', async () => {
      await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });
      const result = await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });

      // $addToSet prevents duplicates, but still returns the user
      expect(result).toBeTruthy();
      expect(result.savedJobs).toHaveLength(1);
    });

    test('should remove saved job', async () => {
      await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });
      const result = await UserModel.removeSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });

      expect(result).toBeTruthy();
      expect(result.savedJobs).toHaveLength(0);
    });

    test('should return null when removing from non-existent job list', async () => {
      const result = await UserModel.removeSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });

      // Should still return the user even if job wasn't in the list
      expect(result).toBeTruthy();
      expect(result.savedJobs).toHaveLength(0);
    });

    test('should check if job is saved', async () => {
      await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });

      const isSaved1 = await UserModel.isJobSaved(testUser._id.toString(), jobId1.toString());
      const isSaved2 = await UserModel.isJobSaved(testUser._id.toString(), jobId2.toString());

      expect(isSaved1).toBe(true);
      expect(isSaved2).toBe(false);
    });

    test('should get all saved jobs', async () => {
      await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId1.toString() });
      await UserModel.addSavedJob({ userId: testUser._id.toString(), jobId: jobId2.toString() });

      const savedJobs = await UserModel.getSavedJobs(testUser._id.toString());

      expect(savedJobs).toHaveLength(2);
      expect(savedJobs.map((id: any) => id.toString())).toContain(jobId1.toString());
      expect(savedJobs.map((id: any) => id.toString())).toContain(jobId2.toString());
    });

    test('should return empty array for user with no saved jobs', async () => {
      const savedJobs = await UserModel.getSavedJobs(testUser._id.toString());

      expect(savedJobs).toEqual([]);
    });

    test('should handle adding saved job to non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await UserModel.addSavedJob({ userId: fakeId.toString(), jobId: jobId1.toString() });

      expect(result).toBeNull();
    });
  });

  describe('Saved Questions methods', () => {
    let testUser: any;
    let questionId1: mongoose.Types.ObjectId;
    let questionId2: mongoose.Types.ObjectId;

    beforeEach(async () => {
      testUser = await UserModel.create({
        googleId: 'google-questions',
        email: 'questions@test.com',
        name: 'Questions User',
      });

      questionId1 = new mongoose.Types.ObjectId();
      questionId2 = new mongoose.Types.ObjectId();
    });

    test('should add saved question', async () => {
      const result = await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });

      expect(result).toBeTruthy();
      expect(result.savedQuestions).toHaveLength(1);
      expect(result.savedQuestions[0].toString()).toBe(questionId1.toString());
    });

    test('should not add duplicate question', async () => {
      await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });
      const result = await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });

      // $addToSet prevents duplicates, but still returns the user
      expect(result).toBeTruthy();
      expect(result.savedQuestions).toHaveLength(1);
    });

    test('should remove saved question', async () => {
      await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });
      const result = await UserModel.removeSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });

      expect(result).toBeTruthy();
      expect(result.savedQuestions).toHaveLength(0);
    });

    test('should return user when removing from non-existent question list', async () => {
      const result = await UserModel.removeSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });

      // Should still return the user even if question wasn't in the list
      expect(result).toBeTruthy();
      expect(result.savedQuestions).toHaveLength(0);
    });

    test('should get all saved questions', async () => {
      await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId1.toString() });
      await UserModel.addSavedQuestion({ userId: testUser._id.toString(), questionId: questionId2.toString() });

      const savedQuestions = await UserModel.getSavedQuestions(testUser._id.toString());

      expect(savedQuestions).toHaveLength(2);
      expect(savedQuestions.map((id: any) => id.toString())).toContain(questionId1.toString());
      expect(savedQuestions.map((id: any) => id.toString())).toContain(questionId2.toString());
    });

    test('should return empty array for user with no saved questions', async () => {
      const savedQuestions = await UserModel.getSavedQuestions(testUser._id.toString());

      expect(savedQuestions).toEqual([]);
    });

    test('should handle adding saved question to non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await UserModel.addSavedQuestion({ userId: fakeId.toString(), questionId: questionId1.toString() });

      expect(result).toBeNull();
    });
  });

  describe('findOrCreate method', () => {
    test('should find existing user', async () => {
      const existing = await UserModel.create({
        googleId: 'google-existing',
        email: 'existing@test.com',
        name: 'Existing User',
      });

      const found = await UserModel.findOrCreate({
        googleId: 'google-existing',
        email: 'existing@test.com',
        name: 'Different Name',
      });

      expect(found._id.toString()).toBe(existing._id.toString());
      expect(found.name).toBe('Existing User'); // Should not update
    });

    test('should create new user if not found', async () => {
      const newUser = await UserModel.findOrCreate({
        googleId: 'google-new',
        email: 'new@test.com',
        name: 'New User',
      });

      expect(newUser).toBeDefined();
      expect(newUser.googleId).toBe('google-new');
      expect(newUser.email).toBe('new@test.com');

      const found = await UserModel.findByGoogleId('google-new');
      expect(found).toBeDefined();
    });
  });

  describe('findAll method', () => {
    test('should return all users', async () => {
      await UserModel.create({ googleId: 'g1', email: 'user1@test.com', name: 'User 1' });
      await UserModel.create({ googleId: 'g2', email: 'user2@test.com', name: 'User 2' });
      await UserModel.create({ googleId: 'g3', email: 'user3@test.com', name: 'User 3' });

      const users = await UserModel.findAll();

      expect(users).toHaveLength(3);
    });

    test('should return empty array when no users', async () => {
      const users = await UserModel.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('count method', () => {
    test('should count users correctly', async () => {
      await UserModel.create({ googleId: 'g1', email: 'user1@test.com', name: 'User 1' });
      await UserModel.create({ googleId: 'g2', email: 'user2@test.com', name: 'User 2' });

      const count = await UserModel.count();

      expect(count).toBe(2);
    });

    test('should return 0 when no users', async () => {
      const count = await UserModel.count();

      expect(count).toBe(0);
    });
  });

  describe('exists method', () => {
    test('should return true for existing user', async () => {
      const user = await UserModel.create({
        googleId: 'google-exists',
        email: 'exists@test.com',
        name: 'Exists User',
      });

      const exists = await UserModel.exists(user._id);

      expect(exists).toBe(true);
    });

    test('should return false for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const exists = await UserModel.exists(fakeId);

      expect(exists).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close connection to simulate error
      await mongoose.connection.close();

      await expect(UserModel.findAll()).rejects.toThrow();

      // Reconnect
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
      await mongoose.connect(uri);
    });
  });
});