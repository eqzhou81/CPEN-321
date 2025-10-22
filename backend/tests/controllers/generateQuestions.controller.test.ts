describe('Integration: generateQuestions with real mock data', () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/api/question/generateQuestions', generateQuestionsController);
    // Mock OpenAI response to return the 5 topics
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: '1. graphs\n2. trees\n3. dynamic programming\n4. hash table\n5. binary search',
            },
          },
        ],
      },
    });

    // Mock LeetCode search results for each topic
    (leetService.search as jest.Mock).mockImplementation((topic: string) => {
      if (topic === 'trees') {
        return Promise.resolve([
          { id: '95', title: 'Unique Binary Search Trees II', url: 'https://leetcode.com/problems/unique-binary-search-trees-ii', difficulty: null, tags: ['tree'] },
          { id: '96', title: 'Unique Binary Search Trees', url: 'https://leetcode.com/problems/unique-binary-search-trees', difficulty: null, tags: ['tree'] },
          { id: '250', title: 'Count Univalue Subtrees', url: 'https://leetcode.com/problems/count-univalue-subtrees', difficulty: null, tags: ['tree'] },
          { id: '98', title: 'Validate Binary Search Tree', url: 'https://leetcode.com/problems/validate-binary-search-tree', difficulty: null, tags: ['tree'] },
          { id: '99', title: 'Recover Binary Search Tree', url: 'https://leetcode.com/problems/recover-binary-search-tree', difficulty: null, tags: ['tree'] },
          { id: '100', title: 'Same Tree', url: 'https://leetcode.com/problems/same-tree', difficulty: null, tags: ['tree'] },
        ]);
      }
      if (topic === 'binary search') {
        return Promise.resolve([
          { id: '95', title: 'Unique Binary Search Trees II', url: 'https://leetcode.com/problems/unique-binary-search-trees-ii', difficulty: null, tags: ['tree'] },
          { id: '96', title: 'Unique Binary Search Trees', url: 'https://leetcode.com/problems/unique-binary-search-trees', difficulty: null, tags: ['tree'] },
          { id: '98', title: 'Validate Binary Search Tree', url: 'https://leetcode.com/problems/validate-binary-search-tree', difficulty: null, tags: ['tree'] },
          { id: '99', title: 'Recover Binary Search Tree', url: 'https://leetcode.com/problems/recover-binary-search-tree', difficulty: null, tags: ['tree'] },
          { id: '100', title: 'Same Tree', url: 'https://leetcode.com/problems/same-tree', difficulty: null, tags: ['tree'] },
          { id: '101', title: 'Symmetric Tree', url: 'https://leetcode.com/problems/symmetric-tree', difficulty: null, tags: ['tree'] },
        ]);
      }
      if (topic === 'graphs') {
        return Promise.resolve([
          { id: '133', title: 'Clone Graph', url: 'https://leetcode.com/problems/clone-graph', difficulty: 'Medium', tags: ['graph'] },
          { id: '200', title: 'Number of Islands', url: 'https://leetcode.com/problems/number-of-islands', difficulty: 'Medium', tags: ['graph'] },
          { id: '207', title: 'Course Schedule', url: 'https://leetcode.com/problems/course-schedule', difficulty: 'Medium', tags: ['graph'] },
        ]);
      }
      if (topic === 'dynamic programming') {
        return Promise.resolve([
          { id: '70', title: 'Climbing Stairs', url: 'https://leetcode.com/problems/climbing-stairs', difficulty: 'Easy', tags: ['dynamic programming'] },
          { id: '198', title: 'House Robber', url: 'https://leetcode.com/problems/house-robber', difficulty: 'Medium', tags: ['dynamic programming'] },
        ]);
      }
      if (topic === 'hash table') {
        return Promise.resolve([
          { id: '1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum', difficulty: 'Easy', tags: ['hash table'] },
          { id: '49', title: 'Group Anagrams', url: 'https://leetcode.com/problems/group-anagrams', difficulty: 'Medium', tags: ['hash table'] },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  it('should return the correct topics and questions structure from real mock data', async () => {
    const jobDescription = 'Looking for a backend engineer with strong algorithm skills.';

    const response = await request(app)
      .post('/api/question/generateQuestions')
      .send({ jobDescription })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(5);

  // Check topics and question counts
  expect(response.body.data[0].topic).toBe('graphs');
  expect(response.body.data[0].questions.length).toBe(3);
  expect(response.body.data[1].topic).toBe('trees');
  expect(response.body.data[1].questions.length).toBe(6);
  expect(response.body.data[2].topic).toBe('dynamic programming');
  expect(response.body.data[2].questions.length).toBe(2);
  expect(response.body.data[3].topic).toBe('hash table');
  expect(response.body.data[3].questions.length).toBe(2);
  expect(response.body.data[4].topic).toBe('binary search');
  expect(response.body.data[4].questions.length).toBe(6);

  // Check sample questions for 'graphs'
  expect(response.body.data[0].questions[0].title).toBe('Clone Graph');
  expect(response.body.data[0].questions[1].title).toBe('Number of Islands');
  expect(response.body.data[0].questions[2].title).toBe('Course Schedule');
  // Check sample questions for 'trees'
  expect(response.body.data[1].questions[0].title).toBe('Unique Binary Search Trees II');
  expect(response.body.data[1].questions[1].title).toBe('Unique Binary Search Trees');
  expect(response.body.data[1].questions[2].title).toBe('Count Univalue Subtrees');
  // Check sample questions for 'dynamic programming'
  expect(response.body.data[2].questions[0].title).toBe('Climbing Stairs');
  expect(response.body.data[2].questions[1].title).toBe('House Robber');
  // Check sample questions for 'hash table'
  expect(response.body.data[3].questions[0].title).toBe('Two Sum');
  expect(response.body.data[3].questions[1].title).toBe('Group Anagrams');
  // Check sample questions for 'binary search'
  expect(response.body.data[4].questions[0].title).toBe('Unique Binary Search Trees II');
  expect(response.body.data[4].questions[1].title).toBe('Unique Binary Search Trees');
  expect(response.body.data[4].questions[2].title).toBe('Validate Binary Search Tree');
  });
});
import request from 'supertest';
import express from 'express';
import axios from 'axios';
import { generateQuestionsController } from '../../src/controllers/generateQuestions.controller';
import * as generateQuestionsService from '../../src/services/generateQuestions.service';
import { leetService } from '../../src/services/leetcode.service';

// Mock the auth middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-id' };
    next();
  },
}));

