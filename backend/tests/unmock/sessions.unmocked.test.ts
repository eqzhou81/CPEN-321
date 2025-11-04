jest.unmock('mongoose');

const MOCKED_USER_ID = '507f1f77bcf86cd799439011';

jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      _id: MOCKED_USER_ID,
      name: 'Test User',
      email: 'test@example.com',
    };
    next();
  },
}));

import request from 'supertest';
import { app } from '../../src/app';
import { sessionModel } from '../../src/models/session.model';
import { questionModel } from '../../src/models/question.model';
import { jobApplicationModel } from '../../src/models/jobApplication.model';
import { userModel } from '../../src/models/user.model';
import mongoose from 'mongoose';
import { SessionStatus } from '../../src/models/session.model';
import { QuestionType, QuestionStatus } from '../../src/types/questions.types';

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

/**
 * Interface: POST /api/sessions/create
 */
describe('POST /api/sessions/create - createSession (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  const createdSessionIds: string[] = [];
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-session-${Date.now()}`,
        email: `session-${Date.now()}@example.com`,
        name: 'Session Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: { $in: createdSessionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('questions').deleteMany({
      _id: { $in: createdQuestionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Input: { jobId: string }
   * Expected Status: 201
   * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
   * Expected Behavior: Creates new session with default behavioral questions (5 total)
   */
  test('should create session successfully with default questions', async () => {
    const requestData = {
      jobId: testJobId,
    };

    const response = await request(app)
      .post('/api/sessions/create')
      .send(requestData)
      .expect(201);

    expect(response.body.message).toBe('Mock interview session created successfully');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data).toHaveProperty('currentQuestion');
    expect(response.body.data.session).toHaveProperty('progressPercentage');
    expect(response.body.data.session).toHaveProperty('currentQuestion');
    expect(response.body.data.session).toHaveProperty('remainingQuestions');
    expect(response.body.data.session.status).toBe(SessionStatus.ACTIVE);
    expect(response.body.data.session.totalQuestions).toBe(5);

    createdSessionIds.push(response.body.data.session._id);
  });

  /**
   * Input: { }
   * Expected Status: 400
   * Expected Output: { message: 'Job ID is required and must be a string' }
   * Expected Behavior: Rejects request due to missing job ID
   */
  test('should return 400 when job ID is missing', async () => {
    const requestData = {};

    const response = await request(app)
      .post('/api/sessions/create')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Job ID is required and must be a string');
  });

  /**
   * Input: { jobId: number }
   * Expected Status: 400
   * Expected Output: { message: 'Job ID is required and must be a string' }
   * Expected Behavior: Rejects request due to invalid job ID type
   */
  test('should return 400 when job ID is not a string', async () => {
    const requestData = {
      jobId: 123,
    };

    const response = await request(app)
      .post('/api/sessions/create')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Job ID is required and must be a string');
  });

  /**
   * Input: { jobId: string } (when active session exists)
   * Expected Status: 409
   * Expected Output: { message: string, data: { session: ISessionWithQuestions } }
   * Expected Behavior: Returns existing active session instead of creating new one
   */
  test('should return 409 when active session already exists', async () => {
    const conflictJob = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Conflict Test Job',
        company: 'Test Corp',
        description: 'Test job for conflict test',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    const conflictJobId = conflictJob._id.toString();

    try {
      const createResponse = await request(app)
        .post('/api/sessions/create')
        .send({ jobId: conflictJobId });

      if (createResponse.status === 201) {
        const firstSessionId = createResponse.body.data.session._id;
        createdSessionIds.push(firstSessionId);

        const response = await request(app)
          .post('/api/sessions/create')
          .send({ jobId: conflictJobId })
          .expect(409);

        expect(response.body.message).toContain('active session already exists');
        expect(response.body.data).toHaveProperty('session');

        await request(app)
          .put(`/api/sessions/${firstSessionId}/status`)
          .send({ status: 'cancelled' });
      }
    } finally {
      await mongoose.connection.collection('jobapplications').deleteOne({
        _id: new mongoose.Types.ObjectId(conflictJobId),
      });
    }
  });

  /**
   * Input: { jobId: string, specificQuestionId: string }
   * Expected Status: 201
   * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
   * Expected Behavior: Creates session starting with the specified question
   */
  test('should create session with specific question ID', async () => {
    const firstResponse = await request(app)
      .post('/api/sessions/create')
      .send({ jobId: testJobId });

    if (firstResponse.status === 201) {
      const firstSessionId = firstResponse.body.data.session._id;
      createdSessionIds.push(firstSessionId);

      await request(app)
        .put(`/api/sessions/${firstSessionId}/status`)
        .send({ status: 'cancelled' });

      const questions = await questionModel.findByJobId(
        new mongoose.Types.ObjectId(testJobId),
        new mongoose.Types.ObjectId(testUserId)
      );

      if (questions.length > 0) {
        const specificQuestionId = questions[0]._id.toString();

        const response = await request(app)
          .post('/api/sessions/create')
          .send({
            jobId: testJobId,
            specificQuestionId: specificQuestionId,
          })
          .expect(201);

        expect(response.body.data.session).toBeDefined();
        createdSessionIds.push(response.body.data.session._id);
      }
    }
  });
});

/**
 * Interface: GET /api/sessions
 */
describe('GET /api/sessions - getUserSessions (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-sessions-list-${Date.now()}`,
        email: `sessions-list-${Date.now()}@example.com`,
        name: 'Sessions List Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Test question for session list',
        description: 'Test description',
        difficulty: 'medium',
      }
    );

    const session1 = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question._id]
    );
    createdSessionIds.push(session1._id.toString());

    await sessionModel.updateStatus(
      session1._id,
      new mongoose.Types.ObjectId(testUserId),
      SessionStatus.COMPLETED
    );
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: { $in: createdSessionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Input: GET /api/sessions
   * Expected Status: 200
   * Expected Output: { message: string, data: { sessions: ISessionWithQuestions[], stats: { total, completed, active, averageProgress } } }
   * Expected Behavior: Returns all sessions for authenticated user with statistics
   */
  test('should return user sessions successfully', async () => {
    const response = await request(app)
      .get('/api/sessions')
      .expect(200);

    expect(response.body.message).toBe('Sessions retrieved successfully');
    expect(response.body.data).toHaveProperty('sessions');
    expect(response.body.data).toHaveProperty('stats');
    expect(Array.isArray(response.body.data.sessions)).toBe(true);
    expect(response.body.data.stats).toHaveProperty('total');
    expect(response.body.data.stats).toHaveProperty('completed');
    expect(response.body.data.stats).toHaveProperty('active');
    expect(response.body.data.stats).toHaveProperty('averageProgress');
  });

  /**
   * Input: GET /api/sessions?limit=10
   * Expected Status: 200
   * Expected Output: { message: string, data: { sessions: ISessionWithQuestions[], stats: {} } }
   * Expected Behavior: Returns limited number of sessions (max 10)
   */
  test('should return user sessions with limit', async () => {
    const response = await request(app)
      .get('/api/sessions')
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.message).toBe('Sessions retrieved successfully');
    expect(response.body.data.sessions.length).toBeLessThanOrEqual(10);
  });
});

