import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware';
import authRoutes from './auth.routes';
import jobRoutes from './jobs.routes';
import discussionRoutes from './discussions.routes';
import questionRoutes from './question.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);

// Optionally disable authentication for testing by setting DISABLE_AUTH=true in environment
const disableAuth = process.env.DISABLE_AUTH === 'true';

if (disableAuth) {
	// Mount routes without authentication (testing only)
	router.use('/user', usersRoutes);
	router.use('/jobs', jobRoutes);
	router.use('/discussions', discussionRoutes);
	router.use('/question', questionRoutes);
} else {
	// Normal operation: protect routes with authenticateToken
	router.use('/user', authenticateToken, usersRoutes);
	router.use('/jobs', authenticateToken, jobRoutes);
	router.use('/discussions', authenticateToken, discussionRoutes);
	router.use('/question', authenticateToken, questionRoutes);
}




export default router;
