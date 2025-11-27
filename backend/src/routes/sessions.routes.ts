import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler.util';

const router = Router();
const sessionsController = new SessionsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new mock interview session
router.post(
  '/create',
  asyncHandler(sessionsController.createSession.bind(sessionsController))
);

// Get all sessions for the authenticated user
router.get(
  '/',
  asyncHandler(sessionsController.getUserSessions.bind(sessionsController))
);

// Get specific session by ID
router.get(
  '/:sessionId',
  asyncHandler(sessionsController.getSession.bind(sessionsController))
);

// Submit answer for current question in session
router.post(
  '/submit-answer',
  asyncHandler(sessionsController.submitSessionAnswer.bind(sessionsController))
);

// Update session status (pause, resume, cancel, complete)
router.put(
  '/:sessionId/status',
  asyncHandler(sessionsController.updateSessionStatus.bind(sessionsController))
);

// Navigate to specific question (Previous/Next)
router.put(
  '/:sessionId/navigate',
  asyncHandler(sessionsController.navigateToQuestion.bind(sessionsController))
);

// Get session progress
router.get(
  '/:sessionId/progress',
  asyncHandler(sessionsController.getSessionProgress.bind(sessionsController))
);

// Delete session
router.delete(
  '/:sessionId',
  asyncHandler(sessionsController.deleteSession.bind(sessionsController))
);

export default router;
