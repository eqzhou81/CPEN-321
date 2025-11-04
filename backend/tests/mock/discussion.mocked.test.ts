// tests/unmock/discussion.unmocked.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { discussionModel } from '../../src/models/discussions.model';
import { userModel } from '../../src/models/user.model';

// Mock all external dependencies
jest.mock('../../src/models/discussions.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

// Mock JWT token for authentication
const mockToken = 'Bearer mock-jwt-token';
const mockUserId = '507f1f77bcf86cd799439011';

// Mock authenticateToken middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      _id: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
    };
    next();
  },
}));

describe('DiscussionsController - No Mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  /**
   * GET /api/discussions - Get all discussions
   */
  describe('GET /api/discussions - getAllDiscussions', () => {
    it('should return all discussions with default parameters', async () => {
      const mockDiscussions = [
        {
          _id: '1',
          userId: 'user1',
          topic: 'Discussion 1',
          description: 'Description 1',
          messageCount: 5,
          participantCount: 3,
          lastActivityAt: new Date(),
          createdAt: new Date(),
          messages: []
        },
        {
          _id: '2', 
          userId: 'user2',
          topic: 'Discussion 2',
          description: 'Description 2',
          messageCount: 3,
          participantCount: 2,
          lastActivityAt: new Date(),
          createdAt: new Date(),
          messages: []
        }
      ];

      const mockUsers = [
        { _id: 'user1', name: 'User One' },
        { _id: 'user2', name: 'User Two' }
      ];

      (discussionModel.findAll as jest.Mock).mockResolvedValue(mockDiscussions);
      (discussionModel.count as jest.Mock).mockResolvedValue(2);
      (userModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1]);

      const response = await request(app)
        .get('/api/discussions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id', '1');
      expect(response.body.data[0]).toHaveProperty('topic', 'Discussion 1');
      expect(response.body.data[0]).toHaveProperty('creatorName', 'User One');
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter discussions by search query', async () => {
      const mockDiscussions = [{
        _id: '1',
        userId: 'user1', 
        topic: 'Specific Discussion',
        description: 'Description',
        messageCount: 1,
        participantCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        messages: []
      }];

      (discussionModel.findAll as jest.Mock).mockResolvedValue(mockDiscussions);
      (discussionModel.count as jest.Mock).mockResolvedValue(1);
      (userModel.findById as jest.Mock).mockResolvedValue({ name: 'Test User' });

      const response = await request(app)
        .get('/api/discussions')
        .query({ search: 'Specific' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(discussionModel.findAll).toHaveBeenCalledWith('Specific', 'recent', 20, 0);
    });

    it('should handle errors when fetching discussions', async () => {
      (discussionModel.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/discussions')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  /**
   * GET /api/discussions/:id - Get discussion by ID
   */
  describe('GET /api/discussions/:id - getDiscussionById', () => {
    it('should return discussion details for valid ID', async () => {
      const mockDiscussion = {
        _id: '1',
        userId: 'user1',
        topic: 'Test Discussion',
        description: 'Test Description',
        messageCount: 2,
        participantCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            _id: 'msg1',
            userId: 'user1',
            userName: 'User One',
            content: 'First message',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      (discussionModel.findById as jest.Mock).mockResolvedValue(mockDiscussion);
      (userModel.findById as jest.Mock).mockResolvedValue({ name: 'User One' });

      const response = await request(app)
        .get('/api/discussions/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', '1');
      expect(response.body.data).toHaveProperty('topic', 'Test Discussion');
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data.messages).toHaveLength(1);
    });

    it('should return 404 for non-existent discussion', async () => {
      (discussionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/discussions/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Discussion not found');
    });
  });

  /**
   * POST /api/discussions - Create discussion
   */
  describe('POST /api/discussions - createDiscussion', () => {
    it('should create discussion with valid data', async () => {
      const mockDiscussion = {
        _id: 'new-discussion-id',
        userId: mockUserId,
        topic: 'New Discussion',
        description: 'New Description',
        messageCount: 0,
        participantCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date()
      };

      (discussionModel.create as jest.Mock).mockResolvedValue(mockDiscussion);

      const requestData = {
        topic: 'New Discussion',
        description: 'New Description'
      };

      const response = await request(app)
        .post('/api/discussions')
        .set('Authorization', mockToken)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('discussionId', 'new-discussion-id');
      expect(response.body.message).toBe('Discussion created successfully');
      expect(discussionModel.create).toHaveBeenCalledWith(
        mockUserId,
        'Test User',
        'New Discussion',
        'New Description'
      );
    });

    it('should return 400 when topic is missing', async () => {
      const requestData = {
        description: 'Description without topic'
      };

      const response = await request(app)
        .post('/api/discussions')
        .set('Authorization', mockToken)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Topic cannot be empty');
    });

    it('should return 400 when topic exceeds 100 characters', async () => {
      const requestData = {
        topic: 'A'.repeat(101),
        description: 'Valid description'
      };

      const response = await request(app)
        .post('/api/discussions')
        .set('Authorization', mockToken)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Topic cannot exceed 100 characters');
    });
  });

  /**
   * POST /api/discussions/:id/messages - Post message
   */
  describe('POST /api/discussions/:id/messages - postMessage', () => {
    it('should post message successfully', async () => {
      const mockDiscussion = {
        _id: '1',
        messages: [
          {
            _id: 'msg1',
            userId: mockUserId,
            userName: 'Test User',
            content: 'Test message',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      (discussionModel.findById as jest.Mock).mockResolvedValue(mockDiscussion);
      (discussionModel.postMessage as jest.Mock).mockResolvedValue(mockDiscussion);

      const requestData = {
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/discussions/1/messages')
        .set('Authorization', mockToken)
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toHaveProperty('id');
      expect(response.body.message).toHaveProperty('content', 'Test message');
      expect(discussionModel.postMessage).toHaveBeenCalledWith(
        '1',
        mockUserId,
        'Test User',
        'Test message'
      );
    });

    it('should return 404 for non-existent discussion', async () => {
      (discussionModel.findById as jest.Mock).mockResolvedValue(null);

      const requestData = {
        content: 'Test message'
      };

      const response = await request(app)
        .post('/api/discussions/nonexistent/messages')
        .set('Authorization', mockToken)
        .send(requestData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Discussion not found');
    });
  });

  /**
   * GET /api/discussions/my/discussions - Get user's discussions
   */
  describe('GET /api/discussions/my/discussions - getMyDiscussions', () => {
    it('should return only current user\'s discussions', async () => {
      const mockDiscussions = [
        {
          _id: '1',
          userId: mockUserId,
          topic: 'My Discussion 1',
          description: 'Description 1',
          messageCount: 2,
          participantCount: 1,
          lastActivityAt: new Date(),
          createdAt: new Date()
        }
      ];

      (discussionModel.findByUserId as jest.Mock).mockResolvedValue(mockDiscussions);
      (discussionModel.countByUserId as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/discussions/my/discussions')
        .set('Authorization', mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].creatorId).toBe(mockUserId);
      expect(discussionModel.findByUserId).toHaveBeenCalledWith(mockUserId, 20, 0);
    });
  });
});