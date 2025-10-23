import { Router } from 'express';

import { UserController } from '../controllers/users.controller';
import { UpdateProfileRequest, updateProfileSchema } from '../types/users.types';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

router.get('/profile', userController.getProfile.bind(userController));

router.post(
  '/profile',
  validateBody<UpdateProfileRequest>(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

router.delete('/profile', userController.deleteProfile.bind(userController));

export default router;
