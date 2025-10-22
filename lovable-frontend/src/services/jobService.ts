import api from './api';

export interface JobApplication {
  _id: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  link?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationRequest {
  title: string;
  company: string;
  description: string;
  location?: string;
  link?: string;
  status?: string;
}

export interface UpdateJobApplicationRequest {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  link?: string;
  status?: string;
}

export interface JobApplicationsResponse {
  message: string;
  data: {
    jobApplications: JobApplication[];
    total: number;
  };
}

export interface JobApplicationResponse {
  message: string;
  data: {
    jobApplication: JobApplication;
  };
}

export interface ScrapeJobRequest {
  url: string;
}

export interface ScrapeJobResponse {
  message: string;
  data: {
    jobDetails: {
      title: string;
      company: string;
      description: string;
      location?: string;
    };
  };
}

export const jobService = {
  async createJobApplication(data: CreateJobApplicationRequest): Promise<JobApplicationResponse> {
    const response = await api.post<JobApplicationResponse>('/jobs', data);
    return response.data;
  },

  async getJobApplications(page = 1, limit = 20): Promise<JobApplicationsResponse> {
    const response = await api.get<JobApplicationsResponse>(`/jobs?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getJobApplication(id: string): Promise<JobApplicationResponse> {
    const response = await api.get<JobApplicationResponse>(`/jobs/${id}`);
    return response.data;
  },

  async updateJobApplication(id: string, data: UpdateJobApplicationRequest): Promise<JobApplicationResponse> {
    const response = await api.put<JobApplicationResponse>(`/jobs/${id}`, data);
    return response.data;
  },

  async deleteJobApplication(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  async searchJobApplications(query: string, page = 1, limit = 20): Promise<JobApplicationsResponse> {
    const response = await api.get<JobApplicationsResponse>(`/jobs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  async getJobApplicationsByCompany(company: string, page = 1, limit = 20): Promise<JobApplicationsResponse> {
    const response = await api.get<JobApplicationsResponse>(`/jobs/by-company?company=${encodeURIComponent(company)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  async scrapeJobDetails(url: string): Promise<ScrapeJobResponse> {
    const response = await api.post<ScrapeJobResponse>('/jobs/scrape', { url });
    return response.data;
  },

  async getJobStatistics(): Promise<{ message: string; data: any }> {
    const response = await api.get('/jobs/statistics');
    return response.data;
  }
};
