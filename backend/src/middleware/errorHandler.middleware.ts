import { Request, Response } from 'express';

import logger from '../utils/logger.util';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

export const errorHandler = (error: Error, req: Request, res: Response) => {
  logger.error('Error:', error);

  // TEMP: Expose error details for debugging in test/dev only
  return res.status(500).json({
    message: 'Internal server error',
    error: error.message,
    stack: error.stack,
  });
};
