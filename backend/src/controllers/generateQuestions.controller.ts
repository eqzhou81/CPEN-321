import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { questionModel } from '../models/question.model';
import { generateQuestions } from '../services/generateQuestions.service';
import { QuestionType } from '../types/questions.types';
import logger from '../utils/logger.util';

export const generateQuestionsController = async (req: Request, res: Response) => {
  try {
    const { jobDescription, jobId } = req.body;
    const user = req.user!;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'jobDescription is required and must be a string' 
      });
    }

    if (!jobId) {
      return res.status(400).json({ 
        success: false,
        message: 'jobId is required' 
      });
    }

    logger.info('[generateQuestionsController] Generating questions for job description');

    const result = await generateQuestions(jobDescription);

    logger.info(`[generateQuestionsController] Generated ${result.length} topic(s) with questions`);

    // Store questions in the main question database
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const userObjectId = new mongoose.Types.ObjectId(user._id);
    
    // Clear existing technical questions for this job
    await questionModel.deleteByJobId(jobObjectId, userObjectId);

    // Create new questions from the generated results
    const createdQuestions = [];
    for (const topicResult of result) {
      for (const leetcodeQuestion of topicResult.questions) {
        try {
          const question = await questionModel.create(userObjectId, {
            jobId: jobId,
            type: QuestionType.TECHNICAL,
            title: leetcodeQuestion.title,
            description: `LeetCode problem for ${topicResult.topic}`,
            difficulty: (leetcodeQuestion.difficulty && ['easy', 'medium', 'hard'].includes(leetcodeQuestion.difficulty) ? leetcodeQuestion.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
            tags: leetcodeQuestion.tags || [topicResult.topic],
            externalUrl: leetcodeQuestion.url
          });
          createdQuestions.push(question);
        } catch (error) {
          logger.error('Error creating question:', error);
        }
      }
    }

    logger.info(`[generateQuestionsController] Stored ${createdQuestions.length} questions in database`);

    return res.status(200).json({
      success: true,
      data: result,
      storedQuestions: createdQuestions.length
    });
  } catch (error) {
    logger.error('[generateQuestionsController] Error generating questions:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to generate questions', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
