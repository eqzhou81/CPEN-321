import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import discussionsRoutes from './discussions.routes';
import jobsRoutes from './jobs.routes';
import questionsRoutes from './questions.routes';
import sessionsRoutes from './sessions.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/jobs', authenticateToken, jobsRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/discussions', authenticateToken, discussionsRoutes);

router.use('/questions', authenticateToken, questionsRoutes);

router.use('/sessions', authenticateToken, sessionsRoutes);

export default router;
