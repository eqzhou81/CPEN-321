import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.util';
import { leetService } from '../services/leetcode.service';
import { questionModel } from '../models/question.model';

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

      // If we got any external results, persist the first one to our DB if it doesn't exist
      if (Array.isArray(results) && results.length > 0) {
        try {
          const first = results[0];
          const createInput = leetService.toCreateInput(first);

          // avoid duplicates by url (preferred) or name as fallback
          let existing = null;
          if (createInput.url) {
            existing = await questionModel.findByUrl(createInput.url);
          }
          if (!existing) {
            existing = await questionModel.findByName(createInput.name);
          }
          if (!existing) {
            await questionModel.create(createInput);
            logger.info('Persisted first external question to DB:', createInput.name);
          } else {
            logger.info('External question already exists in DB:', createInput.name);
          }
        } catch (storeErr) {
          // Don't fail the entire request if DB store fails; log and continue
          logger.error('Failed to persist external question:', storeErr);
        }
      }

      res.status(200).json(results);
    } catch (error) {
      logger.error('Failed to search external LeetCode API:', error);
      next(error);
    }
  }
}

export const leetCodeController = new LeetCodeController();
