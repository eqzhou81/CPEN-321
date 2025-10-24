package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.JobApiService
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.JobApplication
import com.cpen321.usermanagement.data.remote.dto.JobApplicationRequest
import com.cpen321.usermanagement.data.remote.dto.JobApplicationsResponse
import com.cpen321.usermanagement.data.remote.dto.JobScrapeRequest
import com.cpen321.usermanagement.data.remote.dto.JobScrapeResponse
import com.cpen321.usermanagement.data.remote.dto.JobSearchRequest
import com.cpen321.usermanagement.data.remote.dto.SimilarJobsResponse
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class JobRepositoryImpl @Inject constructor(
    private val jobApiService: JobApiService,
    private val tokenManager: TokenManager
) : JobRepository {
    
    companion object {
        private const val TAG = "JobRepositoryImpl"
    }

    override suspend fun getJobApplications(page: Int, limit: Int): Response<ApiResponse<JobApplicationsResponse>> {
        return try {
            Log.d(TAG, "Getting job applications - page: $page, limit: $limit")
            jobApiService.getJobApplications(page, limit)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting job applications", e)
            throw e
        }
    }

    override suspend fun createJobApplication(request: JobApplicationRequest): Response<ApiResponse<JobApplication>> {
        return try {
            Log.d(TAG, "Creating job application: ${request.title} at ${request.company}")
            jobApiService.createJobApplication(request)
        } catch (e: Exception) {
            Log.e(TAG, "Error creating job application", e)
            throw e
        }
    }

    override suspend fun getJobApplication(id: String): Response<ApiResponse<JobApplication>> {
        return try {
            Log.d(TAG, "Getting job application: $id")
            jobApiService.getJobApplication(id)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting job application", e)
            throw e
        }
    }

    override suspend fun updateJobApplication(id: String, request: JobApplicationRequest): Response<ApiResponse<JobApplication>> {
        return try {
            Log.d(TAG, "Updating job application: $id")
            jobApiService.updateJobApplication(id, request)
        } catch (e: Exception) {
            Log.e(TAG, "Error updating job application", e)
            throw e
        }
    }

    override suspend fun deleteJobApplication(id: String): Response<ApiResponse<Unit>> {
        return try {
            Log.d(TAG, "Deleting job application: $id")
            jobApiService.deleteJobApplication(id)
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting job application", e)
            throw e
        }
    }

    override suspend fun searchJobApplications(query: String, page: Int, limit: Int): Response<ApiResponse<JobApplicationsResponse>> {
        return try {
            Log.d(TAG, "Searching job applications: $query")
            jobApiService.searchJobApplications(query, page, limit)
        } catch (e: Exception) {
            Log.e(TAG, "Error searching job applications", e)
            throw e
        }
    }

    override suspend fun getJobApplicationsByCompany(company: String, page: Int, limit: Int): Response<ApiResponse<JobApplicationsResponse>> {
        return try {
            Log.d(TAG, "Getting job applications by company: $company")
            jobApiService.getJobApplicationsByCompany(company, page, limit)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting job applications by company", e)
            throw e
        }
    }

    override suspend fun scrapeJobDetails(request: JobScrapeRequest): Response<ApiResponse<JobScrapeResponse>> {
        return try {
            Log.d(TAG, "Scraping job details from: ${request.url}")
            jobApiService.scrapeJobDetails(request)
        } catch (e: Exception) {
            Log.e(TAG, "Error scraping job details", e)
            throw e
        }
    }

    override suspend fun findSimilarJobs(id: String, request: JobSearchRequest): Response<ApiResponse<SimilarJobsResponse>> {
        return try {
            Log.d(TAG, "Finding similar jobs for: $id")
            jobApiService.findSimilarJobs(id, request)
        } catch (e: Exception) {
            Log.e(TAG, "Error finding similar jobs", e)
            throw e
        }
    }

    override suspend fun getJobStatistics(): Response<ApiResponse<Map<String, Any>>> {
        return try {
            Log.d(TAG, "Getting job statistics")
            jobApiService.getJobStatistics()
        } catch (e: Exception) {
            Log.e(TAG, "Error getting job statistics", e)
            throw e
        }
    }
}
