import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import mediaRoutes from './media.routes';
import usersRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/jobs', authenticateToken, jobRoutes);

router.use('/user', authenticateToken, usersRoutes);

router.use('/media', authenticateToken, mediaRoutes);

export default router;
