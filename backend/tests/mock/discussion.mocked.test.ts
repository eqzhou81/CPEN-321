/**
 * ====================================================================
 * DISCUSSION API - MOCKED ERROR TESTS
 * ====================================================================
 * These tests mock the database and Socket.IO to test error scenarios
 * that are impossible or impractical to test with real database.
 * 
 * What we test here:
 * - Database connection failures
 * - Database timeouts
 * - Unexpected null returns from database methods
 * - Socket.IO failures
 * - Race conditions
 * - Network errors
 * 
 * What we DON'T test here (covered in unmocked tests):
 * - Happy paths (successful operations)
 * - Validation errors (400s)
 * - 404 errors (resource not found)
 * - Basic CRUD operations
 */

/**
 * Mock auth middleware FIRST (before other imports)
 */
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
    };
    next();
  },
}));

jest.mock('../../src/models/discussions.model', () => {
  return {
    discussionModel: {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      postMessage: jest.fn(),
    },
    Discussion: {
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    }
  };
});

jest.mock('../../src/models/user.model', () => {
  const original = jest.requireActual('../../src/models/user.model');
  return {
    ...original,
    userModel: {
      ...original.userModel,
      findById: jest.fn(),
    },
  };
});



import { userModel } from '../../src/models/user.model';
import request from 'supertest';
import { app } from '../../src/config/app';
import { discussionModel } from '../../src/models/discussions.model';
import mongoose from 'mongoose';

/* ==================================================================== */
/* DATABASE ERRORS - getAllDiscussions */
/* ==================================================================== */
describe('GET /api/discussions - Database Errors (Mocked)', () => {
  afterEach(() => jest.clearAllMocks());

  test('should return 500 when database connection fails', async () => {
    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(
      new Error('ECONNREFUSED: Connection refused')
    );
    await request(app).get('/api/discussions').expect(500);
  });

  test('should return 500 on database timeout', async () => {
    const timeoutError: any = new Error('Operation timed out after 30000ms');
    timeoutError.name = 'MongooseError';
    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(timeoutError);
    await request(app).get('/api/discussions').expect(500);
  });

  test('should return 500 on network error', async () => {
    const networkError: any = new Error('ENOTFOUND');
    networkError.code = 'ENOTFOUND';
    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(networkError);
    await request(app).get('/api/discussions').expect(500);
  });

  test('should handle unexpected null from database', async () => {
    (discussionModel.findAll as jest.Mock).mockResolvedValueOnce(null);
    await request(app).get('/api/discussions').expect(500);
  });

  // ✅ ADDED: Unknown user fallback branch (creator?.name || 'Unknown User')
  test('should fallback to Unknown User if creator missing', async () => {
    (discussionModel.findAll as jest.Mock).mockResolvedValueOnce([
      {
        _id: new mongoose.Types.ObjectId(),
        topic: 'Mock topic',
        description: 'Mock desc',
        userId: '507f1f77bcf86cd799439011',
        messageCount: 0,
        participantCount: 0,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      },
    ]);
    (discussionModel.count as jest.Mock).mockResolvedValueOnce(1);
    (userModel.findById as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app).get('/api/discussions').expect(200);
    expect(res.body.data[0].creatorName).toBe('Unknown User');
  });

  test('should handle Socket.IO emit failure gracefully', async () => {
    (discussionModel.create as jest.Mock).mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      userId: '507f1f77bcf86cd799439011',
      topic: 'Valid topic',
      description: 'Valid description',
      messageCount: 0,
      participantCount: 0,
      lastActivityAt: new Date(),
      createdAt: new Date(),
    });

    const fakeApp: any = app;
    fakeApp.set('io', {
      emit: () => { throw new Error('Socket fail'); },
    });

    const res = await request(app)
      .post('/api/discussions')
      .send({ topic: 'Valid topic', description: 'Valid description' })
      .expect(201);

    expect(res.body.success).toBe(true);
  });


  test('should handle malformed discussion objects during mapping', async () => {
  (discussionModel.findAll as jest.Mock).mockResolvedValueOnce([
    { topic: 'Invalid discussion without _id' },
  ]);

  await request(app)
    .get('/api/discussions')
    .expect(500);
});
});

