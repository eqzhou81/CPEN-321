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

/**
 * Mock the model (because mongoose is mocked in setup)
 * Include ALL methods that might be called
 */
jest.mock('../../src/models/discussions.model', () => {
  return {
    discussionModel: {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),  // ← Add this
      findByUser: jest.fn(),
      create: jest.fn(),
      addMessage: jest.fn(),
      postMessage: jest.fn(),
    },
    Discussion: {
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn(),
    }
  };
});

import request from 'supertest';
import { app } from '../../src/config/app';
import { discussionModel } from '../../src/models/discussions.model';
import mongoose from 'mongoose';

/**
 * ====================================================================
 * DATABASE ERRORS - getAllDiscussions
 * ====================================================================
 */
describe('GET /api/discussions - Database Errors (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Database connection failure
   * Scenario: Can't test this with real DB without breaking connection
   */
  test('should return 500 when database connection fails', async () => {
    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(
      new Error('ECONNREFUSED: Connection refused')
    );

    await request(app)
      .get('/api/discussions')
      .expect(500);

    expect(discussionModel.findAll).toHaveBeenCalled();
  });

  /**
   * Test: Database timeout
   * Scenario: Hard to reproduce consistently with real DB
   */
  test('should return 500 on database timeout', async () => {
    const timeoutError: any = new Error('Operation timed out after 30000ms');
    timeoutError.name = 'MongooseError';

    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(timeoutError);

    await request(app)
      .get('/api/discussions')
      .expect(500);
  });

  /**
   * Test: Network error during query
   * Scenario: Impossible to test reliably with real DB
   */
  test('should return 500 on network error', async () => {
    const networkError: any = new Error('ENOTFOUND');
    networkError.code = 'ENOTFOUND';

    (discussionModel.findAll as jest.Mock).mockRejectedValueOnce(networkError);

    await request(app)
      .get('/api/discussions')
      .expect(500);
  });

  /**
   * Test: Unexpected null return
   * Scenario: Database returns null when it shouldn't
   */
  test('should handle unexpected null from database', async () => {
    (discussionModel.findAll as jest.Mock).mockResolvedValueOnce(null);

    await request(app)
      .get('/api/discussions')
      .expect(500);
  });
});

/**
 * ====================================================================
 * DATABASE ERRORS - getDiscussionById
 * ====================================================================
 */
describe('GET /api/discussions/:id - Database Errors (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Database error during findById
   * Scenario: Database crashes mid-query
   */
  test('should return 500 when database fails during findById', async () => {
    (discussionModel.findById as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );

    await request(app)
      .get('/api/discussions/507f1f77bcf86cd799439011')
      .expect(500);
  });
});

/**
 * ====================================================================
 * DATABASE ERRORS - createDiscussion
 * ====================================================================
 */
describe('POST /api/discussions - Database Errors (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Database insert failure
   * Scenario: Database rejects insert (disk full, etc)
   */
  test('should return 500 when database fails to insert', async () => {
    (discussionModel.create as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to insert document')
    );

    const validData = {
      topic: 'Valid Topic',
      description: 'Valid description',
    };

    await request(app)
      .post('/api/discussions')
      .send(validData)
      .expect(500);

    expect(discussionModel.create).toHaveBeenCalled();
  });

  /**
   * Test: Database returns null on create
   * Scenario: Create succeeds but returns null (defensive programming)
   */
  test('should return 500 when create returns null', async () => {
    (discussionModel.create as jest.Mock).mockResolvedValueOnce(null);

    const validData = {
      topic: 'Valid Topic',
      description: 'Valid description',
    };

    await request(app)
      .post('/api/discussions')
      .send(validData)
      .expect(500);
  });
});

/**
 * ====================================================================
 * DATABASE ERRORS - postMessage
 * ====================================================================
 */
