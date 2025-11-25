import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const authController = new AuthController();

// Mock auth endpoint for local development
if (process.env.BYPASS_AUTH === 'true') {
  router.post('/mock-signin', (req, res) => {
    res.json({
      message: 'Mock sign in successful',
      data: {
        user: {
          _id: process.env.MOCK_USER_ID ?? '507f1f77bcf86cd799439011',
          email: process.env.MOCK_USER_EMAIL ?? 'test@example.com',
          name: process.env.MOCK_USER_NAME ?? 'Test User',
          googleId: 'mock-google-id',
          profilePicture: 'https://via.placeholder.com/150',
          bio: 'Test user for local development',
          hobbies: ['coding', 'testing']
        },
        token: 'mock-token-for-local-development'
      }
    });
  });
}

router.post(
  '/signup',
  catchAsync(authController.signUp.bind(authController))
);

router.post(
  '/signin',
  catchAsync(authController.signIn.bind(authController))
);

export default router;
