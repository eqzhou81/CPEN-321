import { NextFunction, Request, Response } from 'express';

import {
  GetQuestionRequest,
  GetQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  Question,
  CreateQuestionRequestValidated,
} from '../types/question.types';
import logger from '../utils/logger.util';
import { questionModel } from '../models/question.model';

export class QuestionController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.createQuestion = this.createQuestion.bind(this);
    this.getQuestion = this.getQuestion.bind(this);
    this.getAllUserQuestions = this.getAllUserQuestions.bind(this);
    this.getQuestionsByTags = this.getQuestionsByTags.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
  }

  // Helper method to transform IUser to GetProfileResponse
  private transformQuestionToResponse(question: Question): GetQuestionResponse {
    return {
      id: question._id.toString(),
      name: question.name,
      link: question.link,
      tags: question.tags,
    };
  }

  // Create Question
  async createQuestion(
    req: Request<unknown, unknown, CreateQuestionRequestValidated>,
    res: Response<GetQuestionResponse>,
    next: NextFunction
  ) {
    try {
      const questionData = req.body;
      const question = await questionModel.create(questionData);
      const response = this.transformQuestionToResponse(question);
      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create question:', error);
      next(error);
    }
  }

  // Get Question by ID
  async getQuestion(
    req: Request<{ id: string }>, 
    res: Response<GetQuestionResponse>,
    next: NextFunction
  ) {
    try {
      const questionId = req.params.id;
      const question = await questionModel.findById(questionId);

      if (!question) {
        return res.status(404).json(); // No body, just 404
      }

      const response = this.transformQuestionToResponse(question);
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get question:', error);
      next(error);
    }
  }
 
  // Get all questions
  async getAllUserQuestions(
    req: Request,
    res: Response<GetQuestionResponse[]>,
    next: NextFunction
  ) {
    try {
      // Expect authenticateToken middleware to attach user to req
      const user = req.user as { savedQuestions?: string[] } | undefined;
      const savedIds = user?.savedQuestions ?? [];

      // If user has no saved questions, return empty list
      if (!savedIds.length) {
        res.status(200).json([]);
        return;
      }

      const questions = await questionModel.findByIds(savedIds);

      const response = questions.map((q) => this.transformQuestionToResponse(q));
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get all questions:', error);
      next(error);
    }
  }

  // Get question by tags
  async getQuestionsByTags(
    req: Request<unknown, unknown, unknown, { tags: string[] }>,
    res: Response<GetQuestionResponse[]>,
    next: NextFunction
  ) {
    try {
      const { tags } = req.query;
      const questions = await questionModel.findByTags(tags);

      const response = questions.map(this.transformQuestionToResponse);
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to get questions by tags:', error);
      next(error);
    }
  }

  // Update Question by ID
  async updateQuestion(
    req: Request<{ id: string }, unknown, UpdateQuestionRequest>,
    res: Response<UpdateQuestionResponse>,
    next: NextFunction
  ) {
    try {
      const questionId = req.params.id;
      const updateData = req.body;

      const question = await questionModel.update(questionId, updateData);

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found',
          question: null as any // or undefined, but must match type
        });
      }

      const response = this.transformQuestionToResponse(question);
      res.status(200).json({
        success: true,
        message: 'Question updated',
        question: response
      });
    } catch (error) {
      logger.error('Failed to update question:', error);
      next(error);
    }
  }
}
