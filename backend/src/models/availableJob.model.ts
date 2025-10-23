import mongoose, { Document, Schema } from 'mongoose';

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
    },
    company: {
      type: String,
      required: true,
      trim: true,
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
            new URL(url);
            return true;
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
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better search performance
availableJobSchema.index({ company: 1 });
availableJobSchema.index({ jobLocation: 1 });
availableJobSchema.index({ jobType: 1 });
availableJobSchema.index({ experienceLevel: 1 });
availableJobSchema.index({ isRemote: 1 });
availableJobSchema.index({ title: 'text', description: 'text', company: 'text' });

export class AvailableJobModel {
  private availableJob: mongoose.Model<IAvailableJob>;

  constructor() {
    this.availableJob = mongoose.model<IAvailableJob>('AvailableJob', availableJobSchema);
  }

  async create(jobData: Partial<IAvailableJob>): Promise<IAvailableJob> {
    try {
      return await this.availableJob.create(jobData);
    } catch (error) {
      console.error('Error creating available job:', error);
      throw new Error('Failed to create available job');
    }
  }

  async findByCompany(company: string): Promise<IAvailableJob[]> {
    try {
      return await this.availableJob.find({ company: new RegExp(company, 'i') });
    } catch (error) {
      console.error('Error finding jobs by company:', error);
      throw new Error('Failed to find jobs by company');
    }
  }

  async findByLocation(location: string): Promise<IAvailableJob[]> {
    try {
      return await this.availableJob.find({ jobLocation: new RegExp(location, 'i') });
    } catch (error) {
      console.error('Error finding jobs by location:', error);
      throw new Error('Failed to find jobs by location');
    }
  }

  async searchJobs(params: {
    title?: string;
    company?: string;
    jobLocation?: string;
    jobType?: string[];
    experienceLevel?: string[];
    isRemote?: boolean;
    limit?: number;
  }): Promise<IAvailableJob[]> {
    try {
      const query: any = {};

      if (params.title) {
        query.$or = [
          { title: new RegExp(params.title, 'i') },
          { description: new RegExp(params.title, 'i') }
        ];
      }

      if (params.company) {
        query.company = new RegExp(params.company, 'i');
      }

      if (params.jobLocation) {
        query.jobLocation = new RegExp(params.jobLocation, 'i');
      }

      if (params.jobType && params.jobType.length > 0) {
        query.jobType = { $in: params.jobType };
      }

      if (params.experienceLevel && params.experienceLevel.length > 0) {
        query.experienceLevel = { $in: params.experienceLevel };
      }

      if (params.isRemote !== undefined) {
        query.isRemote = params.isRemote;
      }

      const limit = params.limit || 10;
      return await this.availableJob.find(query).limit(limit);
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.availableJob.deleteMany({});
    } catch (error) {
      console.error('Error clearing available jobs:', error);
      throw new Error('Failed to clear available jobs');
    }
  }

  async count(): Promise<number> {
    try {
      return await this.availableJob.countDocuments();
    } catch (error) {
      console.error('Error counting available jobs:', error);
      throw new Error('Failed to count available jobs');
    }
  }
}

export const availableJobModel = new AvailableJobModel();
