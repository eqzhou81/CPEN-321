import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const sessionsController = new SessionsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new mock interview session
router.post(
  '/create',
  sessionsController.createSession.bind(sessionsController)
);

// Get all sessions for the authenticated user
router.get(
  '/',
  sessionsController.getUserSessions.bind(sessionsController)
);

// Get specific session by ID
router.get(
  '/:sessionId',
  sessionsController.getSession.bind(sessionsController)
);

// Submit answer for current question in session
router.post(
  '/submit-answer',
  sessionsController.submitSessionAnswer.bind(sessionsController)
);

// Update session status (pause, resume, cancel, complete)
router.put(
  '/:sessionId/status',
  sessionsController.updateSessionStatus.bind(sessionsController)
);

// Navigate to specific question (Previous/Next)
router.put(
  '/:sessionId/navigate',
  sessionsController.navigateToQuestion.bind(sessionsController)
);

// Get session progress
router.get(
  '/:sessionId/progress',
  sessionsController.getSessionProgress.bind(sessionsController)
);

// Delete session
router.delete(
  '/:sessionId',
  sessionsController.deleteSession.bind(sessionsController)
);

export default router;
