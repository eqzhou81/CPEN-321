import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { UserController } from '../controllers/users.controller';
import type { DeleteProfileRequest, UpdateProfileRequest } from '../types/users.types';
import { deleteProfileSchema, updateProfileSchema } from '../types/users.types';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

router.get('/profile', userController.getProfile.bind(userController));

router.post(
  '/profile',
  validateBody<UpdateProfileRequest>(updateProfileSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.updateProfile(req, res, next).catch(next);
  }
);

router.delete(
  '/profile',
  validateBody<DeleteProfileRequest>(deleteProfileSchema),
  (req: Request, res: Response, next: NextFunction) => {
    userController.deleteProfile(req, res, next).catch(next);
  }
);

export default router;
