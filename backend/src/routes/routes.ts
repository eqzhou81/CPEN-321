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

router.use('/jobs', (req, res, next) => { authenticateToken(req, res, next).catch(next); }, jobsRoutes);

router.use('/user', (req, res, next) => { authenticateToken(req, res, next).catch(next); }, usersRoutes);

router.use('/discussions', (req, res, next) => { authenticateToken(req, res, next).catch(next); }, discussionsRoutes);

router.use('/questions', (req, res, next) => { authenticateToken(req, res, next).catch(next); }, questionsRoutes);

router.use('/sessions', (req, res, next) => { authenticateToken(req, res, next).catch(next); }, sessionsRoutes);

export default router;