describe('POST /api/discussions/:id/messages - Database Errors (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: postMessage returns null
   * Scenario: Discussion exists but message fails to add (race condition)
   */
  test('should return 500 when postMessage returns null', async () => {
    // Mock findById to return discussion (passes 404 check)
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
    };

    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    // Mock postMessage to return null (defensive programming case)
    (discussionModel.postMessage as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Test message' })
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Failed to post message');
  });

  /**
   * Test: Race condition - discussion deleted between findById and postMessage
   * Scenario: Discussion exists during check, deleted before message posted
   */
  test('should handle race condition when discussion deleted mid-operation', async () => {
    // Discussion exists during findById
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
    };

    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    // But deleted before postMessage (returns null)
    (discussionModel.postMessage as jest.Mock).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Test message' })
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Failed to post message');
  });

  /**
   * Test: Database throws error during message post
   * Scenario: Database fails mid-write
   */
  test('should return 500 when postMessage throws error', async () => {
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
    };

    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    (discussionModel.postMessage as jest.Mock).mockRejectedValueOnce(
      new Error('Database write failed')
    );

    await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Test message' })
      .expect(500);
  });
});

/**
 * ====================================================================
 * DATABASE ERRORS - getMyDiscussions
 * ====================================================================
 */
describe('GET /api/discussions/my/discussions - Database Errors (Mocked)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test: Database connection lost
   * Scenario: Connection drops during query
   */
  test('should return 500 when database connection lost', async () => {
    (discussionModel.findByUser as jest.Mock).mockRejectedValueOnce(
      new Error('Database connection lost')
    );

    await request(app)
      .get('/api/discussions/my/discussions')
      .expect(500);

    expect(discussionModel.findByUser).toHaveBeenCalled();
  });

  /**
   * Test: Database timeout
   * Scenario: Query takes too long
   */
  test('should return 500 on database timeout', async () => {
    const timeoutError: any = new Error('Operation timed out after 30000ms');
    timeoutError.name = 'MongooseError';

    (discussionModel.findByUser as jest.Mock).mockRejectedValueOnce(timeoutError);

    await request(app)
      .get('/api/discussions/my/discussions')
      .expect(500);
  });

  /**
   * Test: Unexpected error type
   * Scenario: Unknown error from database
   */
  test('should return 500 for unexpected error', async () => {
    (discussionModel.findByUser as jest.Mock).mockRejectedValueOnce(
      new Error('Something went wrong')
    );

    await request(app)
      .get('/api/discussions/my/discussions')
      .expect(500);
  });
});

