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
     * Mock Behavior: jobApplicationModel.findById returns null, jobApplicationModel.create returns null
     */
    it('should return 500 if job not found and create fails', async () => {
      (jobApplicationModel.findById as jest.Mock).mockResolvedValue(null);
      (jobApplicationModel.create as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sessions/create')
        .set('Authorization', mockToken)
        .send({ jobId: mockJobId });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to create mock interview session');
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
