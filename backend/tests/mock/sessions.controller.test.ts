import request from 'supertest';
import { app } from '../../src/app';
import { sessionModel } from '../../src/models/session.model';
import { questionModel } from '../../src/models/question.model';
import { jobApplicationModel } from '../../src/models/jobApplication.model';
import { openaiService } from '../../src/services/openai.service';
import { SessionStatus } from '../../src/models/session.model';
import { QuestionType, QuestionStatus } from '../../src/types/questions.types';
import mongoose from 'mongoose';

const realMongoose = jest.requireActual('mongoose');
const RealObjectId = realMongoose.Types.ObjectId;

jest.mock('../../src/models/session.model');
jest.mock('../../src/models/question.model');
jest.mock('../../src/models/jobApplication.model');
jest.mock('../../src/services/openai.service');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

const mockToken = 'Bearer mock-jwt-token';
const mockUserId = '507f1f77bcf86cd799439011';
const mockJobId = '507f1f77bcf86cd799439022';
const mockSessionId = '507f1f77bcf86cd799439033';
const mockQuestionId = '507f1f77bcf86cd799439044';

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

/**
 * Interface: SessionsController
 */
describe('SessionsController - With Mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  const createMockSession = (overrides: any = {}) => {
    const questionIds = overrides.questionIds || [
      {
        _id: new mongoose.Types.ObjectId(mockQuestionId),
        type: QuestionType.BEHAVIORAL,
        title: 'Tell me about a challenge you faced',
      }
    ];

    const session = {
      _id: new mongoose.Types.ObjectId(mockSessionId),
      userId: new mongoose.Types.ObjectId(mockUserId),
      jobId: new mongoose.Types.ObjectId(mockJobId),
      questionIds,
      currentQuestionIndex: 0,
      status: SessionStatus.ACTIVE,
      totalQuestions: 5,
      answeredQuestions: 0,
      toObject: () => ({
        _id: new mongoose.Types.ObjectId(mockSessionId),
        userId: new mongoose.Types.ObjectId(mockUserId),
        jobId: new mongoose.Types.ObjectId(mockJobId),
        questionIds,
        currentQuestionIndex: 0,
        status: SessionStatus.ACTIVE,
        totalQuestions: 5,
        answeredQuestions: 0,
      }),
      ...overrides,
    };
    return session;
  };

  const createMockQuestion = (overrides: any = {}) => ({
    _id: new mongoose.Types.ObjectId(mockQuestionId),
    type: QuestionType.BEHAVIORAL,
    title: 'Tell me about a challenge you faced',
    status: QuestionStatus.PENDING,
    ...overrides,
  });

  /**
   * Interface: POST /api/sessions/create
   */
  describe('POST /api/sessions/create - createSession (With Mocking)', () => {
    /**
     * Input: { jobId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Creates new session with default behavioral questions
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns null, questionModel.create returns mock questions (5 times), sessionModel.create returns mock session
     */
    it('should create session successfully with default questions', async () => {
      const requestData = { jobId: mockJobId };

      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const mockQuestions = Array.from({ length: 5 }, (_, i) =>
        createMockQuestion({
          _id: new mongoose.Types.ObjectId(),
          title: `Question ${i + 1}`,
        })
      );

      const mockSession = createMockSession({
        questionIds: mockQuestions,
      });

      (questionModel.create as jest.Mock).mockImplementation(async () => {
        return mockQuestions[0];
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (sessionModel.create as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestions[0]);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
      expect(response.body.data).toHaveProperty('session');
      expect(response.body.data).toHaveProperty('currentQuestion');
    });

    /**
     * Input: { }
     * Expected Status: 400
     * Expected Output: { message: 'Job ID is required and must be a string' }
     * Expected Behavior: Rejects request due to missing job ID
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if jobId is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Job ID is required and must be a string');
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to create mock interview session' }
     * Expected Behavior: Returns error when job not found and placeholder job creation fails
     * Mock Behavior: jobApplicationModel.findById returns null, jobApplicationModel.create throws error
     */
    it('should return 500 if job not found and create throws error', async () => {
      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(null);
      (jobApplicationModel.create as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create mock interview session');
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Creates placeholder job when job not found, then creates session
     * Mock Behavior: jobApplicationModel.findById returns null, jobApplicationModel.create returns placeholder job, sessionModel.findActiveByJobId returns null, questionModel.create returns questions, sessionModel.create returns session
     */
    it('should create placeholder job when job not found and then create session', async () => {
      const placeholderJob = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Mock Interview Practice Session',
        company: 'Practice Company',
      };

      const mockQuestions = Array.from({ length: 5 }, (_, i) =>
        createMockQuestion({
          _id: new mongoose.Types.ObjectId(),
          title: `Question ${i + 1}`,
        })
      );

      const mockSession = createMockSession({
        questionIds: mockQuestions,
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(null);
      (jobApplicationModel.create as jest.Mock).mockResolvedValue(placeholderJob);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (questionModel.create as jest.Mock).mockImplementation(async () => {
        return mockQuestions[0];
      });
      (sessionModel.create as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestions[0]);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
      expect(jobApplicationModel.create).toHaveBeenCalled();
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 409
     * Expected Output: { message: string, data: { session: ISessionWithQuestions } }
     * Expected Behavior: Returns conflict when active session already exists
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns existing session
     */
    it('should return 409 if active session already exists', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const existingSession = createMockSession();
      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(existingSession);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('active session already exists');
      expect(response.body.data).toHaveProperty('session');
    });

    /**
     * Input: { jobId: string, specificQuestionId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Creates session with specific question, cancels existing session
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns existing session, sessionModel.updateStatus cancels session, questionModel.findByJobId returns questions, sessionModel.create returns new session
     */
    it('should create session with specificQuestionId and cancel existing session', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const existingSession = createMockSession();
      const specificQuestion = createMockQuestion({
        _id: new mongoose.Types.ObjectId(mockQuestionId),
        type: QuestionType.BEHAVIORAL,
      });
      const otherQuestion = createMockQuestion({
        _id: new mongoose.Types.ObjectId(),
        type: QuestionType.BEHAVIORAL,
      });

      const newSession = createMockSession({
        questionIds: [specificQuestion, otherQuestion],
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(existingSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(true);
      (questionModel.findByJobId as jest.Mock).mockResolvedValue([specificQuestion, otherQuestion]);
      (sessionModel.create as jest.Mock).mockResolvedValue(newSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(newSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(specificQuestion);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId, specificQuestionId: mockQuestionId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
      expect(sessionModel.updateStatus).toHaveBeenCalledWith(
        existingSession._id,
        expect.any(mongoose.Types.ObjectId),
        SessionStatus.CANCELLED
      );
    });

    /**
     * Input: { jobId: string, specificQuestionId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Creates session with specific question first when behavioral questions exist
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns null, questionModel.findByJobId returns behavioral questions, sessionModel.create returns new session
     */
    it('should create session with specificQuestionId placed first', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const specificQuestion = createMockQuestion({
        _id: new mongoose.Types.ObjectId(mockQuestionId),
        type: QuestionType.BEHAVIORAL,
      });
      const otherQuestion = createMockQuestion({
        _id: new mongoose.Types.ObjectId(),
        type: QuestionType.BEHAVIORAL,
      });

      const newSession = createMockSession({
        questionIds: [specificQuestion, otherQuestion],
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (questionModel.findByJobId as jest.Mock).mockResolvedValue([otherQuestion, specificQuestion]);
      (sessionModel.create as jest.Mock).mockResolvedValue(newSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(newSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(specificQuestion);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId, specificQuestionId: mockQuestionId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
      // Verify the specific question is first in the questionIds array
      expect(sessionModel.create).toHaveBeenCalledWith(
        expect.any(mongoose.Types.ObjectId),
        expect.any(mongoose.Types.ObjectId),
        expect.arrayContaining([specificQuestion._id])
      );
    });

    /**
     * Input: { jobId: string, specificQuestionId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Falls back to default questions when no behavioral questions found
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns null, questionModel.findByJobId returns empty array or only technical questions, questionModel.create creates default questions, sessionModel.create returns new session
     */
    it('should fall back to default questions when no behavioral questions found with specificQuestionId', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const technicalQuestion = createMockQuestion({
        _id: new mongoose.Types.ObjectId(),
        type: QuestionType.TECHNICAL,
      });

      const defaultQuestions = Array.from({ length: 5 }, (_, i) =>
        createMockQuestion({
          _id: new mongoose.Types.ObjectId(),
          type: QuestionType.BEHAVIORAL,
          title: `Default Question ${i + 1}`,
        })
      );

      const newSession = createMockSession({
        questionIds: defaultQuestions,
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (questionModel.findByJobId as jest.Mock).mockResolvedValue([technicalQuestion]);
      (questionModel.create as jest.Mock).mockImplementation(async () => {
        return defaultQuestions[0];
      });
      (sessionModel.create as jest.Mock).mockResolvedValue(newSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(newSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(defaultQuestions[0]);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId, specificQuestionId: mockQuestionId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
      expect(questionModel.create).toHaveBeenCalledTimes(5);
    });

    /**
     * Input: { jobId: string, specificQuestionId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Uses all behavioral questions when specific question not found
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns null, questionModel.findByJobId returns behavioral questions but not the specific one, sessionModel.create returns new session
     */
    it('should use all behavioral questions when specificQuestionId not found', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const otherQuestion1 = createMockQuestion({
        _id: new mongoose.Types.ObjectId(),
        type: QuestionType.BEHAVIORAL,
      });
      const otherQuestion2 = createMockQuestion({
        _id: new mongoose.Types.ObjectId(),
        type: QuestionType.BEHAVIORAL,
      });

      const newSession = createMockSession({
        questionIds: [otherQuestion1, otherQuestion2],
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (questionModel.findByJobId as jest.Mock).mockResolvedValue([otherQuestion1, otherQuestion2]);
      (sessionModel.create as jest.Mock).mockResolvedValue(newSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(newSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(otherQuestion1);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId, specificQuestionId: mockQuestionId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Mock interview session created successfully');
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to create session' }
     * Expected Behavior: Returns error when createSession throws unexpected error
     * Mock Behavior: jobApplicationModel.findById throws error
     */
    it('should handle unexpected error in createSession', async () => {
      (jobApplicationModel.findById as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create session');
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 409
     * Expected Output: { message: string }
     * Expected Behavior: Returns error when error message contains "active session already exists"
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId throws error with specific message
     */
    it('should return 409 when error contains active session already exists message', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockRejectedValue(new Error('active session already exists'));

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('active session already exists');
    });

    /**
     * Input: { jobId: string }
     * Expected Status: 201
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Creates session successfully with default questions (questionIds will not be empty as controller always creates questions)
     * Mock Behavior: jobApplicationModel.findById returns mock job, sessionModel.findActiveByJobId returns null, questionModel.create returns questions, sessionModel.create returns session with questions
     */
    it('should create session successfully and return first question', async () => {
      const mockJobApplication = {
        _id: new mongoose.Types.ObjectId(mockJobId),
        title: 'Software Engineer',
        company: 'Tech Corp',
      };

      const mockQuestions = Array.from({ length: 5 }, (_, i) =>
        createMockQuestion({
          _id: new mongoose.Types.ObjectId(),
          title: `Question ${i + 1}`,
        })
      );

      const mockSession = createMockSession({
        questionIds: mockQuestions,
      });

      (questionModel.create as jest.Mock).mockImplementation(async () => {
        return mockQuestions[0];
      });

      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(mockJobApplication);
      (sessionModel.findActiveByJobId as jest.Mock).mockResolvedValue(null);
      (sessionModel.create as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestions[0]);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(201);
      expect(response.body.data.currentQuestion).toBeDefined();
    });
  });

  /**
   * Interface: GET /api/sessions
   */
  describe('GET /api/sessions - getUserSessions (With Mocking)', () => {
    /**
     * Input: GET /api/sessions
     * Expected Status: 200
     * Expected Output: { message: string, data: { sessions: ISessionWithQuestions[], stats: { total, completed, active, averageProgress } } }
     * Expected Behavior: Returns all sessions for authenticated user with statistics
     * Mock Behavior: sessionModel.findByUserId returns mock sessions array, sessionModel.getSessionStats returns mock stats
     */
    it('should return user sessions successfully', async () => {
      const mockSessions = [
        createMockSession(),
        createMockSession({
          _id: new mongoose.Types.ObjectId(),
          status: SessionStatus.COMPLETED,
        }),
      ];

      (sessionModel.findByUserId as jest.Mock).mockResolvedValue(mockSessions);

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Sessions retrieved successfully');
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data.sessions).toHaveLength(2);
    });

    /**
     * Input: GET /api/sessions
     * Expected Status: 500
     * Expected Output: { message: 'Failed to retrieve sessions' }
     * Expected Behavior: Returns error when database query fails
     * Mock Behavior: sessionModel.findByUserId throws error
     */
    it('should handle database error when fetching sessions', async () => {
      (sessionModel.findByUserId as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', mockToken);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to retrieve sessions');
    });
  });

  /**
   * Interface: GET /api/sessions/:sessionId
   */
  describe('GET /api/sessions/:sessionId - getSession (With Mocking)', () => {
    /**
     * Input: GET /api/sessions/:sessionId
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Returns session details with current question
     * Mock Behavior: sessionModel.findById returns mock session
     */
    it('should return session successfully', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session retrieved successfully');
      expect(response.body.data).toHaveProperty('session');
    });

    /**
     * Input: GET /api/sessions/:sessionId
     * Expected Status: 500
     * Expected Output: { message: 'Failed to retrieve session' }
     * Expected Behavior: Returns error when database query fails
     * Mock Behavior: sessionModel.findById throws error
     */
    it('should handle database error when fetching session', async () => {
      (sessionModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to retrieve session');
    });

    /**
     * Input: GET /api/sessions/:sessionId with non-existent ID
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.findById returns null
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });
  });

  /**
   * Interface: POST /api/sessions/submit-answer
   */
  describe('POST /api/sessions/submit-answer - submitSessionAnswer (With Mocking)', () => {
    /**
     * Input: { sessionId: string, questionId: string, answer: string }
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, feedback: SessionAnswerFeedback } }
     * Expected Behavior: Submits answer and returns AI feedback
     * Mock Behavior: sessionModel.findById returns mock session with question, questionModel.findById returns mock question, openaiService.generateAnswerFeedback returns mock feedback, sessionModel.updateProgress returns updated session
     */
    it('should submit answer successfully with AI feedback', async () => {
      const requestData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answer: 'This is my answer to the behavioral question.',
      };

      const mockQuestion = createMockQuestion();
      
      const mockFeedback = {
        feedback: 'Good answer with clear structure',
        score: 8.5,
        strengths: ['Clear structure', 'Good examples'],
        improvements: ['Could add more details'],
      };

      const mockUpdatedSession = createMockSession({
        questionIds: [mockQuestion],
        answeredQuestions: 1,
      });

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: mockQuestion.type,
          title: mockQuestion.title,
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question], // Array of question objects with real ObjectId _id
          currentQuestionIndex: 0,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 0,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 0,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 0,
          }),
        };
      });
      
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
      (openaiService.generateAnswerFeedback as jest.Mock).mockResolvedValue(mockFeedback);
      (questionModel.updateStatus as jest.Mock).mockResolvedValue(true);
      (sessionModel.updateProgress as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Answer submitted successfully');
      expect(response.body.data).toHaveProperty('session');
      expect(response.body.data).toHaveProperty('feedback');
      expect(response.body.data.feedback.feedback).toBe(mockFeedback.feedback);
      expect(response.body.data.feedback.score).toBe(mockFeedback.score);
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string }
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, feedback: SessionAnswerFeedback } }
     * Expected Behavior: Returns default feedback when OpenAI service fails
     * Mock Behavior: sessionModel.findById returns mock session, questionModel.findById returns mock question, openaiService.generateAnswerFeedback throws error, sessionModel.updateProgress returns updated session
     */
    it('should handle OpenAI service error gracefully', async () => {
      const requestData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answer: 'This is my answer.',
      };

      const mockQuestion = createMockQuestion();
      const mockUpdatedSession = createMockSession({
        questionIds: [mockQuestion],
        answeredQuestions: 1,
      });

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: mockQuestion.type,
          title: mockQuestion.title,
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question], // Array of question objects with real ObjectId _id
          currentQuestionIndex: 0,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 0,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 0,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 0,
          }),
        };
      });
      
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
      (openaiService.generateAnswerFeedback as jest.Mock).mockRejectedValue(new Error('OpenAI API error'));
      (questionModel.updateStatus as jest.Mock).mockResolvedValue(true);
      (sessionModel.updateProgress as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.data.feedback.feedback).toContain('technical issue');
    });

    /**
     * Input: { questionId: string, answer: string }
     * Expected Status: 400
     * Expected Output: { message: 'Session ID is required and must be a string' }
     * Expected Behavior: Rejects request due to missing session ID
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if session ID is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({ questionId: mockQuestionId, answer: 'Answer' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Session ID is required and must be a string');
    });

    /**
     * Input: { sessionId: string, answer: string }
     * Expected Status: 400
     * Expected Output: { message: 'Question ID is required and must be a string' }
     * Expected Behavior: Rejects request due to missing question ID
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if question ID is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({ sessionId: mockSessionId, answer: 'Answer' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Question ID is required and must be a string');
    });

    /**
     * Input: { sessionId: string, questionId: string }
     * Expected Status: 400
     * Expected Output: { message: 'Answer is required and must be a non-empty string' }
     * Expected Behavior: Rejects request due to missing answer
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if answer is missing', async () => {
      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({ sessionId: mockSessionId, questionId: mockQuestionId });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Answer is required and must be a non-empty string');
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string (length > 5000) }
     * Expected Status: 400
     * Expected Output: { message: 'Answer too long (max 5000 characters)' }
     * Expected Behavior: Rejects request due to answer exceeding maximum length
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if answer is too long', async () => {
      const longAnswer = 'a'.repeat(5001);
      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: longAnswer,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Answer too long (max 5000 characters)');
    });

    /**
     * Input: { sessionId: string (non-existent), questionId: string, answer: string }
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.findById returns null
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: 'Answer',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string } (session status is COMPLETED)
     * Expected Status: 400
     * Expected Output: { message: 'Session is not active' }
     * Expected Behavior: Rejects request when session is not in active status
     * Mock Behavior: sessionModel.findById returns mock session with COMPLETED status
     */
    it('should return 400 if session is not active', async () => {
      const mockSession = createMockSession({ status: SessionStatus.COMPLETED });
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: 'Answer',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Session is not active');
    });

    /**
     * Input: { sessionId: string, questionId: string (different from session's questions), answer: string }
     * Expected Status: 400
     * Expected Output: { message: 'Question does not belong to this session' }
     * Expected Behavior: Rejects request when question is not part of the session
     * Mock Behavior: sessionModel.findById returns mock session with different question ID
     */
    it('should return 400 if question does not belong to session', async () => {
      const differentQuestionId = new mongoose.Types.ObjectId();
      const mockSession = createMockSession({
        questionIds: [{
          _id: differentQuestionId,
          type: QuestionType.BEHAVIORAL,
          title: 'Different question',
        }],
      });

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        return {
          ...mockSession,
          questionIds: [{
            _id: differentQuestionId,
            type: QuestionType.BEHAVIORAL,
            title: 'Different question',
          }],
        };
      });

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: 'Answer',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Question does not belong to this session');
    });

    /**
     * Input: { sessionId: string, questionId: string (non-existent), answer: string }
     * Expected Status: 404
     * Expected Output: { message: 'Question not found' }
     * Expected Behavior: Returns error response for non-existent question
     * Mock Behavior: sessionModel.findById returns mock session, questionModel.findById returns null
     */
    it('should return 404 if question not found', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: QuestionType.BEHAVIORAL,
          title: 'Test question',
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question],
          currentQuestionIndex: 0,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 0,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 0,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 0,
          }),
        };
      });
      (questionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: 'Answer',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Question not found');
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string } (technical question)
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, feedback: SessionAnswerFeedback } }
     * Expected Behavior: Submits answer for technical question and returns default feedback
     * Mock Behavior: sessionModel.findById returns mock session, questionModel.findById returns technical question, sessionModel.updateProgress returns updated session
     */
    it('should submit answer for technical question successfully', async () => {
      const requestData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answer: 'I would solve this problem using a hash map.',
      };

      const mockQuestion = createMockQuestion({
        type: QuestionType.TECHNICAL,
      });

      const mockUpdatedSession = createMockSession({
        questionIds: [mockQuestion],
        answeredQuestions: 1,
      });

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: QuestionType.TECHNICAL,
          title: mockQuestion.title,
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question],
          currentQuestionIndex: 0,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 0,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 0,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 0,
          }),
        };
      });
      
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
      (sessionModel.updateProgress as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.data.feedback.feedback).toContain('Technical question noted');
      expect(response.body.data.feedback.score).toBe(0);
      expect(openaiService.generateAnswerFeedback).not.toHaveBeenCalled();
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string } (last question)
     * Expected Status: 200
     * Expected Output: { message: 'Session completed successfully', data: { session: ISessionWithQuestions, feedback: SessionAnswerFeedback } }
     * Expected Behavior: Submits answer for last question and marks session as completed
     * Mock Behavior: sessionModel.findById returns mock session with last question, questionModel.findById returns mock question, openaiService.generateAnswerFeedback returns mock feedback, sessionModel.updateProgress returns completed session
     */
    it('should complete session when answering last question', async () => {
      const requestData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answer: 'This is my answer to the last question.',
      };

      const mockQuestion = createMockQuestion();
      
      const mockFeedback = {
        feedback: 'Excellent answer!',
        score: 9.5,
        strengths: ['Clear structure', 'Great examples'],
        improvements: [],
      };

      const mockUpdatedSession = createMockSession({
        questionIds: [mockQuestion],
        answeredQuestions: 5,
        currentQuestionIndex: 4,
        totalQuestions: 5,
        status: SessionStatus.COMPLETED,
      });

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: mockQuestion.type,
          title: mockQuestion.title,
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question],
          currentQuestionIndex: 4,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 4,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 4,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 4,
          }),
        };
      });
      
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
      (openaiService.generateAnswerFeedback as jest.Mock).mockResolvedValue(mockFeedback);
      (questionModel.updateStatus as jest.Mock).mockResolvedValue(true);
      (sessionModel.updateProgress as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session completed successfully');
      expect(response.body.data.feedback.isLastQuestion).toBe(true);
      expect(response.body.data.feedback.sessionCompleted).toBe(true);
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to update session progress' }
     * Expected Behavior: Returns error when updateProgress returns null
     * Mock Behavior: sessionModel.findById returns mock session, questionModel.findById returns mock question, openaiService.generateAnswerFeedback returns mock feedback, questionModel.updateStatus returns true, sessionModel.updateProgress returns null
     */
    it('should return 500 if updateProgress returns null', async () => {
      const requestData = {
        sessionId: mockSessionId,
        questionId: mockQuestionId,
        answer: 'This is my answer.',
      };

      const mockQuestion = createMockQuestion();
      
      const mockFeedback = {
        feedback: 'Good answer',
        score: 8,
        strengths: ['Clear structure'],
        improvements: [],
      };

      (sessionModel.findById as jest.Mock).mockImplementation(async () => {
        const questionObjectId = new RealObjectId(mockQuestionId);
        
        const question = {
          _id: questionObjectId,
          type: mockQuestion.type,
          title: mockQuestion.title,
        };
        
        return {
          _id: new RealObjectId(mockSessionId),
          userId: new RealObjectId(mockUserId),
          jobId: new RealObjectId(mockJobId),
          questionIds: [question],
          currentQuestionIndex: 0,
          status: SessionStatus.ACTIVE,
          totalQuestions: 5,
          answeredQuestions: 0,
          toObject: () => ({
            _id: new RealObjectId(mockSessionId),
            userId: new RealObjectId(mockUserId),
            jobId: new RealObjectId(mockJobId),
            questionIds: [question],
            currentQuestionIndex: 0,
            status: SessionStatus.ACTIVE,
            totalQuestions: 5,
            answeredQuestions: 0,
          }),
        };
      });
      
      (questionModel.findById as jest.Mock).mockResolvedValue(mockQuestion);
      (openaiService.generateAnswerFeedback as jest.Mock).mockResolvedValue(mockFeedback);
      (questionModel.updateStatus as jest.Mock).mockResolvedValue(true);
      (sessionModel.updateProgress as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send(requestData);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to update session progress');
    });

    /**
     * Input: { sessionId: string, questionId: string, answer: string }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to submit answer' }
     * Expected Behavior: Returns error when unexpected error occurs
     * Mock Behavior: sessionModel.findById throws error
     */
    it('should handle unexpected error when submitting answer', async () => {
      (sessionModel.findById as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/sessions/submit-answer')
        .set('Authorization', mockToken)
        .send({
          sessionId: mockSessionId,
          questionId: mockQuestionId,
          answer: 'Answer',
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to submit answer');
    });
  });

  /**
   * Interface: PUT /api/sessions/:sessionId/status
   */
  describe('PUT /api/sessions/:sessionId/status - updateSessionStatus (With Mocking)', () => {
    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: 'paused' }
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions } }
     * Expected Behavior: Updates session status to paused
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.updateStatus returns updated mock session
     */
    it('should update session status successfully', async () => {
      const mockSession = createMockSession({ status: SessionStatus.PAUSED });
      const mockUpdatedSession = createMockSession({ status: SessionStatus.PAUSED });

      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'paused' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session paused successfully');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: 'invalid' }
     * Expected Status: 400
     * Expected Output: { message: 'Invalid status. Must be one of: active, paused, cancelled, completed' }
     * Expected Behavior: Rejects request due to invalid status value
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if status is invalid', async () => {
      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { }
     * Expected Status: 400
     * Expected Output: { message: 'Status is required and must be a string' }
     * Expected Behavior: Rejects request due to missing status
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if status is missing', async () => {
      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Status is required and must be a string');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with non-existent sessionId
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.findById returns null
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'paused' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: string }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to update session status' }
     * Expected Behavior: Returns error when updateStatus returns null
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.updateStatus returns null
     */
    it('should return 500 if updateStatus returns null', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'paused' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to update session status');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status
     * Expected Status: 500
     * Expected Output: { message: 'Failed to update session status' }
     * Expected Behavior: Returns error when unexpected error occurs
     * Mock Behavior: sessionModel.findById throws error
     */
    it('should handle unexpected error when updating session status', async () => {
      (sessionModel.findById as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'paused' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to update session status');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: 'completed' }
     * Expected Status: 200
     * Expected Output: { message: 'Session completed successfully' }
     * Expected Behavior: Updates session status to completed
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.updateStatus returns updated mock session
     */
    it('should update session status to completed successfully', async () => {
      const mockSession = createMockSession({ status: SessionStatus.COMPLETED });
      const mockUpdatedSession = createMockSession({ status: SessionStatus.COMPLETED });

      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session completed successfully');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: 'cancelled' }
     * Expected Status: 200
     * Expected Output: { message: 'Session cancelled successfully' }
     * Expected Behavior: Updates session status to cancelled
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.updateStatus returns updated mock session
     */
    it('should update session status to cancelled successfully', async () => {
      const mockSession = createMockSession({ status: SessionStatus.CANCELLED });
      const mockUpdatedSession = createMockSession({ status: SessionStatus.CANCELLED });

      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session cancelled successfully');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/status with { status: 'active' }
     * Expected Status: 200
     * Expected Output: { message: 'Session active successfully' }
     * Expected Behavior: Updates session status to active
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.updateStatus returns updated mock session
     */
    it('should update session status to active successfully', async () => {
      const mockSession = createMockSession({ status: SessionStatus.ACTIVE });
      const mockUpdatedSession = createMockSession({ status: SessionStatus.ACTIVE });

      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/status`)
        .set('Authorization', mockToken)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session active successfully');
    });
  });

  /**
   * Interface: PUT /api/sessions/:sessionId/navigate
   */
  describe('PUT /api/sessions/:sessionId/navigate - navigateToQuestion (With Mocking)', () => {
    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number }
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
     * Expected Behavior: Navigates to specified question index
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.navigateToQuestion returns updated mock session
     */
    it('should navigate to question successfully', async () => {
      const mockSession = createMockSession({ currentQuestionIndex: 1 });
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.navigateToQuestion as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Navigation successful');
      expect(response.body.data).toHaveProperty('session');
      expect(response.body.data).toHaveProperty('currentQuestion');
    });

    /**
     * Input: PUT /api/sessions/invalid-id/navigate with valid questionIndex
     * Expected Status: 400
     * Expected Output: { message: 'Invalid session ID format' }
     * Expected Behavior: Rejects request due to invalid ObjectId format
     * Mock Behavior: ObjectId constructor throws error, no model mocks called
     */
    it('should return 400 if session ID format is invalid', async () => {
      (sessionModel.findById as jest.Mock).mockReset();
      (sessionModel.navigateToQuestion as jest.Mock).mockReset();
      
      const originalObjectId = mongoose.Types.ObjectId;
      (mongoose.Types.ObjectId as any) = jest.fn().mockImplementation((id: string) => {
        if (id === 'xyz' || (typeof id === 'string' && id.length !== 24 && !/^[0-9a-fA-F]{24}$/.test(id))) {
          throw new Error('input must be a 24 character hex string, 12 byte Uint8Array, or an integer');
        }
        return originalObjectId(id);
      });
      
      const response = await request(app)
        .put('/api/sessions/xyz/navigate')
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid session ID format');
      expect(sessionModel.findById).not.toHaveBeenCalled();
      
      mongoose.Types.ObjectId = originalObjectId;
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: 'invalid' }
     * Expected Status: 400
     * Expected Output: { message: 'Question index must be a number' }
     * Expected Behavior: Rejects request due to invalid question index type
     * Mock Behavior: No mocks called (validation fails before model calls)
     */
    it('should return 400 if question index is not a number', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 'not-a-number' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Question index must be a number');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with non-existent sessionId
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.findById returns null
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number (out of bounds) }
     * Expected Status: 400
     * Expected Output: { message: 'Invalid question index' }
     * Expected Behavior: Returns error when question index is out of bounds
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.navigateToQuestion throws error
     */
    it('should return 400 if question index is out of bounds', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.navigateToQuestion as jest.Mock).mockRejectedValue(
        new Error('Invalid question index')
      );

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 10 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid question index');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number }
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error when navigateToQuestion returns null
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.navigateToQuestion returns null
     */
    it('should return 404 if navigateToQuestion returns null', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.navigateToQuestion as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number }
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error when error message contains "Session not found"
     * Mock Behavior: sessionModel.findById returns mock session, sessionModel.navigateToQuestion throws error with specific message
     */
    it('should return 404 when error contains Session not found message', async () => {
      const mockSession = createMockSession();
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);
      (sessionModel.navigateToQuestion as jest.Mock).mockRejectedValue(
        new Error('Session not found')
      );

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number }
     * Expected Status: 500
     * Expected Output: { message: 'Failed to navigate to question' }
     * Expected Behavior: Returns error when unexpected error occurs
     * Mock Behavior: sessionModel.findById throws error
     */
    it('should handle unexpected error when navigating to question', async () => {
      (sessionModel.findById as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .put(`/api/sessions/${mockSessionId}/navigate`)
        .set('Authorization', mockToken)
        .send({ questionIndex: 1 });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to navigate to question');
    });
  });

  /**
   * Interface: GET /api/sessions/:sessionId/progress
   */
  describe('GET /api/sessions/:sessionId/progress - getSessionProgress (With Mocking)', () => {
    /**
     * Input: GET /api/sessions/:sessionId/progress
     * Expected Status: 200
     * Expected Output: { message: string, data: { session: { progressPercentage, estimatedTimeRemaining, ... } } }
     * Expected Behavior: Returns session progress information
     * Mock Behavior: sessionModel.findById returns mock session with progress data
     */
    it('should return session progress successfully', async () => {
      const mockSession = createMockSession({
        answeredQuestions: 2,
        totalQuestions: 5,
      });
      (sessionModel.findById as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}/progress`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session progress retrieved successfully');
      expect(response.body.data.session).toHaveProperty('progressPercentage');
      expect(response.body.data.session.progressPercentage).toBe(40);
    });

    /**
     * Input: GET /api/sessions/:sessionId/progress with non-existent ID
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.findById returns null
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}/progress`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: GET /api/sessions/:sessionId/progress
     * Expected Status: 500
     * Expected Output: { message: 'Failed to retrieve session progress' }
     * Expected Behavior: Returns error when database query fails
     * Mock Behavior: sessionModel.findById throws error
     */
    it('should handle database error when fetching progress', async () => {
      (sessionModel.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/sessions/${mockSessionId}/progress`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to retrieve session progress');
    });
  });

  /**
   * Interface: DELETE /api/sessions/:sessionId
   */
  describe('DELETE /api/sessions/:sessionId - deleteSession (With Mocking)', () => {
    /**
     * Input: DELETE /api/sessions/:sessionId
     * Expected Status: 200
     * Expected Output: { message: 'Session deleted successfully' }
     * Expected Behavior: Deletes session from database
     * Mock Behavior: sessionModel.delete returns true
     */
    it('should delete session successfully', async () => {
      (sessionModel.delete as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session deleted successfully');
    });

    /**
     * Input: DELETE /api/sessions/:sessionId with non-existent ID
     * Expected Status: 404
     * Expected Output: { message: 'Session not found' }
     * Expected Behavior: Returns error response for non-existent session
     * Mock Behavior: sessionModel.delete returns false
     */
    it('should return 404 if session not found', async () => {
      (sessionModel.delete as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Session not found');
    });

    /**
     * Input: DELETE /api/sessions/:sessionId
     * Expected Status: 500
     * Expected Output: { message: 'Failed to delete session' }
     * Expected Behavior: Returns error when database delete fails
     * Mock Behavior: sessionModel.delete throws error
     */
    it('should handle database error when deleting session', async () => {
      (sessionModel.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/sessions/${mockSessionId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to delete session');
    });
  });
});
