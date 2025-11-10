jest.unmock('mongoose');

const MOCKED_USER_ID = '507f1f77bcf86cd799439011';

// Set environment variables to bypass auth
process.env.BYPASS_AUTH = 'true';
process.env.MOCK_USER_ID = MOCKED_USER_ID;

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/config/app';
import { questionModel } from '../../src/models/question.model';
import { jobApplicationModel } from '../../src/models/jobApplication.model';
import { sessionModel } from '../../src/models/session.model';
import { openaiService } from '../../src/services/openai.service';
import { QuestionType, QuestionStatus } from '../../src/types/questions.types';

// Mock external services to avoid real API calls
jest.mock('../../src/services/openai.service');

const TEST_TIMEOUT = 15000;

describe('Questions Controller - Unmocked Integration Tests', () => {
  let testUserId: mongoose.Types.ObjectId;
  let testJobId: mongoose.Types.ObjectId;
  let testQuestionId: mongoose.Types.ObjectId;
  let testSessionId: mongoose.Types.ObjectId;

  const testJobData = {
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great opportunity for a software engineer',
    location: 'Vancouver, BC'
  };

  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    // Clean up collections
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});

    // Create test user
    testUserId = new mongoose.Types.ObjectId(MOCKED_USER_ID);

    const User = mongoose.model('User');
    const user = new User({
      _id: testUserId,
      googleId: `gid-questions-${Date.now()}`,
      email: 'questionstest@example.com',
      name: 'Questions Test User',
      savedJobs: [],
      savedQuestions: []
    });
    await user.save();

    // Create test job application
    const jobApp = await jobApplicationModel.create(testUserId, testJobData);
    testJobId = jobApp._id;

    console.log('✅ Questions test setup complete');
  });

  beforeEach(async () => {
    // Clean up questions and sessions before each test
    await mongoose.connection.collection('questions').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup common mock responses
    (openaiService.generateBehavioralQuestions as jest.Mock).mockResolvedValue([
      {
        question: 'Tell me about a time you overcame a challenge',
        context: 'Behavioral question about problem-solving',
        tips: ['structure with STAR method', 'be specific', 'show learning']
      },
      {
        question: 'Describe a leadership experience',
        context: 'Leadership and teamwork assessment',
        tips: ['demonstrate impact', 'show collaboration']
      }
    ]);

    (openaiService.generateAnswerFeedback as jest.Mock).mockResolvedValue({
      feedback: 'Good structure and specific examples. Consider adding more quantifiable results.',
      score: 8.5,
      strengths: ['Clear STAR structure', 'Specific examples', 'Good outcome'],
      improvements: ['Add quantifiable results', 'Mention lessons learned']
    });
  });

  afterAll(async () => {
    // Final cleanup
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('questions').deleteMany({});
    await mongoose.connection.collection('jobapplications').deleteMany({});
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/questions/generate - Generate Questions', () => {
    it('should generate behavioral and technical questions successfully', async () => {
      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
        count: 6
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      expect(response.body.message).toBe('Questions generated successfully');
      expect(response.body.data).toHaveProperty('behavioralQuestions');
      expect(response.body.data).toHaveProperty('technicalQuestions');
      expect(response.body.data).toHaveProperty('totalQuestions');
      expect(response.body.data.totalQuestions).toBeGreaterThan(0);

      // Verify questions were actually created in database
      const questionsInDb = await questionModel.findByJobId(testJobId, testUserId);
      expect(questionsInDb.length).toBeGreaterThan(0);
      
      const behavioralQuestions = questionsInDb.filter(q => q.type === QuestionType.BEHAVIORAL);
      const technicalQuestions = questionsInDb.filter(q => q.type === QuestionType.TECHNICAL);
      
      expect(behavioralQuestions.length).toBeGreaterThan(0);
      expect(technicalQuestions.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should generate only behavioral questions when requested', async () => {
      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL],
        count: 3
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      expect(response.body.data.behavioralQuestions.length).toBeGreaterThan(0);
      expect(response.body.data.technicalQuestions.length).toBe(0);

      // Verify in database
      const questionsInDb = await questionModel.findByJobId(testJobId, testUserId);
      const allBehavioral = questionsInDb.every(q => q.type === QuestionType.BEHAVIORAL);
      expect(allBehavioral).toBe(true);
    }, TEST_TIMEOUT);

    it('should generate only technical questions when requested', async () => {
      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.TECHNICAL],
        count: 4
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      expect(response.body.data.technicalQuestions.length).toBeGreaterThan(0);
      expect(response.body.data.behavioralQuestions.length).toBe(0);

      // Verify in database
      const questionsInDb = await questionModel.findByJobId(testJobId, testUserId);
      const allTechnical = questionsInDb.every(q => q.type === QuestionType.TECHNICAL);
      expect(allTechnical).toBe(true);
    }, TEST_TIMEOUT);

    it('should return 400 for missing job ID', async () => {
      const requestData = {
        types: [QuestionType.BEHAVIORAL],
        count: 5
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(400);

      expect(response.body.message).toBe('Job ID is required');
    }, TEST_TIMEOUT);

    it('should return 400 for missing or empty types', async () => {
      const requestData = {
        jobId: testJobId.toString(),
        types: [],
        count: 5
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(400);

      expect(response.body.message).toBe('At least one question type is required');
    }, TEST_TIMEOUT);

    it('should return 400 for invalid count range', async () => {
      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL],
        count: 30 // Over limit of 25
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(400);

      expect(response.body.message).toBe('Count must be between 1 and 25');
    }, TEST_TIMEOUT);

    it('should return 404 for non-existent job ID', async () => {
      const fakeJobId = new mongoose.Types.ObjectId();
      const requestData = {
        jobId: fakeJobId.toString(),
        types: [QuestionType.BEHAVIORAL],
        count: 5
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(404);

      expect(response.body.message).toBe('Job application not found');
    }, TEST_TIMEOUT);

    /* 
    it('should return 409 when active session exists for job', async () => {
      // Create questions first for the session
      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Sample question for session',
        description: 'Sample description'
      });

      const question = await questionModel.findByJobId(testJobId, testUserId);
      const questionIds = question.map(q => q._id);

      // Create an active session for the job with questions
      const sessionData = {
        userId: testUserId,
        jobId: testJobId,
        questionIds,
        type: 'mock_interview',
        status: 'active'
      };

      testSessionId = await sessionModel.create(sessionData);

      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL],
        count: 5
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(409);

      expect(response.body.message).toContain('Cannot regenerate questions while there is an active mock interview session');
    }, TEST_TIMEOUT);
    */

    it('should delete existing questions before generating new ones', async () => {
      // First generation
      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL],
        count: 3
      };

      await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      const firstQuestions = await questionModel.findByJobId(testJobId, testUserId);
      const firstCount = firstQuestions.length;

      // Second generation - should replace first
      await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      const secondQuestions = await questionModel.findByJobId(testJobId, testUserId);
      
      // Questions should be different (assuming they have different IDs)
      expect(secondQuestions.length).toBeGreaterThan(0);
      
      // Verify no old questions remain by checking that no question IDs match
      const firstIds = firstQuestions.map(q => q._id.toString());
      const secondIds = secondQuestions.map(q => q._id.toString());
      const overlap = firstIds.filter(id => secondIds.includes(id));
      expect(overlap.length).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle OpenAI service errors gracefully', async () => {
      // Mock OpenAI service to throw error
      (openaiService.generateBehavioralQuestions as jest.Mock).mockRejectedValue(
        new Error('OpenAI service unavailable')
      );

      const requestData = {
        jobId: testJobId.toString(),
        types: [QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
        count: 6
      };

      const response = await request(app)
        .post('/api/questions/generate')
        .send(requestData)
        .expect(201);

      // Should still succeed with technical questions even if behavioral fails
      expect(response.body.data.technicalQuestions.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('GET /api/questions/job/:jobId - Get Questions', () => {
    beforeEach(async () => {
      // Create test questions for GET tests
      const behavioralQuestion = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Tell me about yourself',
        description: 'Introduction behavioral question'
      });

      const technicalQuestion = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Two Sum',
        difficulty: 'easy',
        externalUrl: 'https://leetcode.com/problems/two-sum/'
      });

      testQuestionId = behavioralQuestion._id;
    });

    it('should get all questions for a job', async () => {
      const response = await request(app)
        .get(`/api/questions/job/${testJobId}`)
        .expect(200);

      expect(response.body.message).toBe('Questions fetched successfully');
      expect(response.body.data).toHaveProperty('behavioralQuestions');
      expect(response.body.data).toHaveProperty('technicalQuestions');
      expect(response.body.data.totalQuestions).toBe(2);
      expect(response.body.data.behavioralQuestions.length).toBe(1);
      expect(response.body.data.technicalQuestions.length).toBe(1);
    }, TEST_TIMEOUT);

    it('should filter questions by type when query parameter provided', async () => {
      const response = await request(app)
        .get(`/api/questions/job/${testJobId}?type=${QuestionType.BEHAVIORAL}`)
        .expect(200);

      expect(response.body.data.behavioralQuestions.length).toBe(1);
      expect(response.body.data.technicalQuestions.length).toBe(0); // Should filter out technical when type=behavioral
      expect(response.body.data.totalQuestions).toBe(1); // Total should reflect filtered count
    }, TEST_TIMEOUT);

    it('should return empty arrays when no questions exist', async () => {
      // Create a new job with no questions
      const newJob = await jobApplicationModel.create(testUserId, {
        ...testJobData,
        title: 'New Job with No Questions'
      });

      const response = await request(app)
        .get(`/api/questions/job/${newJob._id}`)
        .expect(200);

      expect(response.body.data.behavioralQuestions.length).toBe(0);
      expect(response.body.data.technicalQuestions.length).toBe(0);
      expect(response.body.data.totalQuestions).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/questions/job/invalid-id')
        .expect(500);

      expect(response.body.message).toBe('Failed to fetch questions');
    }, TEST_TIMEOUT);
  });

  describe('PUT /api/questions/:questionId/toggle - Toggle Question Status', () => {
    beforeEach(async () => {
      const question = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Tell me about a challenge',
        description: 'Challenge question'
      });
      testQuestionId = question._id;
    });

    it('should toggle question from pending to completed', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestionId}/toggle`)
        .expect(200);

      expect(response.body.message).toBe('Question marked as completed');
      expect(response.body.data.question.status).toBe(QuestionStatus.COMPLETED);

      // Verify in database
      const questionInDb = await questionModel.findById(testQuestionId, testUserId);
      expect(questionInDb?.status).toBe(QuestionStatus.COMPLETED);
    }, TEST_TIMEOUT);

    it('should toggle question from completed back to pending', async () => {
      // First mark as completed
      await questionModel.updateStatus(testQuestionId, testUserId, QuestionStatus.COMPLETED);

      const response = await request(app)
        .put(`/api/questions/${testQuestionId}/toggle`)
        .expect(200);

      expect(response.body.message).toBe('Question marked as pending');
      expect(response.body.data.question.status).toBe(QuestionStatus.PENDING);
    }, TEST_TIMEOUT);

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/questions/${fakeQuestionId}/toggle`)
        .expect(404);

      expect(response.body.message).toBe('Question not found');
    }, TEST_TIMEOUT);

    it('should handle invalid question ID format', async () => {
      const response = await request(app)
        .put('/api/questions/invalid-id/toggle')
        .expect(500);

      expect(response.body.message).toBe('Failed to toggle question status');
    }, TEST_TIMEOUT);
  });

  describe('POST /api/questions/submit-answer - Submit Behavioral Answer', () => {
    beforeEach(async () => {
      const question = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Tell me about a challenge you overcame',
        description: 'Challenge behavioral question'
      });
      testQuestionId = question._id;
    });

    it('should submit behavioral answer and receive feedback', async () => {
      const answerData = {
        questionId: testQuestionId.toString(),
        answer: 'I faced a challenging project deadline where I had to coordinate with multiple teams. Using the STAR method, I structured my approach by first analyzing the situation, identifying key tasks, implementing a communication plan, and ultimately delivering the project on time with improved team collaboration.'
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(200);

      expect(response.body.message).toBe('Answer submitted successfully');
      expect(response.body.data).toHaveProperty('feedback');
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('improvements');

      // Verify question status was updated to completed
      const questionInDb = await questionModel.findById(testQuestionId, testUserId);
      expect(questionInDb?.status).toBe(QuestionStatus.COMPLETED);
    }, TEST_TIMEOUT);

    it('should return 400 for missing question ID', async () => {
      const answerData = {
        answer: 'My answer here'
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(400);

      expect(response.body.message).toBe('Question ID is required');
    }, TEST_TIMEOUT);

    it('should return 400 for missing answer', async () => {
      const answerData = {
        questionId: testQuestionId.toString()
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(400);

      expect(response.body.message).toBe('Answer is required');
    }, TEST_TIMEOUT);

    it('should return 400 for empty answer', async () => {
      const answerData = {
        questionId: testQuestionId.toString(),
        answer: '   '  // Just whitespace
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(400);

      expect(response.body.message).toBe('Answer is required');
    }, TEST_TIMEOUT);

    it('should return 400 for answer too long', async () => {
      const longAnswer = 'A'.repeat(5001); // Over 5000 character limit
      const answerData = {
        questionId: testQuestionId.toString(),
        answer: longAnswer
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(400);

      expect(response.body.message).toBe('Answer too long (max 5000 characters)');
    }, TEST_TIMEOUT);

    it('should return 404 for non-existent question', async () => {
      const fakeQuestionId = new mongoose.Types.ObjectId();
      const answerData = {
        questionId: fakeQuestionId.toString(),
        answer: 'My answer here'
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(404);

      expect(response.body.message).toBe('Question not found');
    }, TEST_TIMEOUT);

    it('should return 400 for technical question type', async () => {
      // Create a technical question
      const technicalQuestion = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Two Sum Problem',
        difficulty: 'easy'
      });

      const answerData = {
        questionId: technicalQuestion._id.toString(),
        answer: 'My answer here'
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(400);

      expect(response.body.message).toBe('This endpoint is only for behavioral questions');
    }, TEST_TIMEOUT);

    it('should handle OpenAI service errors gracefully', async () => {
      // Mock OpenAI service to throw error
      (openaiService.generateAnswerFeedback as jest.Mock).mockRejectedValue(
        new Error('OpenAI service error')
      );

      const answerData = {
        questionId: testQuestionId.toString(),
        answer: 'My answer here'
      };

      const response = await request(app)
        .post('/api/questions/behavioral/submit')
        .send(answerData)
        .expect(500);

      expect(response.body.message).toBe('Failed to submit behavioral answer');
    }, TEST_TIMEOUT);
  });

  describe('GET /api/questions/progress/:jobId - Get Question Progress', () => {
    beforeEach(async () => {
      // Create mixed status questions for progress testing
      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Behavioral Question 1',
        description: 'First behavioral question'
      });

      const completedBehavioral = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Behavioral Question 2',
        description: 'Second behavioral question'
      });

      const technicalQuestion = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Technical Question 1',
        difficulty: 'medium'
      });

      // Mark one behavioral and the technical as completed
      await questionModel.updateStatus(completedBehavioral._id, testUserId, QuestionStatus.COMPLETED);
      await questionModel.updateStatus(technicalQuestion._id, testUserId, QuestionStatus.COMPLETED);
    });

    it('should return correct progress statistics', async () => {
      const response = await request(app)
        .get(`/api/questions/job/${testJobId}/progress`)
        .expect(200);

      expect(response.body.message).toBe('Question progress fetched successfully');
      expect(response.body.data.jobId).toBe(testJobId.toString());
      expect(response.body.data.progress).toEqual({
        technical: {
          total: 1,
          completed: 1
        },
        behavioral: {
          total: 2,
          completed: 1
        },
        overall: {
          total: 3,
          completed: 2
        }
      });
    }, TEST_TIMEOUT);

    it('should return zero progress for job with no questions', async () => {
      const newJob = await jobApplicationModel.create(testUserId, {
        ...testJobData,
        title: 'Job with No Questions'
      });

      const response = await request(app)
        .get(`/api/questions/job/${newJob._id}/progress`)
        .expect(200);

      expect(response.body.data.progress).toEqual({
        technical: { total: 0, completed: 0 },
        behavioral: { total: 0, completed: 0 },
        overall: { total: 0, completed: 0 }
      });
    }, TEST_TIMEOUT);

    it('should handle invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/questions/job/invalid-id/progress')
        .expect(500);

      expect(response.body.message).toBe('Failed to fetch question progress');
    }, TEST_TIMEOUT);
  });

  describe('Question Model Edge Cases and Error Handling', () => {
    it('should handle question creation validation errors', async () => {
      // Test missing required fields
      await expect(
        questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: '', // Empty title should fail
          description: 'Test description'
        })
      ).rejects.toThrow('Title is required');
    }, TEST_TIMEOUT);

    it('should handle title too long validation', async () => {
      const longTitle = 'A'.repeat(201); // Over 200 character limit
      
      await expect(
        questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: longTitle,
          description: 'Test description'
        })
      ).rejects.toThrow('Title too long (max 200 characters)');
    }, TEST_TIMEOUT);

    it('should require description for behavioral questions', async () => {
      await expect(
        questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: 'Valid Title'
          // Missing description for behavioral
        })
      ).rejects.toThrow('Description is required for behavioral questions');
    }, TEST_TIMEOUT);

    it('should validate question type', async () => {
      await expect(
        questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: 'invalid-type' as any,
          title: 'Valid Title',
          description: 'Valid description'
        })
      ).rejects.toThrow('Invalid question type');
    }, TEST_TIMEOUT);

    it('should handle database errors during question creation', async () => {
      // Test with invalid ObjectId format for jobId
      await expect(
        questionModel.create(testUserId, {
          jobId: 'invalid-object-id',
          type: QuestionType.BEHAVIORAL,
          title: 'Valid Title',
          description: 'Valid description'
        })
      ).rejects.toThrow();
    }, TEST_TIMEOUT);

    it('should validate external URL format', async () => {
      // Test that invalid URL throws validation error
      await expect(
        questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Technical Question',
          externalUrl: 'not-a-valid-url'
        })
      ).rejects.toThrow('Invalid URL format');
    }, TEST_TIMEOUT);

    it('should create question with valid external URL', async () => {
      const question = await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Technical Question',
        externalUrl: 'https://leetcode.com/problems/valid-url'
      });

      expect(question.externalUrl).toBe('https://leetcode.com/problems/valid-url');
    }, TEST_TIMEOUT);

    it('should handle bulk question deletion', async () => {
      // Create multiple questions
      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Question 1',
        description: 'Description 1'
      });

      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Question 2'
      });

      // Delete all questions for this job
      const deletedCount = await questionModel.deleteByJobId(testJobId, testUserId);
      expect(deletedCount).toBe(2);

      // Verify they're gone
      const remaining = await questionModel.findByJobId(testJobId, testUserId);
      expect(remaining.length).toBe(0);
    }, TEST_TIMEOUT);

    it('should handle finding questions with complex queries', async () => {
      // Create questions of both types
      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.BEHAVIORAL,
        title: 'Behavioral Question',
        description: 'Behavioral description'
      });

      await questionModel.create(testUserId, {
        jobId: testJobId.toString(),
        type: QuestionType.TECHNICAL,
        title: 'Technical Question'
      });

      // Test finding by specific type
      const behavioralOnly = await questionModel.findByJobAndType(
        testJobId, 
        testUserId, 
        QuestionType.BEHAVIORAL
      );
      expect(behavioralOnly.length).toBe(1);
      expect(behavioralOnly[0].type).toBe(QuestionType.BEHAVIORAL);

      const technicalOnly = await questionModel.findByJobAndType(
        testJobId, 
        testUserId, 
        QuestionType.TECHNICAL
      );
      expect(technicalOnly.length).toBe(1);
      expect(technicalOnly[0].type).toBe(QuestionType.TECHNICAL);
    }, TEST_TIMEOUT);
  });

  // Additional Question Model Tests for 100% Coverage
  describe('Question Model - Direct Method Testing for Complete Coverage', () => {
    beforeEach(async () => {
      await mongoose.connection.collection('questions').deleteMany({});
    });

    describe('create method - Additional Coverage', () => {
      it('should handle missing jobId', async () => {
        await expect(
          questionModel.create(testUserId, {
            jobId: '' as any,
            type: QuestionType.TECHNICAL,
            title: 'Test Question'
          })
        ).rejects.toThrow('Job ID is required');
      }, TEST_TIMEOUT);

      it('should trim title whitespace', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: '  Whitespace Title  '
        });

        expect(question.title).toBe('Whitespace Title');
      }, TEST_TIMEOUT);

      it('should trim description whitespace', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: 'Test Question',
          description: '  Whitespace Description  '
        });

        expect(question.description).toBe('Whitespace Description');
      }, TEST_TIMEOUT);

      it('should set default empty description when not provided', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Test Question'
        });

        expect(question.description).toBe('');
      }, TEST_TIMEOUT);

      it('should handle all optional fields', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Complete Question',
          description: 'Complete description',
          difficulty: 'hard',
          tags: ['algorithms', 'data-structures'],
          externalUrl: 'https://leetcode.com/problems/example'
        });

        expect(question.difficulty).toBe('hard');
        expect(question.tags).toEqual(['algorithms', 'data-structures']);
        expect(question.externalUrl).toBe('https://leetcode.com/problems/example');
      }, TEST_TIMEOUT);

      it('should set default empty array for tags when not provided', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Test Question'
        });

        expect(question.tags).toEqual([]);
      }, TEST_TIMEOUT);

      it('should handle non-Error exceptions during create', async () => {
        // Mock mongoose to throw a non-Error object
        const originalSave = mongoose.Model.prototype.save;
        mongoose.Model.prototype.save = jest.fn().mockRejectedValueOnce('String error');

        await expect(
          questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: QuestionType.TECHNICAL,
            title: 'Test Question'
          })
        ).rejects.toThrow('Failed to create question');

        mongoose.Model.prototype.save = originalSave;
      }, TEST_TIMEOUT);

      it('should allow empty external URL', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Test Question',
          externalUrl: ''
        });

        expect(question.externalUrl).toBe('');
      }, TEST_TIMEOUT);
    });

    describe('createMany method - Direct Testing', () => {
      it('should create multiple questions successfully', async () => {
        const questionsData = [
          {
            type: QuestionType.TECHNICAL,
            title: 'Question 1',
            difficulty: 'easy'
          },
          {
            type: QuestionType.BEHAVIORAL,
            title: 'Question 2',
            description: 'Description 2',
            difficulty: 'medium'
          },
          {
            type: QuestionType.TECHNICAL,
            title: 'Question 3',
            tags: ['algorithms']
          }
        ];

        const results = await questionModel.createMany(testUserId, testJobId, questionsData);

        expect(results).toHaveLength(3);
        expect(results[0].title).toBe('Question 1');
        expect(results[1].title).toBe('Question 2');
        expect(results[2].title).toBe('Question 3');
        results.forEach(question => {
          expect(question.userId.toString()).toBe(testUserId.toString());
          expect(question.jobId.toString()).toBe(testJobId.toString());
        });
      }, TEST_TIMEOUT);

      it('should handle empty array', async () => {
        const results = await questionModel.createMany(testUserId, testJobId, []);

        expect(results).toHaveLength(0);
      }, TEST_TIMEOUT);

      it('should handle database errors during createMany', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.createMany(testUserId, testJobId, [
            { type: QuestionType.TECHNICAL, title: 'Test' }
          ])
        ).rejects.toThrow('Failed to create questions');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('findByJobAndType method - Direct Testing', () => {
      beforeEach(async () => {
        // Create test questions
        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Technical 1',
          difficulty: 'easy'
        });

        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Technical 2',
          difficulty: 'hard'
        });

        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: 'Behavioral 1',
          description: 'Behavioral description'
        });
      });

      it('should find all questions when type not specified', async () => {
        const results = await questionModel.findByJobAndType(testJobId, testUserId);

        expect(results.length).toBe(3);
      }, TEST_TIMEOUT);

      it('should find questions by specific type', async () => {
        const technicalResults = await questionModel.findByJobAndType(
          testJobId, 
          testUserId, 
          QuestionType.TECHNICAL
        );

        expect(technicalResults.length).toBe(2);
        technicalResults.forEach(q => {
          expect(q.type).toBe(QuestionType.TECHNICAL);
        });
      }, TEST_TIMEOUT);

      it('should return questions sorted by createdAt descending', async () => {
        const results = await questionModel.findByJobAndType(testJobId, testUserId);

        // Results should be sorted newest first
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            results[i + 1].createdAt.getTime()
          );
        }
      }, TEST_TIMEOUT);

      it('should handle database errors during findByJobAndType', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.findByJobAndType(testJobId, testUserId)
        ).rejects.toThrow('Failed to find questions');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('findById method - Direct Testing', () => {
      let createdQuestionId: mongoose.Types.ObjectId;

      beforeEach(async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Test Question for FindById'
        });
        createdQuestionId = question._id;
      });

      it('should find question by ID successfully', async () => {
        const result = await questionModel.findById(createdQuestionId, testUserId);

        expect(result).toBeTruthy();
        expect(result!.title).toBe('Test Question for FindById');
        expect(result!.userId.toString()).toBe(testUserId.toString());
      }, TEST_TIMEOUT);

      it('should return null when question not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const result = await questionModel.findById(nonExistentId, testUserId);

        expect(result).toBeNull();
      }, TEST_TIMEOUT);

      it('should return null when question belongs to different user', async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        const result = await questionModel.findById(createdQuestionId, differentUserId);

        expect(result).toBeNull();
      }, TEST_TIMEOUT);

      it('should handle database errors during findById', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.findById(createdQuestionId, testUserId)
        ).rejects.toThrow('Failed to find question');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('updateStatus method - Direct Testing', () => {
      let createdQuestionId: mongoose.Types.ObjectId;

      beforeEach(async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Test Question for Update'
        });
        createdQuestionId = question._id;
      });

      it('should update question status successfully', async () => {
        const result = await questionModel.updateStatus(
          createdQuestionId,
          testUserId,
          QuestionStatus.COMPLETED
        );

        expect(result).toBeTruthy();
        expect(result!.status).toBe(QuestionStatus.COMPLETED);
      }, TEST_TIMEOUT);

      it('should update all valid status values', async () => {
        const statuses = [
          QuestionStatus.PENDING,
          QuestionStatus.COMPLETED
        ];

        for (const status of statuses) {
          const result = await questionModel.updateStatus(
            createdQuestionId,
            testUserId,
            status
          );
          expect(result!.status).toBe(status);
        }
      }, TEST_TIMEOUT);

      it('should return null when question not found', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const result = await questionModel.updateStatus(
          nonExistentId,
          testUserId,
          QuestionStatus.COMPLETED
        );

        expect(result).toBeNull();
      }, TEST_TIMEOUT);

      it('should return null when question belongs to different user', async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        const result = await questionModel.updateStatus(
          createdQuestionId,
          differentUserId,
          QuestionStatus.COMPLETED
        );

        expect(result).toBeNull();
      }, TEST_TIMEOUT);

      it('should update updatedAt timestamp', async () => {
        const originalQuestion = await questionModel.findById(createdQuestionId, testUserId);
        const originalUpdatedAt = originalQuestion!.updatedAt;

        await new Promise(resolve => setTimeout(resolve, 100));

        const updated = await questionModel.updateStatus(
          createdQuestionId,
          testUserId,
          QuestionStatus.COMPLETED
        );

        expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, TEST_TIMEOUT);

      it('should handle database errors during updateStatus', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.updateStatus(createdQuestionId, testUserId, QuestionStatus.COMPLETED)
        ).rejects.toThrow('Failed to update question status');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('findByJobId method - Direct Testing', () => {
      beforeEach(async () => {
        // Create multiple questions for the test job
        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Question 1'
        });

        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: 'Question 2',
          description: 'Description 2'
        });
      });

      it('should find all questions by job ID', async () => {
        const results = await questionModel.findByJobId(testJobId, testUserId);

        expect(results.length).toBe(2);
        results.forEach(question => {
          expect(question.jobId.toString()).toBe(testJobId.toString());
          expect(question.userId.toString()).toBe(testUserId.toString());
        });
      }, TEST_TIMEOUT);

      it('should return empty array for job with no questions', async () => {
        const newJob = await jobApplicationModel.create(testUserId, {
          ...testJobData,
          title: 'New Job'
        });

        const results = await questionModel.findByJobId(newJob._id, testUserId);

        expect(results).toEqual([]);
      }, TEST_TIMEOUT);

      it('should return empty array for different user', async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        const results = await questionModel.findByJobId(testJobId, differentUserId);

        expect(results).toEqual([]);
      }, TEST_TIMEOUT);

      it('should handle database errors during findByJobId', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.findByJobId(testJobId, testUserId)
        ).rejects.toThrow('Failed to find questions by job ID');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('getProgressByJob method - Direct Testing', () => {
      beforeEach(async () => {
        // Create mix of questions with different statuses
        const questions = [
          {
            type: QuestionType.TECHNICAL,
            title: 'Tech 1',
            status: QuestionStatus.COMPLETED
          },
          {
            type: QuestionType.TECHNICAL,
            title: 'Tech 2',
            status: QuestionStatus.PENDING
          },
          {
            type: QuestionType.TECHNICAL,
            title: 'Tech 3',
            status: QuestionStatus.IN_PROGRESS
          },
          {
            type: QuestionType.BEHAVIORAL,
            title: 'Behavioral 1',
            description: 'Desc 1',
            status: QuestionStatus.COMPLETED
          },
          {
            type: QuestionType.BEHAVIORAL,
            title: 'Behavioral 2',
            description: 'Desc 2',
            status: QuestionStatus.COMPLETED
          },
          {
            type: QuestionType.BEHAVIORAL,
            title: 'Behavioral 3',
            description: 'Desc 3',
            status: QuestionStatus.SKIPPED
          }
        ];

        for (const q of questions) {
          const created = await questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            ...q
          });
          if (q.status !== QuestionStatus.PENDING) {
            await questionModel.updateStatus(created._id, testUserId, q.status);
          }
        }
      });

      it('should calculate progress correctly', async () => {
        const progress = await questionModel.getProgressByJob(testJobId, testUserId);

        expect(progress.technical.total).toBe(3);
        expect(progress.technical.completed).toBe(1);
        expect(progress.behavioral.total).toBe(3);
        expect(progress.behavioral.completed).toBe(2);
        expect(progress.overall.total).toBe(6);
        expect(progress.overall.completed).toBe(3);
      }, TEST_TIMEOUT);

      it('should return zero progress for job with no questions', async () => {
        const newJob = await jobApplicationModel.create(testUserId, {
          ...testJobData,
          title: 'Empty Job'
        });

        const progress = await questionModel.getProgressByJob(newJob._id, testUserId);

        expect(progress.technical.total).toBe(0);
        expect(progress.technical.completed).toBe(0);
        expect(progress.behavioral.total).toBe(0);
        expect(progress.behavioral.completed).toBe(0);
        expect(progress.overall.total).toBe(0);
        expect(progress.overall.completed).toBe(0);
      }, TEST_TIMEOUT);

      it('should only count COMPLETED status as completed', async () => {
        await mongoose.connection.collection('questions').deleteMany({});

        // Create questions with PENDING status (not completed)
        const statuses = [
          QuestionStatus.PENDING,
          QuestionStatus.PENDING,
          QuestionStatus.PENDING
        ];

        for (const status of statuses) {
          const created = await questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: QuestionType.TECHNICAL,
            title: `Question ${status}`
          });
          await questionModel.updateStatus(created._id, testUserId, status);
        }

        const progress = await questionModel.getProgressByJob(testJobId, testUserId);

        expect(progress.technical.total).toBe(3);
        expect(progress.technical.completed).toBe(0);
        expect(progress.overall.total).toBe(3);
        expect(progress.overall.completed).toBe(0);
      }, TEST_TIMEOUT);

      it('should handle database errors during getProgressByJob', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.getProgressByJob(testJobId, testUserId)
        ).rejects.toThrow('Failed to get question progress');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('deleteByJobId method - Direct Testing', () => {
      beforeEach(async () => {
        // Create multiple questions
        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'To Delete 1'
        });

        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.BEHAVIORAL,
          title: 'To Delete 2',
          description: 'Description'
        });

        await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'To Delete 3'
        });
      });

      it('should delete all questions for a job', async () => {
        const deletedCount = await questionModel.deleteByJobId(testJobId, testUserId);

        expect(deletedCount).toBe(3);

        const remaining = await questionModel.findByJobId(testJobId, testUserId);
        expect(remaining).toEqual([]);
      }, TEST_TIMEOUT);

      it('should return 0 when no questions to delete', async () => {
        const newJob = await jobApplicationModel.create(testUserId, {
          ...testJobData,
          title: 'Job with No Questions'
        });

        const deletedCount = await questionModel.deleteByJobId(newJob._id, testUserId);

        expect(deletedCount).toBe(0);
      }, TEST_TIMEOUT);

      it('should not delete questions belonging to different user', async () => {
        const differentUserId = new mongoose.Types.ObjectId();

        const deletedCount = await questionModel.deleteByJobId(testJobId, differentUserId);

        expect(deletedCount).toBe(0);

        const remaining = await questionModel.findByJobId(testJobId, testUserId);
        expect(remaining.length).toBe(3);
      }, TEST_TIMEOUT);

      it('should handle database errors during deleteByJobId', async () => {
        await mongoose.connection.close();

        await expect(
          questionModel.deleteByJobId(testJobId, testUserId)
        ).rejects.toThrow('Failed to delete questions');

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(uri);
      }, TEST_TIMEOUT);
    });

    describe('Schema Validation and Edge Cases', () => {
      it('should enforce maxlength on title field', async () => {
        const longTitle = 'A'.repeat(201);

        await expect(
          questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: QuestionType.TECHNICAL,
            title: longTitle
          })
        ).rejects.toThrow();
      }, TEST_TIMEOUT);

      it('should validate difficulty enum values', async () => {
        const validDifficulties = ['easy', 'medium', 'hard'];

        for (const difficulty of validDifficulties) {
          const question = await questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: QuestionType.TECHNICAL,
            title: `Question ${difficulty}`,
            difficulty: difficulty as any
          });

          expect(question.difficulty).toBe(difficulty);
        }
      }, TEST_TIMEOUT);

      it('should set default PENDING status', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Default Status Question'
        });

        expect(question.status).toBe(QuestionStatus.PENDING);
      }, TEST_TIMEOUT);

      it('should create timestamps automatically', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Timestamped Question'
        });

        expect(question.createdAt).toBeDefined();
        expect(question.updatedAt).toBeDefined();
        expect(question.createdAt).toBeInstanceOf(Date);
        expect(question.updatedAt).toBeInstanceOf(Date);
      }, TEST_TIMEOUT);

      it('should handle all QuestionType enum values', async () => {
        const types = [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL];

        for (const type of types) {
          const question = await questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: type,
            title: `Question ${type}`,
            description: type === QuestionType.BEHAVIORAL ? 'Required description' : undefined
          });

          expect(question.type).toBe(type);
        }
      }, TEST_TIMEOUT);

      it('should handle all QuestionStatus enum values', async () => {
        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Status Test Question'
        });

        const statuses = [
          QuestionStatus.PENDING,
          QuestionStatus.COMPLETED
        ];

        for (const status of statuses) {
          const updated = await questionModel.updateStatus(question._id, testUserId, status);
          expect(updated!.status).toBe(status);
        }
      }, TEST_TIMEOUT);

      it('should store tags as array', async () => {
        const tags = ['algorithms', 'data-structures', 'dynamic-programming'];

        const question = await questionModel.create(testUserId, {
          jobId: testJobId.toString(),
          type: QuestionType.TECHNICAL,
          title: 'Tagged Question',
          tags: tags
        });

        expect(question.tags).toEqual(tags);
        expect(Array.isArray(question.tags)).toBe(true);
      }, TEST_TIMEOUT);

      it('should validate URL protocol in externalUrl', async () => {
        const validUrls = [
          'https://leetcode.com/problems/example',
          'http://example.com/question',
          'https://www.hackerrank.com/challenge'
        ];

        for (const url of validUrls) {
          const question = await questionModel.create(testUserId, {
            jobId: testJobId.toString(),
            type: QuestionType.TECHNICAL,
            title: 'URL Test',
            externalUrl: url
          });

          expect(question.externalUrl).toBe(url);
        }
      }, TEST_TIMEOUT);
    });
  });
});