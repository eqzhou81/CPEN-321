import mongoose, { Document, Schema } from 'mongoose';

// Available Job model for storing jobs that can be searched
// This is separate from user job applications
export interface IAvailableJob extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  company: string;
  description: string;
  jobLocation: string; // Renamed to avoid conflict with Document.location
  url: string;
  salary?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  skills?: string[];
  requirements?: string[];
  isRemote?: boolean;
  postedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const availableJobSchema = new Schema<IAvailableJob>(
  {
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
      required: true,
      trim: true,
    },
    jobLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (url: string) {
          try {
            // Using URL constructor for validation only
            const validUrl = new URL(url);
            return validUrl !== null;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
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
    skills: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
availableJobSchema.index({ title: 'text', company: 'text', description: 'text' });
availableJobSchema.index({ company: 1 });
availableJobSchema.index({ jobLocation: 1 });
availableJobSchema.index({ jobType: 1 });
availableJobSchema.index({ experienceLevel: 1 });
availableJobSchema.index({ isRemote: 1 });

export class AvailableJobModel {
  private availableJob: mongoose.Model<IAvailableJob>;

  constructor() {
    this.availableJob = mongoose.model<IAvailableJob>('AvailableJob', availableJobSchema);
  }

  async create(jobData: Partial<IAvailableJob>): Promise<IAvailableJob> {
    try {
      const job = new this.availableJob(jobData);
      return await job.save();
    } catch (error) {
      throw new Error(`Failed to create available job: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findById(jobId: mongoose.Types.ObjectId): Promise<IAvailableJob | null> {
    try {
      return await this.availableJob.findById(jobId);
    } catch (error) {
      throw new Error(`Failed to find job by ID: ${error}`);
    }
  }

  async findAll(): Promise<IAvailableJob[]> {
    try {
      return await this.availableJob.find().sort({ createdAt: -1, _id: -1 });
    } catch (error) {
      throw new Error(`Failed to find all jobs: ${error}`);
    }
  }

  async findByCompany(company: string): Promise<IAvailableJob[]> {
    try {
      return await this.availableJob.find({ company: { $regex: company, $options: 'i' } });
    } catch (error) {
      throw new Error(`Failed to find jobs by company: ${error}`);
    }
  }

  async findByLocation(location: string): Promise<IAvailableJob[]> {
    try {
      return await this.availableJob.find({ jobLocation: { $regex: location, $options: 'i' } });
    } catch (error) {
      throw new Error(`Failed to find jobs by location: ${error}`);
    }
  }

  async searchJobs(searchParams: {
    title?: string;
    company?: string;
    location?: string;
    jobType?: string[];
    experienceLevel?: string[];
    isRemote?: boolean;
    limit?: number;
  }): Promise<IAvailableJob[]> {
    try {
      const query: Record<string, unknown> = {};

      if (searchParams.title) {
        query.$or = [
          { title: { $regex: searchParams.title, $options: 'i' } },
          { description: { $regex: searchParams.title, $options: 'i' } }
        ];
      }

      if (searchParams.company) {
        query.company = { $regex: searchParams.company, $options: 'i' };
      }

      if (searchParams.location) {
        query.jobLocation = { $regex: searchParams.location, $options: 'i' };
      }

      if (searchParams.jobType && searchParams.jobType.length > 0) {
        query.jobType = { $in: searchParams.jobType };
      }

      if (searchParams.experienceLevel && searchParams.experienceLevel.length > 0) {
        query.experienceLevel = { $in: searchParams.experienceLevel };
      }

      if (searchParams.isRemote !== undefined) {
        query.isRemote = searchParams.isRemote;
      }

      const limit = searchParams.limit ?? 20;
      const results = await this.availableJob.find(query).limit(limit).sort({ createdAt: -1 });
      return results as IAvailableJob[];
    } catch (error) {
      throw new Error(`Failed to search jobs: ${error}`);
    }
  }

  async updateById(jobId: mongoose.Types.ObjectId, updateData: Partial<IAvailableJob>): Promise<IAvailableJob | null> {
    try {
      return await this.availableJob.findByIdAndUpdate(jobId, updateData, { new: true });
    } catch (error) {
      throw new Error(`Failed to update job: ${error}`);
    }
  }

  async deleteById(jobId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await this.availableJob.findByIdAndDelete(jobId);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete job: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.availableJob.countDocuments();
    } catch (error) {
      throw new Error(`Failed to count jobs: ${error}`);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.availableJob.deleteMany({});
    } catch (error) {
      throw new Error(`Failed to clear all jobs: ${error}`);
    }
  }
}

export const availableJobModel = new AvailableJobModel();