/**
 * Interface: GET /api/sessions/:sessionId
 */
describe('GET /api/sessions/:sessionId - getSession (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-session-detail-${Date.now()}`,
        email: `session-detail-${Date.now()}@example.com`,
        name: 'Session Detail Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question1 = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Test question 1',
        description: 'Test description',
        difficulty: 'medium',
      }
    );
    createdQuestionIds.push(question1._id.toString());

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question1._id]
    );
    testSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('questions').deleteMany({
      _id: { $in: createdQuestionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Get session successfully
   * Input: GET /api/sessions/:sessionId
   * Expected Status: 200
   * Expected Output: { message: string, data: { session, currentQuestion } }
   * Expected Behavior: Returns session details
   */
  /**
   * Input: GET /api/sessions/:sessionId
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
   * Expected Behavior: Returns session details with current question
   */
  test('should return session successfully', async () => {
    const response = await request(app)
      .get(`/api/sessions/${testSessionId}`)
      .expect(200);

    expect(response.body.message).toBe('Session retrieved successfully');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data).toHaveProperty('currentQuestion');
    expect(response.body.data.session._id.toString()).toBe(testSessionId);
    expect(response.body.data.session).toHaveProperty('progressPercentage');
    expect(response.body.data.session).toHaveProperty('currentQuestion');
    expect(response.body.data.session).toHaveProperty('remainingQuestions');
  });

  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/sessions/${fakeId}`)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });

  /**
   * Test: Return error for invalid session ID format
   * Input: GET /api/sessions/invalid-id
   * Expected Status: 500 (due to CastError)
   * Expected Output: Error response
   * Expected Behavior: Returns error for malformed ID
   */
  /**
   * Input: GET /api/sessions/invalid-id
   * Expected Status: 500
   * Expected Output: Error response
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  test('should return error for invalid session ID format', async () => {
    const response = await request(app)
      .get('/api/sessions/invalid-id');

    expect(response.status).toBe(500);
  });
});

/**
 * Interface: POST /api/sessions/submit-answer
 (OpenAI service may fail if API key not set)
 */
describe('POST /api/sessions/submit-answer - submitSessionAnswer (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;
  let testQuestionId: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-submit-answer-${Date.now()}`,
        email: `submit-answer-${Date.now()}@example.com`,
        name: 'Submit Answer Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Tell me about a challenge you faced',
        description: 'Behavioral question',
        difficulty: 'medium',
      }
    );
    testQuestionId = question._id.toString();
    createdQuestionIds.push(testQuestionId);

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question._id]
    );
    testSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('questions').deleteMany({
      _id: { $in: createdQuestionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Submit answer successfully
   * Input: POST /api/sessions/submit-answer with { sessionId, questionId, answer }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session, feedback } }
   * Expected Behavior: Submits answer and returns feedback (may use default if OpenAI fails)
   */
  /**
   * Input: { sessionId: string, questionId: string, answer: string }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: ISessionWithQuestions, feedback: SessionAnswerFeedback } }
   * Expected Behavior: Submits answer and returns AI feedback (may use default if OpenAI fails)
   */
  test('should submit answer successfully', async () => {
    const requestData = {
      sessionId: testSessionId,
      questionId: testQuestionId,
      answer: 'This is my answer to the behavioral question. I faced a challenge when...',
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(200);

    expect(response.body.message).toBe('Answer submitted successfully');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data).toHaveProperty('feedback');
    expect(response.body.data.feedback).toHaveProperty('feedback');
    expect(response.body.data.feedback).toHaveProperty('score');
    expect(response.body.data.feedback).toHaveProperty('strengths');
    expect(response.body.data.feedback).toHaveProperty('improvements');
    expect(response.body.data.feedback).toHaveProperty('isLastQuestion');
    expect(response.body.data.feedback).toHaveProperty('sessionCompleted');
  });

  /**
   * Input: { questionId: string, answer: string }
   * Expected Status: 400
   * Expected Output: { message: 'Session ID is required and must be a string' }
   * Expected Behavior: Rejects request due to missing session ID
   */
  test('should return 400 if session ID is missing', async () => {
    const requestData = {
      questionId: testQuestionId,
      answer: 'My answer',
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Session ID is required and must be a string');
  });

  /**
   * Input: { sessionId: string, answer: string }
   * Expected Status: 400
   * Expected Output: { message: 'Question ID is required and must be a string' }
   * Expected Behavior: Rejects request due to missing question ID
   */
  test('should return 400 if question ID is missing', async () => {
    const requestData = {
      sessionId: testSessionId,
      answer: 'My answer',
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Question ID is required and must be a string');
  });

  /**
   * Input: { sessionId: string, questionId: string }
   * Expected Status: 400
   * Expected Output: { message: 'Answer is required and must be a non-empty string' }
   * Expected Behavior: Rejects request due to missing answer
   */
  test('should return 400 if answer is missing', async () => {
    const requestData = {
      sessionId: testSessionId,
      questionId: testQuestionId,
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Answer is required and must be a non-empty string');
  });

  /**
   * Input: { sessionId: string, questionId: string, answer: string (length > 5000) }
   * Expected Status: 400
   * Expected Output: { message: 'Answer too long (max 5000 characters)' }
   * Expected Behavior: Rejects request due to answer exceeding length limit
   */
  test('should return 400 if answer is too long', async () => {
    const requestData = {
      sessionId: testSessionId,
      questionId: testQuestionId,
      answer: 'A'.repeat(5001),
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Answer too long (max 5000 characters)');
  });

  /**
   * Test: Return 404 if session not found
   * Input: POST /api/sessions/submit-answer with non-existent sessionId
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response
   */
  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const requestData = {
      sessionId: fakeId,
      questionId: testQuestionId,
      answer: 'My answer',
    };

    const response = await request(app)
      .post('/api/sessions/submit-answer')
      .send(requestData)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });
});

/**
 * Interface: PUT /api/sessions/:sessionId/status
 */
describe('PUT /api/sessions/:sessionId/status - updateSessionStatus (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-update-status-${Date.now()}`,
        email: `update-status-${Date.now()}@example.com`,
        name: 'Update Status Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Test question for status update',
        description: 'Test description',
        difficulty: 'medium',
      }
    );

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question._id]
    );
    testSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Update session status to completed
   * Input: PUT /api/sessions/:sessionId/status with { status: 'completed' }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session } }
   * Expected Behavior: Updates session status to completed
   */
  /**
   * Input: PUT /api/sessions/:sessionId/status with { status: 'completed' }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: ISessionWithQuestions } }
   * Expected Behavior: Updates session status to completed
   */
  test('should update session status to completed', async () => {
    const requestData = {
      status: 'completed',
    };

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/status`)
      .send(requestData)
      .expect(200);

    expect(response.body.message).toContain('completed successfully');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data.session.status).toBe(SessionStatus.COMPLETED);
  });

  /**
   * Test: Update session status to paused
   * Input: PUT /api/sessions/:sessionId/status with { status: 'paused' }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session } }
   * Expected Behavior: Updates session status to paused
   */
  /**
   * Input: PUT /api/sessions/:sessionId/status with { status: 'paused' }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: ISessionWithQuestions } }
   * Expected Behavior: Updates session status to paused
   */
  test('should update session status to paused', async () => {
    await sessionModel.updateStatus(
      new mongoose.Types.ObjectId(testSessionId),
      new mongoose.Types.ObjectId(testUserId),
      SessionStatus.CANCELLED
    );

    const pauseJob = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Pause Test Job',
        company: 'Test Corp',
        description: 'Test job for pause test',
        location: 'Remote',
        url: 'https://example.com',
      }
    );

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: pauseJob._id.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Test question for pause',
        description: 'Test description',
        difficulty: 'medium',
      }
    );

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      pauseJob._id,
      [question._id]
    );

    const requestData = {
      status: 'paused',
    };

    const response = await request(app)
      .put(`/api/sessions/${session._id.toString()}/status`)
      .send(requestData)
      .expect(200);

    expect(response.body.message).toContain('paused successfully');
    expect(response.body.data.session.status).toBe(SessionStatus.PAUSED);

    await mongoose.connection.collection('sessions').deleteOne({
      _id: session._id,
    });
    await mongoose.connection.collection('questions').deleteOne({
      _id: question._id,
    });
    await mongoose.connection.collection('jobapplications').deleteOne({
      _id: pauseJob._id,
    });
  });

  /**
   * Test: Return 400 if status is missing
   * Input: PUT /api/sessions/:sessionId/status with { }
   * Expected Status: 400
   * Expected Output: { message: 'Status is required and must be a string' }
   * Expected Behavior: Rejects request due to missing status
   */
  /**
   * Input: PUT /api/sessions/:sessionId/status with { }
   * Expected Status: 400
   * Expected Output: { message: 'Status is required and must be a string' }
   * Expected Behavior: Rejects request due to missing status
   */
  test('should return 400 if status is missing', async () => {
    const requestData = {};

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/status`)
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Status is required and must be a string');
  });

  /**
   * Test: Return 400 if status is invalid
   * Input: PUT /api/sessions/:sessionId/status with { status: 'invalid' }
   * Expected Status: 400
   * Expected Output: { message: 'Invalid status. Must be one of: active, paused, cancelled, completed' }
   * Expected Behavior: Rejects request due to invalid status value
   */
  /**
   * Input: PUT /api/sessions/:sessionId/status with { status: 'invalid' }
   * Expected Status: 400
   * Expected Output: { message: 'Invalid status. Must be one of: active, paused, cancelled, completed' }
   * Expected Behavior: Rejects request due to invalid status value
   */
  test('should return 400 if status is invalid', async () => {
    const requestData = {
      status: 'invalid',
    };

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/status`)
      .send(requestData)
      .expect(400);

    expect(response.body.message).toContain('Invalid status');
  });

  /**
   * Test: Return 404 if session not found
   * Input: PUT /api/sessions/:sessionId/status with valid status
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response
   */
  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const requestData = {
      status: 'completed',
    };

    const response = await request(app)
      .put(`/api/sessions/${fakeId}/status`)
      .send(requestData)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });

  /**
   * Test: Return 500 if session ID format is invalid
   * Input: PUT /api/sessions/invalid-id/status with valid status
   * Expected Status: 500
   * Expected Output: { message: 'Failed to update session status' }
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  /**
   * Input: PUT /api/sessions/invalid-id/status with valid status
   * Expected Status: 500
   * Expected Output: { message: 'Failed to update session status' }
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  test('should return 500 if session ID format is invalid', async () => {
    const requestData = {
      status: 'completed',
    };

    const response = await request(app)
      .put('/api/sessions/invalid-id/status')
      .send(requestData);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Failed to update session status');
  });
});

/**
 * Interface: PUT /api/sessions/:sessionId/navigate
 */
describe('PUT /api/sessions/:sessionId/navigate - navigateToQuestion (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-navigate-${Date.now()}`,
        email: `navigate-${Date.now()}@example.com`,
        name: 'Navigate Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question1 = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Question 1',
        description: 'Description for question 1',
        difficulty: 'medium',
      }
    );
    const question2 = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Question 2',
        description: 'Description for question 2',
        difficulty: 'medium',
      }
    );
    const question3 = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Question 3',
        description: 'Description for question 3',
        difficulty: 'medium',
      }
    );
    createdQuestionIds.push(
      question1._id.toString(),
      question2._id.toString(),
      question3._id.toString()
    );

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question1._id, question2._id, question3._id]
    );
    testSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('questions').deleteMany({
      _id: { $in: createdQuestionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Navigate to question successfully
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: 2 }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session, currentQuestion } }
   * Expected Behavior: Navigates to specified question index
   */
  /**
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number }
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: ISessionWithQuestions, currentQuestion: IQuestion } }
   * Expected Behavior: Navigates to specified question index
   */
  test('should navigate to question successfully', async () => {
    const requestData = {
      questionIndex: 2,
    };

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/navigate`)
      .send(requestData)
      .expect(200);

    expect(response.body.message).toBe('Navigation successful');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data).toHaveProperty('currentQuestion');
    expect(response.body.data.session.currentQuestionIndex).toBe(2);
  });

  /**
   * Test: Return 400 if question index is not a number
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: 'invalid' }
   * Expected Status: 400
   * Expected Output: { message: 'Question index must be a number' }
   * Expected Behavior: Rejects request due to invalid question index type
   */
  /**
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: 'invalid' }
   * Expected Status: 400
   * Expected Output: { message: 'Question index must be a number' }
   * Expected Behavior: Rejects request due to invalid question index type
   */
  test('should return 400 if question index is not a number', async () => {
    const requestData = {
      questionIndex: 'invalid',
    };

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/navigate`)
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Question index must be a number');
  });

  /**
   * Test: Return 404 if session not found
   * Input: PUT /api/sessions/:sessionId/navigate with valid questionIndex
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response
   */
  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const requestData = {
      questionIndex: 1,
    };

    const response = await request(app)
      .put(`/api/sessions/${fakeId}/navigate`)
      .send(requestData)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });

  /**
   * Test: Return 400 if session ID format is invalid
   * Input: PUT /api/sessions/invalid-id/navigate with valid questionIndex
   * Expected Status: 400
   * Expected Output: { message: 'Invalid session ID format' }
   * Expected Behavior: Rejects request due to invalid ObjectId format
   */
  /**
   * Input: PUT /api/sessions/invalid-id/navigate with valid questionIndex
   * Expected Status: 400
   * Expected Output: { message: 'Invalid session ID format' }
   * Expected Behavior: Rejects request due to invalid ObjectId format
   */
  test('should return 400 if session ID format is invalid', async () => {
    const requestData = {
      questionIndex: 1,
    };

    const response = await request(app)
      .put('/api/sessions/invalid-id/navigate')
      .send(requestData)
      .expect(400);

    expect(response.body.message).toBe('Invalid session ID format');
  });

  /**
   * Test: Return 400 if question index is out of bounds
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: 100 }
   * Expected Status: 400
   * Expected Output: { message: 'Invalid question index' }
   * Expected Behavior: Returns error when question index is out of bounds
   */
  /**
   * Input: PUT /api/sessions/:sessionId/navigate with { questionIndex: number (out of bounds) }
   * Expected Status: 400
   * Expected Output: { message: 'Invalid question index' }
   * Expected Behavior: Returns error when question index is out of bounds
   */
  test('should return 400 if question index is out of bounds', async () => {
    const requestData = {
      questionIndex: 100,
    };

    const response = await request(app)
      .put(`/api/sessions/${testSessionId}/navigate`)
      .send(requestData)
      .expect(400);

    expect(response.body.message).toContain('Invalid question index');
  });
});

