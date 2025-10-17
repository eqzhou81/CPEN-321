import mongoose, { Document } from 'mongoose';
import z from 'zod';

// Job Application model
// ------------------------------------------------------------
export interface IJobApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  company: string;
  description: string;
  location?: string;
  url?: string;
  requirements?: string[];
  skills?: string[];
  salary?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  createdAt: Date;
  updatedAt: Date;
}

// Similar Job model (for search results)
// ------------------------------------------------------------
export interface ISimilarJob {
  title: string;
  company: string;
  description: string;
  location: string;
  url: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  distance?: number; // Distance from original job location
  isRemote?: boolean;
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'ziprecruiter' | 'monster' | 'other';
  postedDate?: Date;
}

// Location interface
// ------------------------------------------------------------
export interface ILocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

// Job search parameters
// ------------------------------------------------------------
export interface IJobSearchParams {
  title: string;
  company?: string;
  location?: string;
  radius?: number; // in miles
  jobType?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  limit?: number;
}

// Zod schemas
// ------------------------------------------------------------
export const createJobApplicationSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  description: z.string().min(1, 'Job description is required'),
  location: z.string().optional(),
  url: z.string().url().optional(),
  requirements: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  salary: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
});

export const updateJobApplicationSchema = createJobApplicationSchema.partial();

export const jobSearchSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(1).max(100).optional(),
  jobType: z.array(z.string()).optional(),
  experienceLevel: z.array(z.string()).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  remote: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
});

// Request/Response types
// ------------------------------------------------------------
export type CreateJobApplicationRequest = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationRequest = z.infer<typeof updateJobApplicationSchema>;
export type JobSearchRequest = z.infer<typeof jobSearchSchema>;

export type JobApplicationResponse = {
  message: string;
  data?: {
    jobApplication: IJobApplication;
  };
};

export type JobApplicationsListResponse = {
  message: string;
  data?: {
    jobApplications: IJobApplication[];
    total: number;
  };
};

export type SimilarJobsResponse = {
  message: string;
  data?: {
    similarJobs: ISimilarJob[];
    total: number;
    searchParams: IJobSearchParams;
  };
};

// Web scraping interfaces
// ------------------------------------------------------------
export interface IScraperConfig {
  baseUrl: string;
  searchPath: string;
  selectors: {
    jobCard: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary?: string;
    postedDate?: string;
  };
  pagination?: {
    nextButton: string;
    maxPages: number;
  };
}

export interface IScraperResult {
  jobs: ISimilarJob[];
  hasMore: boolean;
  nextPageUrl?: string;
  error?: string;
}

// Job similarity scoring
// ------------------------------------------------------------
export interface IJobSimilarityScore {
  job: ISimilarJob;
  score: number;
  reasons: string[];
}

// Constants
// ------------------------------------------------------------
export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'] as const;
export const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'] as const;
export const JOB_SOURCES = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'monster', 'other'] as const;

// Default search parameters
export const DEFAULT_SEARCH_PARAMS: Partial<IJobSearchParams> = {
  radius: 25, // 25 miles default radius
  limit: 20, // 20 results default
  remote: true, // Include remote jobs by default
};
