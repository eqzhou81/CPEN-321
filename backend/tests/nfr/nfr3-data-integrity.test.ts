/// <reference types="jest" />
jest.unmock('mongoose');

import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import { jobApplicationModel } from '../../src/models/jobApplication.model';
import { discussionModel } from '../../src/models/discussions.model';
import { questionModel } from '../../src/models/question.model';
import { userModel } from '../../src/models/user.model';
import { QuestionStatus, QuestionType } from '../../src/types/questions.types';

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
const JWT_SECRET = process.env.JWT_SECRET || 'nfr-test-secret';

type TestUser = {
  id: string;
  name: string;
  email: string;
  token: string;
};

const collectionNames = [
  'users',
  'jobapplications',
  'questions',
  'discussions',
  'sessions',
];

const createTestUser = async (index: number): Promise<TestUser> => {
  const suffix = `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
  const user = await userModel.create({
    googleId: `gid-nfr3-${suffix}`,
    email: `nfr3-user-${suffix}@example.com`,
    name: `NFR3 User ${index}`,
  });

  const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET);

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    token,
  };
};

const clearCollections = async () => {
  for (const name of collectionNames) {
    if (mongoose.connection.collection(name)) {
      await mongoose.connection.collection(name).deleteMany({});
    }
  }
};

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

describe('NFR-3: Data Integrity and Consistency', () => {
  let app: Express;
  let behavioralMock: ReturnType<typeof jest.spyOn>;
  let feedbackMock: ReturnType<typeof jest.spyOn>;
  let technicalMock: ReturnType<typeof jest.spyOn>;
  let originalBypassAuth: string | undefined;
  let primaryUser: TestUser;

  beforeAll(async () => {
    originalBypassAuth = process.env.BYPASS_AUTH;
    process.env.BYPASS_AUTH = 'false';
    process.env.JWT_SECRET = JWT_SECRET;

    const appModule = await import('../../src/config/app');
    app = appModule.app;

    const openaiModule = await import('../../src/services/openai.service');
    behavioralMock = jest
      .spyOn(openaiModule.openaiService, 'generateBehavioralQuestions')
      .mockImplementation(async (_job, count = 1) => {
        const safeCount = Number.isFinite(count) && count > 0 ? count : 1;
        return Array.from({ length: safeCount }, (_, index) => ({
          question: `Behavioral question ${index + 1}`,
          context: `Behavioral context ${index + 1}`,
          tips: ['Stay structured', 'Use STAR method'],
        }));
      });
    feedbackMock = jest
      .spyOn(openaiModule.openaiService, 'generateAnswerFeedback')
      .mockResolvedValue({
        feedback: 'Strong answer with clear STAR structure.',
        score: 9,
        strengths: ['Clear storytelling', 'Specific metrics'],
        improvements: ['Include team impact'],
      });

    const generateModule = await import('../../src/services/generateQuestions.service');
    technicalMock = jest
      .spyOn(generateModule, 'generateQuestions')
      .mockImplementation(async (_jobDescription: string) =>
        Array.from({ length: 5 }, (_, topicIndex) => ({
          topic: `Topic ${topicIndex + 1}`,
          questions: Array.from({ length: 5 }, (_, questionIndex) => ({
            id: `tech-${topicIndex + 1}-${questionIndex + 1}`,
            title: `Technical Question ${topicIndex + 1}-${questionIndex + 1}`,
            difficulty: ['easy', 'medium', 'hard'][questionIndex % 3],
            url: `https://example.com/questions/${topicIndex + 1}-${questionIndex + 1}`,
            tags: ['arrays', 'strings'],
          })),
        }))
      );

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB_URI);
    }

    await clearCollections();
    primaryUser = await createTestUser(0);

    jest.setTimeout(300000);
  });

  afterAll(async () => {
    await clearCollections();
    behavioralMock.mockRestore();
    feedbackMock.mockRestore();
    technicalMock.mockRestore();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    if (originalBypassAuth !== undefined) {
      process.env.BYPASS_AUTH = originalBypassAuth;
    } else {
      delete process.env.BYPASS_AUTH;
    }
  });

  beforeEach(() => {
    behavioralMock.mockClear();
    feedbackMock.mockClear();
    technicalMock.mockClear();
  });

  describe('CRUD consistency load tests', () => {
    const RUNS = 1;
    const JOBS_PER_RUN = 5;
    const DISCUSSIONS_PER_RUN = 3;
    const QUESTIONS_PER_JOB = 2;

    it(
      'ensures repeated CRUD cycles do not lose data',
      async () => {
        for (let run = 0; run < RUNS; run++) {
          await clearCollections();
          primaryUser = await createTestUser(run);

          const createdJobPayloads: any[] = [];
          const createdJobIds: string[] = [];

          for (let jobIndex = 0; jobIndex < JOBS_PER_RUN; jobIndex++) {
            const jobPayload = {
              title: `NFR Job ${run}-${jobIndex}`,
              company: `NFR Company ${jobIndex}`,
              description: `Test job description ${jobIndex}`,
              location: 'Vancouver, BC',
              requirements: ['Requirement A', 'Requirement B'],
              skills: ['TypeScript', 'Node.js'],
              salary: '$100k',
              jobType: 'full-time' as const,
              experienceLevel: 'mid' as const,
            };

            const response = await request(app)
              .post('/api/jobs')
              .set('Authorization', `Bearer ${primaryUser.token}`)
              .send(jobPayload)
              .expect(201);

            const jobId = response.body.data.jobApplication._id as string;
            createdJobPayloads.push({ ...jobPayload, _id: jobId });
            createdJobIds.push(jobId);
          }

          let totalQuestionsCreated = 0;

          for (const jobId of createdJobIds) {
            const questionPayloads = [
              {
                jobId,
                type: QuestionType.BEHAVIORAL,
                title: `Behavioral question ${run}-${jobId}`,
                description: 'Describe a challenge you overcame',
              },
              {
                jobId,
                type: QuestionType.TECHNICAL,
                title: `Technical question ${run}-${jobId}`,
                difficulty: 'medium' as const,
              },
            ];

            for (const payload of questionPayloads) {
              await questionModel.create(new mongoose.Types.ObjectId(primaryUser.id), {
                ...payload,
              });
              totalQuestionsCreated += 1;
            }
          }

          const createdDiscussionIds: string[] = [];
          for (let discussionIndex = 0; discussionIndex < DISCUSSIONS_PER_RUN; discussionIndex++) {
            const response = await request(app)
              .post('/api/discussions')
              .set('Authorization', `Bearer ${primaryUser.token}`)
              .send({
                topic: `NFR Discussion ${run}-${discussionIndex}`,
                description: `Discussion description ${discussionIndex}`,
              })
            .expect((res) => {
              if (res.status !== 201) {
                // eslint-disable-next-line no-console
                console.error('Failed to create discussion', {
                  status: res.status,
                  body: res.body,
                });
              }
            })
            .expect(201);

            createdDiscussionIds.push(response.body.discussionId);
          }

          const jobsResponse = await request(app)
            .get('/api/jobs?limit=200')
            .set('Authorization', `Bearer ${primaryUser.token}`)
            .expect(200);

          const jobsFromApi = jobsResponse.body.data.jobApplications;
          expect(jobsFromApi).toHaveLength(JOBS_PER_RUN);
          const jobIdsFromApi = new Set(jobsFromApi.map((job: any) => job._id.toString()));
          createdJobIds.forEach((id) => expect(jobIdsFromApi.has(id)).toBe(true));

          const questionsInDb = await questionModel.findByJobId(
            new mongoose.Types.ObjectId(createdJobIds[0]),
            new mongoose.Types.ObjectId(primaryUser.id)
          );

          const totalQuestionsInDb = await mongoose.connection
            .collection('questions')
            .countDocuments({ userId: new mongoose.Types.ObjectId(primaryUser.id) });

          expect(totalQuestionsCreated).toBeGreaterThanOrEqual(QUESTIONS_PER_JOB);
          expect(totalQuestionsInDb).toBeGreaterThanOrEqual(totalQuestionsCreated);
          expect(questionsInDb.every((q) => q.userId.toString() === primaryUser.id)).toBe(true);

          const discussionsResponse = await request(app)
            .get('/api/discussions?limit=100&sortBy=recent')
            .set('Authorization', `Bearer ${primaryUser.token}`)
            .expect(200);

          const discussions = discussionsResponse.body.data;
          expect(discussions.length).toBeGreaterThanOrEqual(DISCUSSIONS_PER_RUN);
          const discussionTopics = new Set(discussions.map((d: any) => d.topic));
          createdDiscussionIds.forEach((id) => {
            const matchingDiscussion = discussions.find((d: any) => d.id === id);
            expect(matchingDiscussion).toBeDefined();
          });
        }
      },
      240000
    );
  });

  describe('Rapid update stability tests', () => {
    beforeEach(async () => {
      await clearCollections();
      primaryUser = await createTestUser(100);
    });

    it('maintains toggle consistency under rapid sequential updates', async () => {
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${primaryUser.token}`)
        .send({
          title: 'Toggle Stability Job',
          company: 'Race Conditions Inc.',
          description: 'Job used for toggle testing',
          location: 'Remote',
        })
        .expect(201);

      const jobId = jobResponse.body.data.jobApplication._id as string;

      const questionDoc = await questionModel.create(new mongoose.Types.ObjectId(primaryUser.id), {
        jobId,
        type: QuestionType.BEHAVIORAL,
        title: 'Toggle Question',
        description: 'Toggle testing question',
      });

      const questionId = questionDoc._id.toString();

      const toggleCount = 20;
      for (let i = 0; i < toggleCount; i++) {
        await request(app)
          .put(`/api/questions/${questionId}/toggle`)
          .set('Authorization', `Bearer ${primaryUser.token}`)
          .expect(200);
      }

      const finalQuestion = await questionModel.findById(
        new mongoose.Types.ObjectId(questionId),
        new mongoose.Types.ObjectId(primaryUser.id)
      );

      expect(finalQuestion).not.toBeNull();
      expect(finalQuestion?.status).toBe(QuestionStatus.PENDING);
    });

    it('stores sequential discussion messages without corruption', async () => {
      const discussion = await discussionModel.create(
        primaryUser.id,
        primaryUser.name,
        'Discussion Stability',
        'Testing rapid posts'
      );

      const discussionId = discussion._id.toString();

      const messageCount = 20;
      for (let i = 0; i < messageCount; i++) {
        const user = await createTestUser(300 + i);
        await request(app)
          .post(`/api/discussions/${discussionId}/messages`)
          .set('Authorization', `Bearer ${user.token}`)
          .send({
            content: `Message ${i}`,
          })
          .expect(201);
      }

      const discussionAfter = await mongoose.connection
        .collection('discussions')
        .findOne({ _id: new mongoose.Types.ObjectId(discussionId) });

      expect(discussionAfter).not.toBeNull();
      expect(discussionAfter?.messages).toHaveLength(messageCount);
      expect(discussionAfter?.messageCount).toBe(messageCount);
      expect(discussionAfter?.participantCount).toBe(messageCount);
    });
  });

  describe('Database integrity validation', () => {
    beforeAll(async () => {
      await clearCollections();
      primaryUser = await createTestUser(500);

      for (let i = 0; i < 5; i++) {
        const jobResponse = await request(app)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${primaryUser.token}`)
          .send({
            title: `Integrity Job ${i}`,
            company: `Integrity Co ${i}`,
            description: 'Integrity testing job',
            location: 'Canada',
          });

        const jobId = jobResponse.body.data.jobApplication._id as string;

        await request(app)
          .post('/api/questions/generate')
          .set('Authorization', `Bearer ${primaryUser.token}`)
          .send({
            jobId,
            types: [QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
            count: 6,
          });

        await request(app)
          .post('/api/discussions')
          .set('Authorization', `Bearer ${primaryUser.token}`)
          .send({
            topic: `Integrity Discussion ${i}`,
            description: 'Integrity test',
          });
      }
    });

    it('passes MongoDB validate checks and ensures no orphaned records', async () => {
      for (const name of collectionNames) {
        const validationResult = await mongoose.connection.db!.command({ validate: name });
        expect(validationResult.ok).toBe(1);
      }

      const jobIds = new Set(
        (
          await mongoose.connection
            .collection('jobapplications')
            .find({}, { projection: { _id: 1 } })
            .toArray()
        ).map((doc) => doc._id.toString())
      );

      const questions = await mongoose.connection
        .collection('questions')
        .find({}, { projection: { jobId: 1 } })
        .toArray();

      const orphanQuestions = questions.filter(
        (question) => !jobIds.has(question.jobId?.toString())
      );

      expect(orphanQuestions).toHaveLength(0);

      const discussions = await mongoose.connection
        .collection('discussions')
        .find({}, { projection: { messages: 1 } })
        .toArray();

      const hasInvalidMessages = discussions.some((discussion) =>
        discussion.messages?.some(
          (message: any) =>
            !message._id ||
            !message.userId ||
            !message.userName ||
            !message.content ||
            !message.createdAt
        )
      );

      expect(hasInvalidMessages).toBe(false);
    });
  });

  describe('Transaction rollback behaviour', () => {
    beforeEach(async () => {
      await clearCollections();
      primaryUser = await createTestUser(800);
    });

    it('does not leave partial data when question generation fails', async () => {
      const jobResponse = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${primaryUser.token}`)
        .send({
          title: 'Rollback Job',
          company: 'Atomic Operations Ltd.',
          description: 'Testing rollback behaviour',
          location: 'Hybrid',
        })
        .expect(201);

      const jobId = jobResponse.body.data.jobApplication._id as string;

      const createManySpy = jest
        .spyOn(questionModel, 'createMany')
        .mockRejectedValueOnce(new Error('Simulated insertion failure'));

      const response = await request(app)
        .post('/api/questions/generate')
        .set('Authorization', `Bearer ${primaryUser.token}`)
        .send({
          jobId,
          types: [QuestionType.BEHAVIORAL, QuestionType.TECHNICAL],
          count: 6,
        })
        .expect(500);

      expect(response.body.message).toBe('Failed to generate questions');

      const jobStillExists = await jobApplicationModel.findById(
        new mongoose.Types.ObjectId(jobId),
        new mongoose.Types.ObjectId(primaryUser.id)
      );
      expect(jobStillExists).not.toBeNull();

      const questionsAfterFailure = await mongoose.connection
        .collection('questions')
        .countDocuments({ jobId: new mongoose.Types.ObjectId(jobId) });
      expect(questionsAfterFailure).toBe(0);

      createManySpy.mockRestore();
    });
  });
});


