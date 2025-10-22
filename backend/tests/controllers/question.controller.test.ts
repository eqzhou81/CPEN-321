import request from 'supertest';
import { app } from '../../src/config/index';
import { questionModel } from '../../src/models/question.model';

jest.mock('../../src/models/question.model');
jest.mock('../../src/models/user.model');
import { leetService } from '../../src/services/leetcode.service';

// Mock JWT token for authentication
const mockToken = 'Bearer mock-jwt-token';
const mockUserId = '507f1f77bcf86cd799439011';

// Mock authenticateToken middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      _id: mockUserId,
      email: 'test@example.com',
      googleId: 'mock-google-id',
      name: 'Test User',
      savedJobs: [],
      savedQuestions: [],
    };
    next();
  },
}));

// Mock leet service
// Allow longer timeout for external API calls
jest.setTimeout(20000);

describe('QuestionController', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/question', () => {
    it('should create a question and return it', async () => {
            const questionData = { name: 'Sample Question', link: 'http://example.com', url: 'http://example.com/canonical', difficulty: 'Easy', tags: ['tag1', 'tag2'] };
            const createdQuestion = { _id: '123', ...questionData };
      (questionModel.create as jest.Mock).mockResolvedValue(createdQuestion);

      const response = await request(app)
        .post('/api/question')
        .set('Authorization', mockToken)
        .send(questionData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: createdQuestion._id,
        name: questionData.name,
        link: questionData.link,
        url: questionData.url,
        difficulty: questionData.difficulty,
        tags: questionData.tags,
      });
    });

    it('should handle errors when creating a question', async () => {
      const questionData = { name: 'Sample Question', link: 'http://example.com', tags: ['tag1', 'tag2'] };
      (questionModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/question')
        .set('Authorization', mockToken)
        .send(questionData);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/question/:id', () => {
    it('should return a question by ID', async () => {
      const question = { _id: '1', name: 'Sample Question', link: 'http://example.com', tags: ['tag1', 'tag2'] };
      (questionModel.findById as jest.Mock).mockResolvedValue(question);

      const response = await request(app)
        .get('/api/question/1')
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: question._id,
        name: question.name,
        link: question.link,
        tags: question.tags,
      });
    });

    it('should return 404 if question not found', async () => {
      (questionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/question/1')
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
    });

    it('should handle errors when getting a question', async () => {
      (questionModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/question/1')
        .set('Authorization', mockToken);

      expect(response.status).toBe(500);
    });
  });
    // Add more tests for getAllUserQuestions, getQuestionsByTags, and updateQuestion as needed

    describe('GET /api/question/search', () => {
    it('should return external search results for two sum', async () => {
      // Search API test
      const response = await request(app)
        .get('/api/question/leetCodeSearch')
                .query({ query: 'two sum' });
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            // at least one result should reference two sum in title or URL
            const found = response.body.some((r: any) => {
                const title = (r.title || r.name || '').toString().toLowerCase();
                const url = (r.url || r.link || '').toString().toLowerCase();
                return title.includes('two sum') || url.includes('two-sum') || url.includes('two_sum');
            });
            expect(found).toBe(true);
        });
    });

  describe('GET /api/question/leetCodeSearch persistence', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('persists first external question when not in DB', async () => {
      const external = [{ id: 'ext1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum', difficulty: 'Easy', tags: ['array'] }];
      jest.spyOn(leetService, 'search').mockResolvedValue(external as any);
      jest.spyOn(leetService, 'toCreateInput').mockReturnValue({
        name: external[0].title,
        link: external[0].url,
        url: external[0].url,
        difficulty: external[0].difficulty,
        tags: external[0].tags,
      } as any);

      (questionModel.findByUrl as jest.Mock).mockResolvedValue(null);
      (questionModel.findByName as jest.Mock).mockResolvedValue(null);
      (questionModel.create as jest.Mock).mockResolvedValue({ _id: 'db1', ...external[0] });

      const res = await request(app)
        .get('/api/question/leetCodeSearch')
        .query({ query: 'two sum' });

      expect(res.status).toBe(200);
      expect(leetService.search).toHaveBeenCalledWith('two sum');
      expect(questionModel.findByUrl).toHaveBeenCalledWith(external[0].url);
      expect(questionModel.create).toHaveBeenCalledWith(expect.objectContaining({ name: external[0].title, url: external[0].url }));
    });

    it('does not create if url exists', async () => {
      const external = [{ id: 'ext1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum', difficulty: 'Easy', tags: ['array'] }];
      jest.spyOn(leetService, 'search').mockResolvedValue(external as any);
      jest.spyOn(leetService, 'toCreateInput').mockReturnValue({
        name: external[0].title,
        link: external[0].url,
        url: external[0].url,
        difficulty: external[0].difficulty,
        tags: external[0].tags,
      } as any);

      (questionModel.findByUrl as jest.Mock).mockResolvedValue({ _id: 'existing' } as any);

      const res = await request(app)
        .get('/api/question/leetCodeSearch')
        .query({ query: 'two sum' });

      expect(res.status).toBe(200);
      expect(questionModel.create).not.toHaveBeenCalled();
    });
  });
});