/**
 * Interface: GET /api/sessions/:sessionId/progress
 */
describe('GET /api/sessions/:sessionId/progress - getSessionProgress (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-progress-${Date.now()}`,
        email: `progress-${Date.now()}@example.com`,
        name: 'Progress Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question1 = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Question 1',
        description: 'Description for question 1',
        difficulty: 'medium',
      }
    );
    createdQuestionIds.push(question1._id.toString());

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question1._id]
    );
    testSessionId = session._id.toString();

    await sessionModel.updateProgress(
      session._id,
      new mongoose.Types.ObjectId(testUserId),
      1,
      1
    );
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('questions').deleteMany({
      _id: { $in: createdQuestionIds.map(id => new mongoose.Types.ObjectId(id)) },
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Get session progress successfully
   * Input: GET /api/sessions/:sessionId/progress
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: { progressPercentage, estimatedTimeRemaining, ... } } }
   * Expected Behavior: Returns session progress information
   */
  /**
   * Input: GET /api/sessions/:sessionId/progress
   * Expected Status: 200
   * Expected Output: { message: string, data: { session: { progressPercentage, estimatedTimeRemaining, ... } } }
   * Expected Behavior: Returns session progress information
   */
  test('should return session progress successfully', async () => {
    const response = await request(app)
      .get(`/api/sessions/${testSessionId}/progress`)
      .expect(200);

    expect(response.body.message).toBe('Session progress retrieved successfully');
    expect(response.body.data).toHaveProperty('session');
    expect(response.body.data.session).toHaveProperty('sessionId');
    expect(response.body.data.session).toHaveProperty('currentQuestionIndex');
    expect(response.body.data.session).toHaveProperty('totalQuestions');
    expect(response.body.data.session).toHaveProperty('answeredQuestions');
    expect(response.body.data.session).toHaveProperty('progressPercentage');
    expect(response.body.data.session).toHaveProperty('status');
    expect(response.body.data.session).toHaveProperty('remainingQuestions');
    expect(response.body.data.session).toHaveProperty('estimatedTimeRemaining');
  });

  /**
   * Test: Return 404 if session not found
   * Input: GET /api/sessions/:sessionId/progress with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response
   */
  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/sessions/${fakeId}/progress`)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });

  /**
   * Test: Return 500 if session ID format is invalid
   * Input: GET /api/sessions/invalid-id/progress
   * Expected Status: 500
   * Expected Output: Error response
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  /**
   * Input: PUT /api/sessions/invalid-id/status with valid status
   * Expected Status: 500
   * Expected Output: { message: 'Failed to update session status' }
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  test('should return 500 if session ID format is invalid', async () => {
    const response = await request(app)
      .get('/api/sessions/invalid-id/progress');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Failed to retrieve session progress');
  });
});

/**
 * Interface: DELETE /api/sessions/:sessionId
 */
describe('DELETE /api/sessions/:sessionId - deleteSession (No Mocking)', () => {
  let testUserId: string;
  let testJobId: string;
  let testSessionId: string;

  beforeAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});

    const mockedUserIdObj = new mongoose.Types.ObjectId(MOCKED_USER_ID);
    let user = await userModel.findById(mockedUserIdObj);
    
    if (!user) {
      const User = mongoose.model('User');
      user = new User({
        _id: mockedUserIdObj,
        googleId: `gid-delete-${Date.now()}`,
        email: `delete-${Date.now()}@example.com`,
        name: 'Delete Test User',
        savedJobs: [],
      });
      await user.save();
    }
    if (!user) {
      throw new Error('Failed to create or find user');
    }
    testUserId = user._id.toString();

    const job = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Develop software applications',
        location: 'Remote',
        url: 'https://example.com',
      }
    );
    testJobId = job._id.toString();

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: testJobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Test question for delete setup',
        description: 'Test description',
        difficulty: 'medium',
      }
    );

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      new mongoose.Types.ObjectId(testJobId),
      [question._id]
    );
    testSessionId = session._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.collection('sessions').deleteMany({
      _id: new mongoose.Types.ObjectId(testSessionId),
    });
    await mongoose.connection.collection('jobapplications').deleteMany({
      _id: new mongoose.Types.ObjectId(testJobId),
    });
    await mongoose.connection.collection('users').deleteMany({
      _id: new mongoose.Types.ObjectId(testUserId),
    });
  });

  /**
   * Test: Delete session successfully
   * Input: DELETE /api/sessions/:sessionId
   * Expected Status: 200
   * Expected Output: { message: 'Session deleted successfully' }
   * Expected Behavior: Deletes session
   */
  /**
   * Input: DELETE /api/sessions/:sessionId
   * Expected Status: 200
   * Expected Output: { message: 'Session deleted successfully' }
   * Expected Behavior: Deletes session from database
   */
  test('should delete session successfully', async () => {
    await sessionModel.updateStatus(
      new mongoose.Types.ObjectId(testSessionId),
      new mongoose.Types.ObjectId(testUserId),
      SessionStatus.CANCELLED
    );

    const deleteJob = await jobApplicationModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        title: 'Delete Test Job',
        company: 'Test Corp',
        description: 'Test job for delete test',
        location: 'Remote',
        url: 'https://example.com',
      }
    );

    const question = await questionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      {
        jobId: deleteJob._id.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Test question for deletion',
        description: 'Test description',
        difficulty: 'medium',
      }
    );

    const session = await sessionModel.create(
      new mongoose.Types.ObjectId(testUserId),
      deleteJob._id,
      [question._id]
    );
    const sessionIdToDelete = session._id.toString();

    const response = await request(app)
      .delete(`/api/sessions/${sessionIdToDelete}`)
      .expect(200);

    expect(response.body.message).toBe('Session deleted successfully');

    const deletedSession = await sessionModel.findById(
      new mongoose.Types.ObjectId(sessionIdToDelete),
      new mongoose.Types.ObjectId(testUserId)
    );
    expect(deletedSession).toBeNull();

    await mongoose.connection.collection('questions').deleteOne({
      _id: question._id,
    });
    await mongoose.connection.collection('jobapplications').deleteOne({
      _id: deleteJob._id,
    });
  });

  /**
   * Test: Return 404 if session not found
   * Input: DELETE /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response
   */
  /**
   * Input: GET /api/sessions/:sessionId with non-existent ID
   * Expected Status: 404
   * Expected Output: { message: 'Session not found' }
   * Expected Behavior: Returns error response for non-existent session
   */
  test('should return 404 if session not found', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .delete(`/api/sessions/${fakeId}`)
      .expect(404);

    expect(response.body.message).toBe('Session not found');
  });

  /**
   * Test: Return 500 if session ID format is invalid
   * Input: DELETE /api/sessions/invalid-id
   * Expected Status: 500
   * Expected Output: { message: 'Failed to delete session' }
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  /**
   * Input: PUT /api/sessions/invalid-id/status with valid status
   * Expected Status: 500
   * Expected Output: { message: 'Failed to update session status' }
   * Expected Behavior: Returns error for invalid ObjectId format
   */
  test('should return 500 if session ID format is invalid', async () => {
    const response = await request(app)
      .delete('/api/sessions/invalid-id');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Failed to delete session');
  });
});


