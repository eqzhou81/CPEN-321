import { NextFunction, Request, Response } from 'express';
import { leetService } from '../services/leetcode.service';
import logger from '../utils/logger.util';

export class LeetCodeController {
  async searchExternal(
    req: Request<unknown, unknown, unknown, { query?: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: 'query is required' });
      }

      const results = await leetService.search(query as string);

      // Return the results without persisting to DB for now
      // The jack-dev generate questions will handle persistence differently
      res.status(200).json(results);
    } catch (error) {
      logger.error('Failed to search external LeetCode API:', error);
      next(error);
    }
  }
}

export const leetCodeController = new LeetCodeController();