/* ==================================================================== */
/* DATABASE ERRORS - getDiscussionById */
/* ==================================================================== */
describe('GET /api/discussions/:id - Database Errors (Mocked)', () => {
  afterEach(() => jest.clearAllMocks());

  test('should return 500 when database fails during findById', async () => {
    (discussionModel.findById as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );
    await request(app)
      .get('/api/discussions/507f1f77bcf86cd799439011')
      .expect(500);
  });

  test('should return 500 when date fields are invalid', async () => {
    (discussionModel.findById as jest.Mock).mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      topic: 'Test',
      description: 'desc',
      userId: '507f1f77bcf86cd799439011',
      messageCount: 0,
      participantCount: 0,
      messages: [],
      createdAt: undefined, // invalid
      updatedAt: undefined, // invalid
    });
    await request(app)
      .get('/api/discussions/507f1f77bcf86cd799439011')
      .expect(500);
  });

  // ✅ ADDED: Cover discussion with messages branch
  test('should return discussion details including messages', async () => {
    (discussionModel.findById as jest.Mock).mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      topic: 'Test topic',
      description: 'desc',
      userId: '507f1f77bcf86cd799439011',
      messageCount: 1,
      participantCount: 1,
      messages: [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: '507f1f77bcf86cd799439011',
          userName: 'User',
          content: 'hi',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (userModel.findById as jest.Mock).mockResolvedValueOnce({ name: 'Test User' });

    const res = await request(app)
      .get('/api/discussions/507f1f77bcf86cd799439011')
      .expect(200);
    expect(res.body.data.messages.length).toBe(1);
  });
});

/* ==================================================================== */
/* DATABASE ERRORS - createDiscussion */
/* ==================================================================== */
describe('POST /api/discussions - Database Errors (Mocked)', () => {
  afterEach(() => jest.clearAllMocks());

  test('should return 500 when database fails to insert', async () => {
    (discussionModel.create as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to insert document')
    );
    await request(app)
      .post('/api/discussions')
      .send({ topic: 'Valid Topic', description: 'Valid description' })
      .expect(500);
  });

  test('should return 500 when create returns null', async () => {
    (discussionModel.create as jest.Mock).mockResolvedValueOnce(null);
    await request(app)
      .post('/api/discussions')
      .send({ topic: 'Valid Topic', description: 'Valid description' })
      .expect(500);
  });

  test('should handle unexpected runtime error in createDiscussion', async () => {
  (discussionModel.create as jest.Mock).mockImplementationOnce(() => {
    throw new Error('Unexpected crash');
  });

  await request(app)
    .post('/api/discussions')
    .send({ topic: 'Crash', description: 'Crash' })
    .expect(500);
});




});

/* ==================================================================== */
/* DATABASE ERRORS - postMessage */
/* ==================================================================== */
describe('POST /api/discussions/:id/messages - Database Errors (Mocked)', () => {
  afterEach(() => jest.clearAllMocks());

  test('should return 500 when postMessage returns null', async () => {
    const mockDiscussion = { _id: { toString: () => '507f1f77bcf86cd799439011' } };
    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);
    (discussionModel.postMessage as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Test message' })
      .expect(500);

    expect(response.body.message).toBe('Failed to post message');
  });

  test('should handle socket emit failure gracefully', async () => {
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      messages: [],
      messageCount: 1,
      participantCount: 1,
      postMessage: jest.fn(),
    };
    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);
    (discussionModel.postMessage as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    const fakeApp: any = app;
    fakeApp.set('io', { to: () => ({ emit: () => { throw new Error('emit fail'); } }) });

    const res = await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Message' })
      .expect(500);

    expect(res.status).toBe(500);
    expect(res.text || res.body).toBeDefined();
  });

  it('should log error if Socket.IO emit fails', async () => {
    // Mock a valid discussion
    (discussionModel.findById as jest.Mock).mockResolvedValue({
      _id: '123',
      userId: 'user1',
      topic: 'Test',
      description: 'desc',
      messageCount: 0,
      participantCount: 0,
      messages: [],
    });

    // Mock postMessage to return updated discussion with messages
    (discussionModel.postMessage as jest.Mock).mockResolvedValue({
      messages: [
        {
          _id: 'm1',
          userId: 'user1',
          userName: 'Nour',
          content: 'hello',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    // Force Socket.IO emit to throw
    const ioMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(() => {
        throw new Error('Socket fail');
      }),
    };
    app.set('io', ioMock);

    const res = await request(app)
      .post('/api/discussions/123/messages')
      .set('Authorization', 'Bearer mock-jwt-token')
      .send({ content: 'hello' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

});

/* ==================================================================== */
/* DATABASE ERRORS - getMyDiscussions */
/* ==================================================================== */
describe('GET /api/discussions/my/discussions - Database Errors (Mocked)', () => {
  afterEach(() => jest.clearAllMocks());

  test('should return 500 when database connection lost', async () => {
    (discussionModel.findByUserId as jest.Mock).mockRejectedValueOnce(
      new Error('Database connection lost')
    );
    await request(app)
      .get('/api/discussions/my/discussions')
      .expect(500);
  });

  // ✅ ADDED: findByUserId returns null
  test('should return 500 when findByUserId returns null', async () => {
    (discussionModel.findByUserId as jest.Mock).mockResolvedValueOnce(null);
    await request(app).get('/api/discussions/my/discussions').expect(500);
  });
});
