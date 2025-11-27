import { Router } from 'express';

import { UserController } from '../controllers/users.controller';
import { DeleteProfileRequest, UpdateProfileRequest, deleteProfileSchema, updateProfileSchema } from '../types/users.types';
import { validateBody } from '../middleware/validation.middleware';
import { asyncHandler } from '../utils/asyncHandler.util';

const router = Router();
const userController = new UserController();

router.get('/profile', asyncHandler(userController.getProfile.bind(userController)));

router.post(
  '/profile',
  validateBody<UpdateProfileRequest>(updateProfileSchema),
  asyncHandler(userController.updateProfile.bind(userController))
);

router.delete(
  '/profile',
  validateBody<DeleteProfileRequest>(deleteProfileSchema),
  asyncHandler(userController.deleteProfile.bind(userController))
);

export default router;
