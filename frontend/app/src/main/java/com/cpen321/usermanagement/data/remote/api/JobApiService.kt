package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Job Management API Service
 * Handles all job application and similar jobs functionality
 */
interface JobApiService {
    
    // Job Application Management
    
    @POST("jobs")
    suspend fun createJobApplication(
        @Body request: CreateJobApplicationRequest
    ): Response<JobApplicationResponse>
    
    @GET("jobs")
    suspend fun getJobApplications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<JobApplicationsListResponse>
    
    @GET("jobs/{id}")
    suspend fun getJobApplication(
        @Path("id") id: String
    ): Response<JobApplicationResponse>
    
    @PUT("jobs/{id}")
    suspend fun updateJobApplication(
        @Path("id") id: String,
        @Body request: UpdateJobApplicationRequest
    ): Response<JobApplicationResponse>
    
    @DELETE("jobs/{id}")
    suspend fun deleteJobApplication(
        @Path("id") id: String
    ): Response<Unit>
    
    @GET("jobs/search")
    suspend fun searchJobApplications(
        @Query("q") query: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<JobApplicationsListResponse>
    
    @GET("jobs/by-company")
    suspend fun getJobApplicationsByCompany(
        @Query("company") company: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<JobApplicationsListResponse>
    
    @GET("jobs/statistics")
    suspend fun getJobStatistics(): Response<JobStatisticsResponse>
    
    // Job Scraping
    
    @POST("jobs/scrape")
    suspend fun scrapeJobDetails(
        @Body request: ScrapeJobRequest
    ): Response<ScrapeJobResponse>
    
    // Similar Jobs Search
    
    @POST("jobs/{id}/similar")
    suspend fun searchSimilarJobs(
        @Path("id") id: String,
        @Body request: SimilarJobsRequest
    ): Response<SimilarJobsResponse>
}
