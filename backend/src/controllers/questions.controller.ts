import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { jobApplicationModel } from '../models/jobApplication.model';
import { questionModel } from '../models/question.model';
import { openaiService } from '../services/openai.service';
import {
  GenerateQuestionsRequest,
  SubmitBehavioralAnswerRequest,
  QuestionResponse,
  BehavioralAnswerResponse,
  QuestionProgressResponse,
  QuestionType,
  QuestionStatus,
} from '../types/questions.types';
import logger from '../utils/logger.util';

export class QuestionsController {
  async generateQuestions(
    req: Request<unknown, unknown, GenerateQuestionsRequest>,
    res: Response<QuestionResponse>
  ) {
    try {
      const user = req.user!;
      const { jobId, types, count = 10 } = req.body;

      if (!jobId) {
        return res.status(400).json({
          message: 'Job ID is required',
        });
      }
      if (!types || !Array.isArray(types) || types.length === 0) {
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

      const jobApplication = await jobApplicationModel.findById(jobObjectId, user._id);
      if (!jobApplication) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }

      await questionModel.deleteByJobId(jobObjectId, user._id);

      const generatedQuestions: any[] = [];

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
            description: q.context || q.question,
            tags: q.tips || [],
          }));

          generatedQuestions.push(...behavioralQuestionsData);
        } catch (error) {
          logger.error('Error generating behavioral questions:', error);
        }
      }

      if (types.includes(QuestionType.TECHNICAL)) {
        try {
          const technicalCount = Math.ceil(count / types.length);
          const technicalQuestions = this.generateFallbackTechnicalQuestions(
            jobApplication,
            technicalCount
          );

          generatedQuestions.push(...technicalQuestions);
        } catch (error) {
          logger.error('Error generating technical questions:', error);
        }
      }

      const savedQuestions = await questionModel.createMany(
        user._id,
        jobObjectId,
        generatedQuestions
      );

      res.status(201).json({
        message: 'Questions generated successfully',
        data: {
          questions: savedQuestions,
          total: savedQuestions.length,
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
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.jobId);
      const type = req.query.type as QuestionType;

      const questions = await questionModel.findByJobAndType(jobId, user._id, type);

      res.status(200).json({
        message: 'Questions fetched successfully',
        data: {
          questions,
          total: questions.length,
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
      const user = req.user!;
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
      
      const question = await questionModel.findById(questionObjectId, user._id);
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

      await questionModel.updateStatus(questionObjectId, user._id, QuestionStatus.COMPLETED);

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
      const user = req.user!;
      const questionId = new mongoose.Types.ObjectId(req.params.questionId);

      const currentQuestion = await questionModel.findById(questionId, user._id);
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
        user._id,
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
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.jobId);

      const progress = await questionModel.getProgressByJob(jobId, user._id);

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

  private generateFallbackTechnicalQuestions(jobApplication: any, count: number): any[] {
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