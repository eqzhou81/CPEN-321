import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { jobApplicationModel } from '../models/jobApplication.model';
import { questionModel } from '../models/question.model';
import { sessionModel } from '../models/session.model';
import { openaiService } from '../services/openai.service';
import { generateQuestions as generateTechnicalQuestionTopics } from '../services/generateQuestions.service';
import {
  BehavioralAnswerResponse,
  GenerateQuestionsRequest,
  QuestionProgressResponse,
  QuestionResponse,
  QuestionStatus,
  QuestionType,
  SubmitBehavioralAnswerRequest,
} from '../types/questions.types';
import logger from '../utils/logger.util';

export class QuestionsController {
  async generateQuestions(
    req: Request<unknown, unknown, GenerateQuestionsRequest>,
    res: Response<QuestionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const { jobId, types, count = 10 } = req.body;

      if (!jobId) {
        return res.status(400).json({
          message: 'Job ID is required',
        });
      }
      if (types.length === 0) {
        return res.status(400).json({
          message: 'At least one question type is required',
        });
      }
      if (count < 1 || count > 25) {
        return res.status(400).json({
          message: 'Count must be between 1 and 25',
        });
      }

      const jobObjectId = new mongoose.Types.ObjectId(jobId);

      const jobApplication = await jobApplicationModel.findById(jobObjectId, new mongoose.Types.ObjectId(user._id));
      if (!jobApplication) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }

      // Check if there's an active session for this job
      const activeSession = await sessionModel.findActiveByJobId(jobObjectId, new mongoose.Types.ObjectId(user._id));
      if (activeSession) {
        return res.status(409).json({
          message: 'Cannot regenerate questions while there is an active mock interview session. Please complete or cancel the session first.',
        });
      }

      await questionModel.deleteByJobId(jobObjectId, new mongoose.Types.ObjectId(user._id));

      const generatedQuestions: { type: QuestionType; title: string; description: string; tags: string[] }[] = [];

      if (types.includes(QuestionType.BEHAVIORAL)) {
        try {
          const behavioralCount = Math.ceil(count / types.length);
          const behavioralQuestions = await openaiService.generateBehavioralQuestions(
            jobApplication,
            behavioralCount
          );

          const behavioralQuestionsData = behavioralQuestions.map((q) => ({
            type: QuestionType.BEHAVIORAL,
            title: q.question,
            description: q.context ?? q.question,
            tags: q.tips ?? [],
          }));

          generatedQuestions.push(...behavioralQuestionsData);
        } catch (error) {
          logger.error('Error generating behavioral questions:', error);
        }
      }

      if (types.includes(QuestionType.TECHNICAL)) {
        const technicalCount = Math.ceil(count / types.length);
        let technicalQuestions: { type: QuestionType; title: string; description?: string; difficulty?: 'easy' | 'medium' | 'hard'; externalUrl?: string; tags?: string[] }[] = [];
        const bodyJobDescription = typeof req.body.jobDescription === 'string'
          ? req.body.jobDescription.trim()
          : '';
        const jobDescription = bodyJobDescription || jobApplication.description || '';

        if (jobDescription) {
          try {
            const aiGeneratedTopics = await generateTechnicalQuestionTopics(jobDescription);
            const allowedDifficulties = ['easy', 'medium', 'hard'];

            const flattenedQuestions = aiGeneratedTopics.flatMap((topicResult) =>
              topicResult.questions.map((leetcodeQuestion) => {
                const difficulty = leetcodeQuestion.difficulty
                  ? leetcodeQuestion.difficulty.toLowerCase()
                  : undefined;
                const normalisedDifficulty = allowedDifficulties.includes(difficulty ?? '')
                  ? (difficulty as 'easy' | 'medium' | 'hard')
                  : 'medium';

                const topicTag = topicResult.topic ? topicResult.topic.toLowerCase() : undefined;
                const questionTags = Array.isArray(leetcodeQuestion.tags)
                  ? leetcodeQuestion.tags
                      .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
                      .map((tag) => tag.toLowerCase())
                  : [];

                const tags = Array.from(
                  new Set([topicTag, ...questionTags].filter((tag): tag is string => !!tag))
                );

                return {
                  type: QuestionType.TECHNICAL,
                  title: leetcodeQuestion.title || 'LeetCode Problem',
                  description: topicResult.topic
                    ? `LeetCode problem for ${topicResult.topic}`
                    : 'LeetCode problem',
                  difficulty: normalisedDifficulty,
                  tags,
                  externalUrl: leetcodeQuestion.url,
                };
              })
            );

            technicalQuestions = flattenedQuestions.slice(0, technicalCount);
          } catch (error) {
            logger.error('Error generating technical questions via AI service:', error);
          }
        } else {
          logger.warn('No job description available for AI technical question generation; using fallback questions');
        }

        if (technicalQuestions.length === 0) {
          technicalQuestions = this.generateFallbackTechnicalQuestions(jobApplication, technicalCount);
        }

        generatedQuestions.push(...technicalQuestions.map(q => ({
          ...q,
          description: q.description ?? '',
          tags: q.tags ?? []
        })));
      }

