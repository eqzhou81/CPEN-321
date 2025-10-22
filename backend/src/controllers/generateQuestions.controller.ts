import { Request, Response } from 'express';
import { generateQuestions } from '../services/generateQuestions.service';
import logger from '../utils/logger.util';

export const generateQuestionsController = async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'jobDescription is required and must be a string' 
      });
    }

    logger.info('[generateQuestionsController] Generating questions for job description');

    const result = await generateQuestions(jobDescription);

    logger.info(`[generateQuestionsController] Generated ${result.length} topic(s) with questions`);

    return res.status(200).json({
      success: true,
      data: result,
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
