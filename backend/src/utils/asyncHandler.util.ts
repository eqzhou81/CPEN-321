import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to properly handle promise rejections
 * @param fn Async function to wrap
 * @returns Express middleware that handles promise rejections
 */
export const asyncHandler = <T = any>(
  fn: (req: Request<T>, res: Response, next: NextFunction) => Promise<any> | void
): RequestHandler<T> => {
  return (req: Request<T>, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
