package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.api.JobApiService
import com.cpen321.usermanagement.data.remote.dto.*
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for job management operations
 * Handles data flow between UI and API
 */
@Singleton
class JobRepository @Inject constructor(
    private val jobApiService: JobApiService
) {
    
    // Job Application Management
    
    suspend fun createJobApplication(request: CreateJobApplicationRequest): Result<JobApplication> {
        return try {
            val response = jobApiService.createJobApplication(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplication)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to create job application"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getJobApplications(page: Int = 1, limit: Int = 20): Result<List<JobApplication>> {
        return try {
            val response = jobApiService.getJobApplications(page, limit)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplications)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch job applications"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getJobApplication(id: String): Result<JobApplication> {
        return try {
            val response = jobApiService.getJobApplication(id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplication)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch job application"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateJobApplication(id: String, request: UpdateJobApplicationRequest): Result<JobApplication> {
        return try {
            val response = jobApiService.updateJobApplication(id, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplication)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to update job application"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteJobApplication(id: String): Result<Unit> {
        return try {
            val response = jobApiService.deleteJobApplication(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to delete job application"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun searchJobApplications(query: String, page: Int = 1, limit: Int = 20): Result<List<JobApplication>> {
        return try {
            val response = jobApiService.searchJobApplications(query, page, limit)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplications)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to search job applications"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getJobApplicationsByCompany(company: String, page: Int = 1, limit: Int = 20): Result<List<JobApplication>> {
        return try {
            val response = jobApiService.getJobApplicationsByCompany(company, page, limit)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobApplications)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch job applications by company"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getJobStatistics(): Result<JobStatisticsData> {
        return try {
            val response = jobApiService.getJobStatistics()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch job statistics"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Job Scraping
    
    suspend fun scrapeJobDetails(url: String): Result<ScrapedJobDetails> {
        return try {
            val response = jobApiService.scrapeJobDetails(ScrapeJobRequest(url))
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.jobDetails)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to scrape job details"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Similar Jobs Search
    
    suspend fun searchSimilarJobs(
        jobId: String,
        request: SimilarJobsRequest
    ): Result<List<SimilarJob>> {
        return try {
            val response = jobApiService.searchSimilarJobs(jobId, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.similarJobs)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to search similar jobs"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}