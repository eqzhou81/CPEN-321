import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.util';
import { leetService } from '../services/leetcode.service';

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
      res.status(200).json(results);
    } catch (error) {
      logger.error('Failed to search external LeetCode API:', error);
      next(error);
    }
  }
}

export const leetCodeController = new LeetCodeController();
