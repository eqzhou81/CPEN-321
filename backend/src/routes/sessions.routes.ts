import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const sessionsController = new SessionsController();

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  authenticateToken(req, res, next).catch(next);
});

// Create a new mock interview session
router.post(
  '/create',
  catchAsync(sessionsController.createSession.bind(sessionsController))
);

// Get all sessions for the authenticated user
router.get(
  '/',
  catchAsync(sessionsController.getUserSessions.bind(sessionsController))
);

// Get specific session by ID
router.get(
  '/:sessionId',
  catchAsync(sessionsController.getSession.bind(sessionsController))
);

// Submit answer for current question in session
router.post(
  '/submit-answer',
  catchAsync(sessionsController.submitSessionAnswer.bind(sessionsController))
);

// Update session status (pause, resume, cancel, complete)
router.put(
  '/:sessionId/status',
  catchAsync(sessionsController.updateSessionStatus.bind(sessionsController))
);

// Navigate to specific question (Previous/Next)
router.put(
  '/:sessionId/navigate',
  catchAsync(sessionsController.navigateToQuestion.bind(sessionsController))
);

// Get session progress
router.get(
  '/:sessionId/progress',
  catchAsync(sessionsController.getSessionProgress.bind(sessionsController))
);

// Delete session
router.delete(
  '/:sessionId',
  catchAsync(sessionsController.deleteSession.bind(sessionsController))
);

export default router;
