package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.JobApplication
import com.cpen321.usermanagement.data.remote.dto.JobApplicationRequest
import com.cpen321.usermanagement.data.remote.dto.JobApplicationsResponse
import com.cpen321.usermanagement.data.remote.dto.JobScrapeRequest
import com.cpen321.usermanagement.data.remote.dto.JobScrapeResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface JobInterface {
    @GET("jobs")
    suspend fun getJobApplications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<JobApplicationsResponse>>

    @POST("jobs")
    suspend fun createJobApplication(@Body request: JobApplicationRequest): Response<ApiResponse<JobApplication>>

    @GET("jobs/{id}")
    suspend fun getJobApplication(@Path("id") id: String): Response<ApiResponse<JobApplication>>

    @PUT("jobs/{id}")
    suspend fun updateJobApplication(
        @Path("id") id: String,
        @Body request: JobApplicationRequest
    ): Response<ApiResponse<JobApplication>>

    @DELETE("jobs/{id}")
    suspend fun deleteJobApplication(@Path("id") id: String): Response<ApiResponse<Unit>>

    @GET("jobs/search")
    suspend fun searchJobApplications(
        @Query("q") query: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<JobApplicationsResponse>>

    @GET("jobs/by-company")
    suspend fun getJobApplicationsByCompany(
        @Query("company") company: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<JobApplicationsResponse>>

    @POST("jobs/scrape")
    suspend fun scrapeJobDetails(@Body request: JobScrapeRequest): Response<ApiResponse<JobScrapeResponse>>

    @GET("jobs/statistics")
    suspend fun getJobStatistics(): Response<ApiResponse<Map<String, Any>>>
}
