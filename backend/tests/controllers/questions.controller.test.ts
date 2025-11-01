import request from 'supertest';
import { app } from '../../src/app';
import { questionModel } from '../../src/models/question.model';
import { jobApplicationModel } from '../../src/models/jobApplication.model';
import { sessionModel } from '../../src/models/session.model';
import { openaiService } from '../../src/services/openai.service';
import { QuestionType, QuestionStatus } from '../../src/types/questions.types';

jest.mock('../../src/models/question.model');
jest.mock('../../src/models/jobApplication.model');
jest.mock('../../src/models/session.model');
jest.mock('../../src/services/openai.service');
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

describe('QuestionsController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Clean up any open handles
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe('POST /api/questions/generate', () => {
        it('should generate questions successfully', async () => {
            const requestData = {
                jobId: mockJobId,
                types: [QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
                count: 10
            };

            const mockJobApplication = {
                _id: mockJobId,
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Develop software applications'
            };

            const mockGeneratedQuestions = [
                {
                    _id: '1',
                    type: QuestionType.BEHAVIORAL,
                    title: 'Tell me about a time you faced a challenge',
                    description: 'Behavioral question about challenges',
                    tags: ['leadership', 'problem-solving']
                },
                {
                    _id: '2',
                    type: QuestionType.TECHNICAL,
                    title: 'Two Sum',
                    difficulty: 'easy',
                    externalUrl: 'https://leetcode.com/problems/two-sum/'
                }
            ];

            (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
            (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
            (questionModel.deleteByJobId as jest.Mock).mockResolvedValue(true);
            (questionModel.createMany as jest.Mock).mockResolvedValue(mockGeneratedQuestions);
            (openaiService.generateBehavioralQuestions as jest.Mock).mockResolvedValue([
                { question: 'Tell me about a time you faced a challenge', context: 'Behavioral question about challenges', tips: ['leadership', 'problem-solving'] }
            ]);

            const response = await request(app)
                .post('/api/questions/generate')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Questions generated successfully');
            expect(response.body.data).toHaveProperty('behavioralQuestions');
            expect(response.body.data).toHaveProperty('technicalQuestions');
            expect(response.body.data).toHaveProperty('totalQuestions');
        });

        it('should return 400 if job ID is missing', async () => {
            const requestData = {
                types: [QuestionType.BEHAVIORAL],
                count: 5
            };

            const response = await request(app)
                .post('/api/questions/generate')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Job ID is required');
        });

        it('should return 404 if job not found', async () => {
            const requestData = {
                jobId: mockJobId,
                types: [QuestionType.BEHAVIORAL],
                count: 5
            };

            (jobApplicationModel.findById as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/questions/generate')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Job application not found');
        });
    });

    describe('GET /api/questions/job/:jobId', () => {
        it('should return questions for a job', async () => {
            const mockQuestions = [
                {
                    _id: '1',
                    type: QuestionType.BEHAVIORAL,
                    title: 'Sample behavioral question',
                    description: 'Description',
                    tags: []
                },
                {
                    _id: '2',
                    type: QuestionType.TECHNICAL,
                    title: 'Sample technical question',
                    difficulty: 'medium',
                    externalUrl: 'https://leetcode.com/problems/example'
                }
            ];

            const mockJobApplication = {
                _id: mockJobId,
                title: 'Software Engineer',
                company: 'Tech Corp'
            };

            (questionModel.findByJobAndType as jest.Mock).mockResolvedValue(mockQuestions);
            (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);

            const response = await request(app)
                .get(`/api/questions/job/${mockJobId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Questions fetched successfully');
            expect(response.body.data).toHaveProperty('behavioralQuestions');
            expect(response.body.data).toHaveProperty('technicalQuestions');
            expect(response.body.data).toHaveProperty('totalQuestions');
        });

        it('should handle errors when fetching questions', async () => {
            (questionModel.findByJobAndType as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get(`/api/questions/job/${mockJobId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to fetch questions');
        });
    });

    describe('PUT /api/questions/:questionId/toggle', () => {
        it('should toggle question completion status', async () => {
            const questionId = '507f1f77bcf86cd799439033';
            const mockCurrentQuestion = {
                _id: questionId,
                status: QuestionStatus.PENDING,
                type: QuestionType.BEHAVIORAL,
                title: 'Sample question'
            };

            const mockUpdatedQuestion = {
                ...mockCurrentQuestion,
                status: QuestionStatus.COMPLETED
            };

            (questionModel.findById as jest.Mock).mockResolvedValue(mockCurrentQuestion);
            (questionModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedQuestion);

            const response = await request(app)
                .put(`/api/questions/${questionId}/toggle`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe(`Question marked as ${QuestionStatus.COMPLETED}`);
            expect(response.body.data).toHaveProperty('question');
        });

        it('should return 404 if question not found', async () => {
            const questionId = '507f1f77bcf86cd799439033';
            (questionModel.findById as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .put(`/api/questions/${questionId}/toggle`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Question not found');
        });
    });

    describe('GET /api/questions/job/:jobId/progress', () => {
        it('should return question progress for a job', async () => {
            const mockProgress = {
                technical: { total: 5, completed: 2 },
                behavioral: { total: 3, completed: 1 },
                overall: { total: 8, completed: 3 }
            };

            (questionModel.getProgressByJob as jest.Mock).mockResolvedValue(mockProgress);

            const response = await request(app)
                .get(`/api/questions/job/${mockJobId}/progress`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Question progress fetched successfully');
            expect(response.body.data).toHaveProperty('progress');
            expect(response.body.data.progress).toEqual(mockProgress);
        });
    });

    describe('POST /api/questions/behavioral/submit', () => {
        it('should submit behavioral answer and return feedback', async () => {
            const questionId = '507f1f77bcf86cd799439033';
            const requestData = {
                questionId,
                answer: 'This is my answer to the behavioral question.'
            };

            const mockQuestion = {
                _id: questionId,
                type: QuestionType.BEHAVIORAL,
                title: 'Tell me about a challenge you faced'
            };

            const mockFeedback = {
                feedback: 'Good answer with clear structure',
                score: 8.5,
                strengths: ['Clear structure', 'Good examples'],
                improvements: ['Could add more details']
            };

            (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
            (openaiService.generateAnswerFeedback as jest.Mock).mockResolvedValue(mockFeedback);
            (questionModel.updateStatus as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .post('/api/questions/behavioral/submit')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Answer submitted successfully');
            expect(response.body.data).toEqual(mockFeedback);
        });

        it('should return 400 if answer is missing', async () => {
            const requestData = {
                questionId: '507f1f77bcf86cd799439033'
            };

            const response = await request(app)
                .post('/api/questions/behavioral/submit')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Answer is required');
        });

        it('should return 404 if question not found', async () => {
            const requestData = {
                questionId: '507f1f77bcf86cd799439033',
                answer: 'This is my answer'
            };

            (questionModel.findById as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/questions/behavioral/submit')
                .set('Authorization', mockToken)
                .send(requestData);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Question not found');
        });
    });
});