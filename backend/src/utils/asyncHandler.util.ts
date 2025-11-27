import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to properly handle promise rejections
 * @param fn Async function to wrap
 * @returns Express middleware that handles promise rejections
 */
export const asyncHandler = <T = unknown>(
  fn: (req: Request<T>, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler<T> => {
  return (req: Request<T>, res: Response, next: NextFunction): undefined => {
    Promise.resolve(fn(req, res, next)).catch(next);
    return undefined;
  };
};
