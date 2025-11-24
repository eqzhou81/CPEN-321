import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { jobApplicationModel } from '../models/jobApplication.model';
import { jobSearchService } from '../services/jobSearch.service';
import {
  CreateJobApplicationRequest,
  JobApplicationResponse,
  JobApplicationsListResponse,
  JobSearchRequest,
  SimilarJobsResponse,
  UpdateJobApplicationRequest,
} from '../types/jobs.types';
import logger from '../utils/logger.util';

export class JobController {
  /**
   * Create a new job application
   */
  async createJobApplication(
    req: Request<unknown, unknown, CreateJobApplicationRequest>,
    res: Response<JobApplicationResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      
      const jobApplication = await jobApplicationModel.create(new mongoose.Types.ObjectId(user._id), req.body);
      
      res.status(201).json({
        message: 'Job application created successfully',
        data: { jobApplication },
      });
    } catch (error) {
      logger.error('Failed to create job application:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message || 'Failed to create job application',
        });
      }
      
      next(error);
    }
  }

  /**
   * Get all job applications for the authenticated user
   */
  async getJobApplications(
    req: Request,
    res: Response<JobApplicationsListResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      const { jobApplications, total } = await jobApplicationModel.findByUserId(
        new mongoose.Types.ObjectId(user._id),
        limit,
        skip
      );
      
      res.status(200).json({
        message: 'Job applications fetched successfully',
        data: {
          jobApplications,
          total,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch job applications:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to fetch job applications',
        });
      }
      
      next(error);
    }
  }

  /**
   * Get a specific job application by ID
   */
  async getJobApplication(
    req: Request<{ id: string }>,
    res: Response<JobApplicationResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.id);
      
      const jobApplication = await jobApplicationModel.findById(jobId, new mongoose.Types.ObjectId(user._id));
      
      if (!jobApplication) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }
      
      res.status(200).json({
        message: 'Job application fetched successfully',
        data: { jobApplication },
      });
    } catch (error) {
      logger.error('Failed to fetch job application:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to fetch job application',
        });
      }
      
      next(error);
    }
  }

  /**
   * Update a job application
   */
  async updateJobApplication(
    req: Request<{ id: string }, unknown, UpdateJobApplicationRequest>,
    res: Response<JobApplicationResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.id);
      
      const updatedJobApplication = await jobApplicationModel.update(
        jobId,
        new mongoose.Types.ObjectId(user._id),
        req.body
      );
      
      if (!updatedJobApplication) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }
      
      res.status(200).json({
        message: 'Job application updated successfully',
        data: { jobApplication: updatedJobApplication },
      });
    } catch (error) {
      logger.error('Failed to update job application:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message || 'Failed to update job application',
        });
      }
      
      next(error);
    }
  }

  /**
   * Delete a job application
   */
  async deleteJobApplication(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.id);
      
      const deleted = await jobApplicationModel.delete(jobId, new mongoose.Types.ObjectId(user._id));
      
      if (!deleted) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }
      
      res.status(200).json({
        message: 'Job application deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete job application:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to delete job application',
        });
      }
      
      next(error);
    }
  }

  /**
   * Search for similar jobs based on a saved job application
   */
  async searchSimilarJobs(
    req: Request<{ id: string }, unknown, JobSearchRequest>,
    res: Response<SimilarJobsResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const jobId = new mongoose.Types.ObjectId(req.params.id);
      
      // Get the original job application
      const jobApplication = await jobApplicationModel.findById(jobId, new mongoose.Types.ObjectId(user._id));
      
      if (!jobApplication) {
        return res.status(404).json({
          message: 'Job application not found',
        });
      }
      
      // Search for similar jobs using web scraping + database fallback
      const similarJobs = await jobSearchService.findSimilarJobs(
        req.params.id,
        user._id.toString(),
        req.body.limit ?? 5
      );
      
      res.status(200).json({
        message: 'Similar jobs found successfully',
        data: {
          similarJobs,
          total: similarJobs.length,
          searchParams: {
            ...req.body,
            title: jobApplication.title,
            company: jobApplication.company,
            location: jobApplication.location,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to search similar jobs:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to search similar jobs',
        });
      }
      
      next(error);
    }
  }

  /**
   * Search job applications by text
   */
  async searchJobApplications(
    req: Request,
    res: Response<JobApplicationsListResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const searchTerm = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      if (!searchTerm) {
        return res.status(400).json({
          message: 'Search term is required',
        });
      }
      
      const { jobApplications, total } = await jobApplicationModel.searchByText(
        new mongoose.Types.ObjectId(user._id),
        searchTerm,
        limit,
        skip
      );
      
      res.status(200).json({
        message: 'Job applications search completed',
        data: {
          jobApplications,
          total,
        },
      });
    } catch (error) {
      logger.error('Failed to search job applications:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to search job applications',
        });
      }
      
      next(error);
    }
  }

  /**
   * Get job applications by company
   */
  async getJobApplicationsByCompany(
    req: Request,
    res: Response<JobApplicationsListResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const company = req.query.company as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      if (!company) {
        return res.status(400).json({
          message: 'Company name is required',
        });
      }
      
      const { jobApplications, total } = await jobApplicationModel.findByCompany(
        new mongoose.Types.ObjectId(user._id),
        company,
        limit,
        skip
      );
      
      res.status(200).json({
        message: 'Job applications by company fetched successfully',
        data: {
          jobApplications,
          total,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch job applications by company:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to fetch job applications by company',
        });
      }
      
      next(error);
    }
  }

  /**
   * Scrape job details from a URL
   */
  async scrapeJobDetails(
    req: Request<unknown, unknown, { url: string }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({
          message: 'URL is required',
        });
      }
      
      const jobDetails = await jobSearchService.scrapeJobDetails(url);
      
      if (!jobDetails) {
        return res.status(404).json({
          message: 'Could not extract job details from the provided URL',
        });
      }
      
      res.status(200).json({
        message: 'Job details scraped successfully',
        data: { jobDetails },
      });
    } catch (error) {
      logger.error('Failed to scrape job details:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to scrape job details',
        });
      }
      
      next(error);
    }
  }

  /**
   * Get job statistics for the user
   */
  async getJobStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      
      // Get basic statistics
      const { total } = await jobApplicationModel.findByUserId(new mongoose.Types.ObjectId(user._id), 1, 0);
      
      // Get company distribution
      const { jobApplications } = await jobApplicationModel.findByUserId(new mongoose.Types.ObjectId(user._id), 1000, 0);
      
      const companyStats = jobApplications.reduce((acc, job) => {
        acc[job.company] = (acc[job.company] || 0) + 1;
        return acc;
      }, {});
      
      const topCompanies = Object.entries(companyStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([company, count]) => ({ company, count }));
      
      res.status(200).json({
        message: 'Job statistics fetched successfully',
        data: {
          totalApplications: total,
          topCompanies,
          totalCompanies: Object.keys(companyStats).length,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch job statistics:', error);
      
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message || 'Failed to fetch job statistics',
        });
      }
      
      next(error);
    }
  }
}
