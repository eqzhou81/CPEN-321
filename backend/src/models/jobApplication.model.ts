import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';

import {
  createJobApplicationSchema,
  IJobApplication,
  updateJobApplicationSchema,
} from '../types/jobs.types';
import logger from '../utils/logger.util';

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: 'Job description not available',
    },
    location: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function (url: string) {
          if (!url) return true; // Optional field
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    requirements: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    salary: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      required: false,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
jobApplicationSchema.index({ title: 'text', company: 'text', description: 'text' });
jobApplicationSchema.index({ company: 1 });
jobApplicationSchema.index({ location: 1 });

export class JobApplicationModel {
  private jobApplication: mongoose.Model<IJobApplication>;

  constructor() {
    this.jobApplication = mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
  }

  async create(
    userId: mongoose.Types.ObjectId,
    jobData: unknown
  ): Promise<IJobApplication> {
    try {
      const validatedData = createJobApplicationSchema.parse(jobData);
      const jobApplication = new this.jobApplication({
        userId,
        ...validatedData,
      });

      return await jobApplication.save();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error:', error.issues);
        throw new Error('Invalid job application data');
      }
      logger.error('Error creating job application:', error);
      throw new Error('Failed to create job application');
    }
  }

  async findById(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IJobApplication | null> {
    try {
      const jobApplication = await this.jobApplication.findOne({
        _id: jobId,
        userId,
      });

      return jobApplication;
    } catch (error) {
      logger.error('Error finding job application by ID:', error);
      throw new Error('Failed to find job application');
    }
  }

  async findByUserId(
    userId: mongoose.Types.ObjectId,
    limit = 50,
    skip = 0
  ): Promise<{ jobApplications: IJobApplication[]; total: number }> {
    try {
      const [jobApplications, total] = await Promise.all([
        this.jobApplication
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip),
        this.jobApplication.countDocuments({ userId }),
      ]);

      return { jobApplications, total };
    } catch (error) {
      logger.error('Error finding job applications by user ID:', error);
      throw new Error('Failed to find job applications');
    }
  }

  async update(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    updateData: unknown
  ): Promise<IJobApplication | null> {
    try {
      const validatedData = updateJobApplicationSchema.parse(updateData);

      const updatedJobApplication = await this.jobApplication.findOneAndUpdate(
        { _id: jobId, userId },
        validatedData,
        { new: true }
      );

      return updatedJobApplication;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation error:', error.issues);
        throw new Error('Invalid update data');
      }
      logger.error('Error updating job application:', error);
      throw new Error('Failed to update job application');
    }
  }

  async delete(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    try {
      const result = await this.jobApplication.deleteOne({
        _id: jobId,
        userId,
      });

      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error deleting job application:', error);
      throw new Error('Failed to delete job application');
    }
  }

  async searchByText(
    userId: mongoose.Types.ObjectId,
    searchTerm: string,
    limit = 20,
    skip: number = 0
  ): Promise<{ jobApplications: IJobApplication[]; total: number }> {
    try {
      const searchQuery = {
        userId,
        $text: { $search: searchTerm },
      };

      const [jobApplications, total] = await Promise.all([
        this.jobApplication
          .find(searchQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit)
          .skip(skip),
        this.jobApplication.countDocuments(searchQuery),
      ]);

      return { jobApplications, total };
    } catch (error) {
      logger.error('Error searching job applications:', error);
      throw new Error('Failed to search job applications');
    }
  }

  async findByCompany(
    userId: mongoose.Types.ObjectId,
    company: string,
    limit: number = 20,
    skip: number = 0
  ): Promise<{ jobApplications: IJobApplication[]; total: number }> {
    try {
      const [jobApplications, total] = await Promise.all([
        this.jobApplication
          .find({ userId, company: { $regex: company, $options: 'i' } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip),
        this.jobApplication.countDocuments({
          userId,
          company: { $regex: company, $options: 'i' },
        }),
      ]);

      return { jobApplications, total };
    } catch (error) {
      logger.error('Error finding job applications by company:', error);
      throw new Error('Failed to find job applications by company');
    }
  }

  async deleteAllByUserId(userId: mongoose.Types.ObjectId): Promise<number> {
    try {
      const result = await this.jobApplication.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error deleting all job applications by user ID:', error);
      throw new Error('Failed to delete job applications');
    }
  }
}

export const jobApplicationModel = new JobApplicationModel();
