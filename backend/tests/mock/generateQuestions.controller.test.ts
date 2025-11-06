import request from 'supertest';
import { app } from '../../src/config/app';
import { questionModel } from '../../src/models/question.model';
import { generateQuestions } from '../../src/services/generateQuestions.service';
import { QuestionType } from '../../src/types/questions.types';

jest.mock('../../src/models/question.model');
jest.mock('../../src/services/generateQuestions.service');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

// Mock JWT token for authentication
const mockToken = 'Bearer mock-jwt-token';
const mockUserId = '507f1f77bcf86cd799439011';
const mockJobId = '507f1f77bcf86cd799439022';

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

describe('GenerateQuestionsController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Clean up any open handles
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe('POST /api/questions/generateQuestions', () => {
        it('should generate questions successfully', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer with React and Node.js experience',
                jobId: mockJobId
            };

            const mockGeneratedResult = [
                {
                    topic: 'arrays',
                    questions: [
                        {
                            id: '1',
                            title: 'Two Sum',
                            url: 'https://leetcode.com/problems/two-sum/',
                            difficulty: 'easy',
                            tags: ['array', 'hash-table']
                        },
                        {
                            id: '15',
                            title: 'Three Sum',
                            url: 'https://leetcode.com/problems/three-sum/',
                            difficulty: 'medium',
                            tags: ['array', 'two-pointers']
                        }
                    ]
                },
                {
                    topic: 'trees',
                    questions: [
                        {
                            id: '104',
                            title: 'Maximum Depth of Binary Tree',
                            url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
                            difficulty: 'easy',
                            tags: ['tree', 'dfs']
                        }
                    ]
                }
            ];

            const mockCreatedQuestions = [
                {
                    _id: '1',
                    type: QuestionType.TECHNICAL,
                    title: 'Two Sum',
                    description: 'LeetCode problem for arrays',
                    difficulty: 'easy',
                    tags: ['array', 'hash-table'],
                    externalUrl: 'https://leetcode.com/problems/two-sum/'
                },
                {
                    _id: '2',
                    type: QuestionType.TECHNICAL,
                    title: 'Three Sum',
                    description: 'LeetCode problem for arrays',
                    difficulty: 'medium',
                    tags: ['array', 'two-pointers'],
                    externalUrl: 'https://leetcode.com/problems/three-sum/'
                },
                {
                    _id: '3',
                    type: QuestionType.TECHNICAL,
                    title: 'Maximum Depth of Binary Tree',
                    description: 'LeetCode problem for trees',
                    difficulty: 'easy',
                    tags: ['tree', 'dfs'],
                    externalUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/'
                }
            ];

            (generateQuestions as jest.Mock).mockResolvedValue(mockGeneratedResult);
            (questionModel.deleteByJobId as jest.Mock).mockResolvedValue(true);
            (questionModel.create as jest.Mock)
                .mockResolvedValueOnce(mockCreatedQuestions[0])
                .mockResolvedValueOnce(mockCreatedQuestions[1])
                .mockResolvedValueOnce(mockCreatedQuestions[2]);

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockGeneratedResult);
            expect(response.body.storedQuestions).toBe(3);

            // Verify service was called with correct parameters
            expect(generateQuestions).toHaveBeenCalledWith(requestData.jobDescription);

            // Verify database operations
            expect(questionModel.deleteByJobId).toHaveBeenCalledWith(
                expect.any(Object), // mongoose ObjectId
                expect.any(Object)  // mongoose ObjectId
            );
            expect(questionModel.create).toHaveBeenCalledTimes(3);
        });

        it('should return 400 if jobDescription is missing', async () => {
            const requestData = {
                jobId: mockJobId
            };

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('jobDescription is required and must be a string');
        });

        it('should return 400 if jobDescription is not a string', async () => {
            const requestData = {
                jobDescription: 123,
                jobId: mockJobId
            };

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('jobDescription is required and must be a string');
        });

        it('should return 400 if jobId is missing', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer'
            };

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('jobId is required');
        });

        it('should handle service errors gracefully', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer',
                jobId: mockJobId
            };

            (generateQuestions as jest.Mock).mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to generate questions');
            expect(response.body.error).toBe('Service error');
        });

        it('should handle database errors gracefully and continue', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer',
                jobId: mockJobId
            };

            const mockGeneratedResult = [
                {
                    topic: 'arrays',
                    questions: [
                        {
                            id: '1',
                            title: 'Two Sum',
                            url: 'https://leetcode.com/problems/two-sum/',
                            difficulty: 'easy',
                            tags: ['array', 'hash-table']
                        }
                    ]
                }
            ];

            (generateQuestions as jest.Mock).mockResolvedValue(mockGeneratedResult);
            (questionModel.deleteByJobId as jest.Mock).mockResolvedValue(true);
            (questionModel.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockGeneratedResult);
            expect(response.body.storedQuestions).toBe(0); // No questions stored due to error
        });

        it('should handle questions with missing difficulty and default to medium', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer',
                jobId: mockJobId
            };

            const mockGeneratedResult = [
                {
                    topic: 'arrays',
                    questions: [
                        {
                            id: '1',
                            title: 'Two Sum',
                            url: 'https://leetcode.com/problems/two-sum/',
                            // no difficulty field
                            tags: ['array', 'hash-table']
                        }
                    ]
                }
            ];

            const mockCreatedQuestion = {
                _id: '1',
                type: QuestionType.TECHNICAL,
                title: 'Two Sum',
                description: 'LeetCode problem for arrays',
                difficulty: 'medium', // should default to medium
                tags: ['array', 'hash-table'],
                externalUrl: 'https://leetcode.com/problems/two-sum/'
            };

            (generateQuestions as jest.Mock).mockResolvedValue(mockGeneratedResult);
            (questionModel.deleteByJobId as jest.Mock).mockResolvedValue(true);
            (questionModel.create as jest.Mock).mockResolvedValue(mockCreatedQuestion);

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.storedQuestions).toBe(1);

            // Verify that the question was created with medium difficulty as default
            expect(questionModel.create).toHaveBeenCalledWith(
                expect.any(Object), // userId
                expect.objectContaining({
                    difficulty: 'medium'
                })
            );
        });

        it('should handle empty questions array', async () => {
            const requestData = {
                jobDescription: 'Looking for a software engineer',
                jobId: mockJobId
            };

            const mockGeneratedResult = [
                {
                    topic: 'arrays',
                    questions: [] // empty questions array
                }
            ];

            (generateQuestions as jest.Mock).mockResolvedValue(mockGeneratedResult);
            (questionModel.deleteByJobId as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .post('/api/questions/generateQuestions')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockGeneratedResult);
            expect(response.body.storedQuestions).toBe(0);

            // Verify that questionModel.create was not called since no questions to create
            expect(questionModel.create).not.toHaveBeenCalled();
        });
    });
});