// Mock axios for OpenAI calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock leetService
jest.mock('../../src/services/leetcode.service', () => ({
  leetService: {
    search: jest.fn(),
  },
}));

describe('Generate Questions Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/api/question/generateQuestions', generateQuestionsController);
    jest.clearAllMocks();
  });

  describe('POST /api/question/generateQuestions', () => {
    beforeEach(() => {
      // Mock OpenAI response
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [
            {
              message: {
                content: 'Based on the job description, I recommend: 1. arrays, 2. hash table, 3. trees, 4. dynamic programming',
              },
            },
          ],
        },
      });

      // Mock LeetCode search results
      (leetService.search as jest.Mock).mockResolvedValue([
        {
          id: '1',
          title: 'Two Sum',
          url: 'https://leetcode.com/problems/two-sum',
          difficulty: 'Easy',
          tags: ['array', 'hash-table'],
        },
        {
          id: '15',
          title: 'Three Sum',
          url: 'https://leetcode.com/problems/three-sum',
          difficulty: 'Medium',
          tags: ['array', 'two-pointers'],
        },
        {
          id: '53',
          title: 'Maximum Subarray',
          url: 'https://leetcode.com/problems/maximum-subarray',
          difficulty: 'Medium',
          tags: ['array', 'dynamic-programming'],
        },
      ]);
    });

    it('should generate questions successfully with valid job description', async () => {
      const jobDescription = 'Looking for a backend engineer with strong algorithm skills.';

      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify structure
      const firstTopic = response.body.data[0];
      expect(firstTopic).toHaveProperty('topic');
      expect(firstTopic).toHaveProperty('questions');
      expect(Array.isArray(firstTopic.questions)).toBe(true);
    });

    it('should return 400 if jobDescription is missing', async () => {
      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('jobDescription');
    });

    it('should return 400 if jobDescription is not a string', async () => {
      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('string');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI API error
      mockedAxios.post.mockRejectedValue(new Error('OpenAI API Error'));

      const jobDescription = 'Test job description';

      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Failed to generate questions');
    });

    it('should handle LeetCode API errors gracefully', async () => {
      // Mock LeetCode search error
      (leetService.search as jest.Mock).mockRejectedValue(new Error('LeetCode API Error'));

      const jobDescription = 'Test job description';

      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should extract topics correctly from OpenAI response', async () => {
      const jobDescription = 'Need someone with graph and tree knowledge';

      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify that the mocked OpenAI response was used
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
          temperature: expect.any(Number),
          max_tokens: expect.any(Number),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          }),
        })
      );

      // Verify LeetCode search was called for each extracted topic
      expect(leetService.search).toHaveBeenCalled();
    });

    it('should limit questions per topic to 6', async () => {
      // Mock more than 6 results
      (leetService.search as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: String(i),
          title: `Question ${i}`,
          url: `https://leetcode.com/problems/question-${i}`,
          difficulty: 'Medium',
          tags: ['array'],
        }))
      );

      const jobDescription = 'Test job description';

      const response = await request(app)
        .post('/api/question/generateQuestions')
        .send({ jobDescription })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Each topic should have at most 6 questions
      response.body.data.forEach((topicResult: any) => {
        expect(topicResult.questions.length).toBeLessThanOrEqual(6);
      });
    });
  });
});
