import { Request, Response, NextFunction } from 'express';

export const catchAsync =
  <Req = Request, Res = Response, Ret = any>(
    fn: (req: Req, res: Res, next: NextFunction) => Promise<Ret>
  ) =>
  (req: Req, res: Res, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };