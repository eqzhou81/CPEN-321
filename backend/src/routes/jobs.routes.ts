import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  createJobApplicationSchema,
  similarJobsSearchSchema,
  updateJobApplicationSchema
} from '../types/jobs.types';

const router = Router();
const jobController = new JobController();

// Apply authentication middleware to all routes
router.use((req, res, next) => {
  void authenticateToken(req, res, next);
});

/**
 * @route POST /api/jobs
 * @desc Create a new job application
 * @access Private
 */
router.post(
  '/',
  validateBody(createJobApplicationSchema),
  (req, res, next) => {
    void jobController.createJobApplication(req, res, next);
  }
);

/**
 * @route GET /api/jobs
 * @desc Get all job applications for the authenticated user
 * @access Private
 */
router.get('/', jobController.getJobApplications.bind(jobController));

/**
 * @route GET /api/jobs/search
 * @desc Search job applications by text
 * @access Private
 */
router.get('/search', jobController.searchJobApplications.bind(jobController));

/**
 * @route GET /api/jobs/by-company
 * @desc Get job applications by company
 * @access Private
 */
router.get('/by-company', jobController.getJobApplicationsByCompany.bind(jobController));

/**
 * @route GET /api/jobs/statistics
 * @desc Get job statistics for the user
 * @access Private
 */
router.get('/statistics', jobController.getJobStatistics.bind(jobController));

/**
 * @route GET /api/jobs/:id
 * @desc Get a specific job application by ID
 * @access Private
 */
router.get('/:id', jobController.getJobApplication.bind(jobController));

/**
 * @route PUT /api/jobs/:id
 * @desc Update a job application
 * @access Private
 */
router.put(
  '/:id',
  validateBody(updateJobApplicationSchema),
  jobController.updateJobApplication.bind(jobController)
);

/**
 * @route DELETE /api/jobs/:id
 * @desc Delete a job application
 * @access Private
 */
router.delete('/:id', jobController.deleteJobApplication.bind(jobController));

/**
 * @route POST /api/jobs/:id/similar
 * @desc Search for similar jobs based on a saved job application
 * @access Private
 */
router.post(
  '/:id/similar',
  validateBody(similarJobsSearchSchema),
  jobController.searchSimilarJobs.bind(jobController)
);

/**
 * @route POST /api/jobs/scrape
 * @desc Scrape job details from a URL
 * @access Private
 */
router.post('/scrape', jobController.scrapeJobDetails.bind(jobController));

export default router;
