import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const sessionsController = new SessionsController();

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  void authenticateToken(req, res, next);
});

// Create a new mock interview session
router.post(
  '/create',
  (req: Request, res: Response, next: NextFunction) => {
    void sessionsController.createSession(req, res, next);
  }
);

// Get all sessions for the authenticated user
router.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    void sessionsController.getUserSessions(req, res, next);
  }
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