      const savedQuestions = await questionModel.createMany(
        new mongoose.Types.ObjectId(user._id),
        jobObjectId,
        generatedQuestions
      );

      // Separate questions by type
      const behavioralQuestions = savedQuestions.filter(q => q.type === QuestionType.BEHAVIORAL);
      const technicalQuestions = savedQuestions.filter(q => q.type === QuestionType.TECHNICAL);

      res.status(201).json({
        message: 'Questions generated successfully',
        data: {
          behavioralQuestions,
          technicalQuestions,
          totalQuestions: savedQuestions.length,
          jobApplication,
        },
      });
    } catch (error) {
      logger.error('Failed to generate questions:', error);
      return res.status(500).json({
        message: 'Failed to generate questions',
      });
    }
  }

  async getQuestions(
    req: Request<{ jobId: string }>,
    res: Response<QuestionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const jobId = new mongoose.Types.ObjectId(req.params.jobId);
      const type = req.query.type as QuestionType;

      const questions = await questionModel.findByJobAndType(jobId, new mongoose.Types.ObjectId(user._id), type);

      // Separate questions by type
      const behavioralQuestions = questions.filter(q => q.type === QuestionType.BEHAVIORAL);
      const technicalQuestions = questions.filter(q => q.type === QuestionType.TECHNICAL);

      // Get job application for the response
      const jobApplication = await jobApplicationModel.findById(jobId, new mongoose.Types.ObjectId(user._id));

      res.status(200).json({
        message: 'Questions fetched successfully',
        data: {
          behavioralQuestions,
          technicalQuestions,
          totalQuestions: questions.length,
          jobApplication: jobApplication ?? null
        },
      });
    } catch (error) {
      logger.error('Failed to fetch questions:', error);
      return res.status(500).json({
        message: 'Failed to fetch questions',
      });
    }
  }

  async submitBehavioralAnswer(
    req: Request<unknown, unknown, SubmitBehavioralAnswerRequest>,
    res: Response<BehavioralAnswerResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const { questionId, answer } = req.body;

      if (!questionId) {
        return res.status(400).json({
          message: 'Question ID is required',
        });
      }
      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({
          message: 'Answer is required',
        });
      }
      if (answer.length > 5000) {
        return res.status(400).json({
          message: 'Answer too long (max 5000 characters)',
        });
      }

      const questionObjectId = new mongoose.Types.ObjectId(questionId);
      
      const question = await questionModel.findById(questionObjectId, new mongoose.Types.ObjectId(user._id));
      if (!question) {
        return res.status(404).json({
          message: 'Question not found',
        });
      }

      if (question.type !== QuestionType.BEHAVIORAL) {
        return res.status(400).json({
          message: 'This endpoint is only for behavioral questions',
        });
      }

      const feedback = await openaiService.generateAnswerFeedback(
        question.title,
        answer,
        `Behavioral interview question`
      );

      await questionModel.updateStatus(questionObjectId, new mongoose.Types.ObjectId(user._id), QuestionStatus.COMPLETED);

      res.status(200).json({
        message: 'Answer submitted successfully',
        data: {
          feedback: feedback.feedback,
          score: feedback.score,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
        },
      });
    } catch (error) {
      logger.error('Failed to submit behavioral answer:', error);
      return res.status(500).json({
        message: 'Failed to submit behavioral answer',
      });
    }
  }

  async toggleQuestionCompleted(
    req: Request<{ questionId: string }>,
    res: Response<QuestionResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const questionId = new mongoose.Types.ObjectId(req.params.questionId);

      const currentQuestion = await questionModel.findById(questionId, new mongoose.Types.ObjectId(user._id));
      if (!currentQuestion) {
        return res.status(404).json({
          message: 'Question not found',
        });
      }

      const newStatus = currentQuestion.status === QuestionStatus.COMPLETED 
        ? QuestionStatus.PENDING 
        : QuestionStatus.COMPLETED;

      const updatedQuestion = await questionModel.updateStatus(
        questionId,
        new mongoose.Types.ObjectId(user._id),
        newStatus
      );

      if (!updatedQuestion) {
        return res.status(404).json({
          message: 'Question not found',
        });
      }

      res.status(200).json({
        message: `Question marked as ${newStatus}`,
        data: {
          question: updatedQuestion,
        },
      });
    } catch (error) {
      logger.error('Failed to toggle question status:', error);
      return res.status(500).json({
        message: 'Failed to toggle question status',
      });
    }
  }

  async getQuestionProgress(
    req: Request<{ jobId: string }>,
    res: Response<QuestionProgressResponse>
  ) {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }
      const user = req.user;
      const jobId = new mongoose.Types.ObjectId(req.params.jobId);

      const progress = await questionModel.getProgressByJob(jobId, new mongoose.Types.ObjectId(user._id));

      res.status(200).json({
        message: 'Question progress fetched successfully',
        data: {
          jobId: req.params.jobId,
          progress: {
            technical: {
              total: progress.technical.total,
              completed: progress.technical.completed,
            },
            behavioral: {
              total: progress.behavioral.total,
              completed: progress.behavioral.completed,
            },
            overall: {
              total: progress.overall.total,
              completed: progress.overall.completed,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch question progress:', error);
      return res.status(500).json({
        message: 'Failed to fetch question progress',
      });
    }
  }

  private generateFallbackTechnicalQuestions(jobApplication: { title?: string; company?: string; description?: string }, count: number): { type: QuestionType; title: string; difficulty: 'easy' | 'medium' | 'hard'; externalUrl: string }[] {
    const fallbackQuestions = [
      {
        type: QuestionType.TECHNICAL,
        title: 'Two Sum',
        difficulty: 'easy' as const,
        externalUrl: 'https://leetcode.com/problems/two-sum/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Valid Parentheses',
        difficulty: 'easy' as const,
        externalUrl: 'https://leetcode.com/problems/valid-parentheses/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Merge Two Sorted Lists',
        difficulty: 'easy' as const,
        externalUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Binary Tree Inorder Traversal',
        difficulty: 'medium' as const,
        externalUrl: 'https://leetcode.com/problems/binary-tree-inorder-traversal/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Maximum Subarray',
        difficulty: 'medium' as const,
        externalUrl: 'https://leetcode.com/problems/maximum-subarray/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'medium' as const,
        externalUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Add Two Numbers',
        difficulty: 'medium' as const,
        externalUrl: 'https://leetcode.com/problems/add-two-numbers/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Median of Two Sorted Arrays',
        difficulty: 'hard' as const,
        externalUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
      },
      {
        type: QuestionType.TECHNICAL,
        title: 'Longest Palindromic Substring',
        difficulty: 'medium' as const,
        externalUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
      },
    ];

    return fallbackQuestions.slice(0, Math.min(count, fallbackQuestions.length));
  }
}