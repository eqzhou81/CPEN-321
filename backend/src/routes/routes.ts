import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import jobRoutes from './jobs.routes';
import discussionRoutes from './discussions.routes';
import questionRoutes from './questions.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/jobs', authenticateToken,  jobRoutes);

router.use('/discussions',authenticateToken, discussionRoutes);

router.use('/questions', authenticateToken, questionRoutes);




export default router;
