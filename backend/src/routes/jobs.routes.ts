import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  createJobApplicationSchema,
  similarJobsSearchSchema,
  updateJobApplicationSchema
} from '../types/jobs.types';
import { catchAsync } from '../utils/catchAsync';

const router = Router();
const jobController = new JobController();

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  authenticateToken(req, res, next).catch(next);
});

/**
 * @route POST /api/jobs
 * @desc Create a new job application
 * @access Private
 */
router.post(
  '/',
  validateBody(createJobApplicationSchema),
  catchAsync(jobController.createJobApplication.bind(jobController))
);

/**
 * @route GET /api/jobs
 * @desc Get all job applications for the authenticated user
 * @access Private
 */
router.get('/', catchAsync(jobController.getJobApplications.bind(jobController)));

/**
 * @route GET /api/jobs/search
 * @desc Search job applications by text
 * @access Private
 */
router.get('/search', catchAsync(jobController.searchJobApplications.bind(jobController)));

/**
 * @route GET /api/jobs/by-company
 * @desc Get job applications by company
 * @access Private
 */
router.get('/by-company', catchAsync(jobController.getJobApplicationsByCompany.bind(jobController)));

/**
 * @route GET /api/jobs/statistics
 * @desc Get job statistics for the user
 * @access Private
 */
router.get('/statistics', catchAsync(jobController.getJobStatistics.bind(jobController)));

/**
 * @route GET /api/jobs/:id
 * @desc Get a specific job application by ID
 * @access Private
 */
router.get('/:id', catchAsync(jobController.getJobApplication.bind(jobController)));

/**
 * @route PUT /api/jobs/:id
 * @desc Update a job application
 * @access Private
 */
router.put(
  '/:id',
  validateBody(updateJobApplicationSchema),
  catchAsync(jobController.updateJobApplication.bind(jobController))
);

/**
 * @route DELETE /api/jobs/:id
 * @desc Delete a job application
 * @access Private
 */
router.delete('/:id', catchAsync(jobController.deleteJobApplication.bind(jobController)));

/**
 * @route POST /api/jobs/:id/similar
 * @desc Search for similar jobs based on a saved job application
 * @access Private
 */
router.post(
  '/:id/similar',
  validateBody(similarJobsSearchSchema),
  catchAsync(jobController.searchSimilarJobs.bind(jobController))
);

/**
 * @route POST /api/jobs/scrape
 * @desc Scrape job details from a URL
 * @access Private
 */
router.post('/scrape', catchAsync(jobController.scrapeJobDetails.bind(jobController)));

export default router;