// /**
//  * ====================================================================
//  * SOCKET.IO ERRORS
//  * ====================================================================
//  */
describe('Socket.IO Error Handling (Mocked)', () => {
  let consoleErrorSpy;
  let originalIo;

  beforeEach(() => {
    // Spy on console.error to verify silent logging
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    originalIo = app.get('io');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Restore original io after each test
    if (originalIo) {
      app.set('io', originalIo);
    }
    jest.clearAllMocks();
  });

  /**
   * Test: Socket.IO emit fails silently
   * Scenario: io.emit throws error but API still succeeds
   */
  test('should handle Socket.IO emit failure gracefully', async () => {
    // Mock successful create
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
      description: 'Test',
      userId: '507f1f77bcf86cd799439012',
      creatorName: 'Test User',
      messageCount: 0,
      participantCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      toObject: function() {
        return {
          id: this._id.toString(),
          topic: this.topic,
          description: this.description,
          creatorName: this.creatorName,
          messageCount: this.messageCount,
          participantCount: this.participantCount,
          createdAt: this.createdAt.toISOString(),
          updatedAt: this.updatedAt.toISOString(),
        };
      }
    };

    (discussionModel.create as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    // Create a proper mock that supports the chain: io.to(id).emit()
    const mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn().mockImplementationOnce(() => {
        throw new Error('Socket.IO connection failed');
      })
    };

    // Replace the app's io with our mock
    app.set('io', mockIo);

    const response = await request(app)
      .post('/api/discussions')
      .send({ topic: 'Test', description: 'Test' })
      .expect(201);

    // API still succeeds even if socket fails
    expect(response.body.success).toBe(true);
    
    // Verify error was logged silently
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Socket.IO notification failed:',
      'Socket.IO connection failed'
    );

    // Verify socket was attempted
    expect(mockIo.to).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    expect(mockIo.emit).toHaveBeenCalledWith('messageReceived', expect.any(Object));
  });

  /**
   * Test: Socket.IO undefined
   * Scenario: io not initialized
   */
  test('should handle missing Socket.IO gracefully', async () => {
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
      description: 'Test',
      userId: '507f1f77bcf86cd799439012',
      creatorName: 'Test User',
      toObject: function() {
        return {
          id: this._id.toString(),
          topic: this.topic,
          description: this.description,
          creatorName: this.creatorName,
        };
      }
    };

    (discussionModel.create as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    // Set io to undefined
    app.set('io', undefined);

    const response = await request(app)
      .post('/api/discussions')
      .send({ topic: 'Test', description: 'Test' })
      .expect(201);

    expect(response.body.success).toBe(true);
    
    // No error should be logged when io is undefined
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  /**
   * Test: Socket.IO emit on room fails
   * Scenario: Emitting to specific room fails but API succeeds
   */
  test('should handle room emit failure gracefully', async () => {
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
    };

    const mockUpdatedDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      messages: [
        {
          _id: { toString: () => '507f1f77bcf86cd799439013' },
          userId: '507f1f77bcf86cd799439012',
          userName: 'Test User',
          content: 'Test message',
          createdAt: new Date(),
        }
      ],
    };

    (discussionModel.findById as jest.Mock).mockResolvedValueOnce(mockDiscussion);
    (discussionModel.postMessage as jest.Mock).mockResolvedValueOnce(mockUpdatedDiscussion);

    // Mock that supports the chain and throws error
    const mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn().mockImplementationOnce(() => {
        throw new Error('Room emit failed');
      })
    };

    app.set('io', mockIo);

    const response = await request(app)
      .post('/api/discussions/507f1f77bcf86cd799439011/messages')
      .send({ content: 'Test message' })
      .expect(201);

    // API still succeeds
    expect(response.body.success).toBe(true);
    
    // Error was logged silently
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Socket.IO notification failed:',
      'Room emit failed'
    );
  });

  /**
   * Test: Multiple socket operations with partial failures
   */
  test('should handle partial Socket.IO failures', async () => {
    const mockDiscussion = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      topic: 'Test Discussion',
      userId: '507f1f77bcf86cd799439012',
      toObject: function() {
        return {
          id: this._id.toString(),
          topic: this.topic,
          userId: this.userId,
        };
      }
    };

    (discussionModel.create as jest.Mock).mockResolvedValueOnce(mockDiscussion);

    // Mock that fails on specific emits but not others
    let emitCount = 0;
    const mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn().mockImplementation(() => {
        emitCount++;
        if (emitCount === 1) {
          throw new Error('First emit failed');
        }
        // Second emit succeeds
      })
    };

    app.set('io', mockIo);

    const response = await request(app)
      .post('/api/discussions')
      .send({ topic: 'Test', description: 'Test' })
      .expect(201);

    expect(response.body.success).toBe(true);
    
    // Only one error should be logged (for the first failed emit)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

/**
 * ====================================================================
 * SUMMARY
 * ====================================================================
 * 
 * These tests cover error scenarios that are:
 * 1. Impossible to test with real DB (connection failures, timeouts)
 * 2. Race conditions (hard to reproduce consistently)
 * 3. Defensive programming checks (null returns when shouldn't happen)
 * 4. Socket.IO failures (emit errors, missing io)
 * 
 * Combined with unmocked tests, we achieve comprehensive coverage:
 * - Unmocked: Happy paths, validation, 404s, basic CRUD
 * - Mocked: Database failures, edge cases, Socket.IO errors
 * 
 * Total Coverage Goal: 95%+ on discussions.controller.ts
 */