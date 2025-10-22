package com.cpen321.usermanagement.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Job Application Data Transfer Objects
 * Matches the backend API structure
 */

data class JobApplication(
    @SerializedName("_id")
    val id: String,
    @SerializedName("userId")
    val userId: String,
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null,
    val url: String? = null,
    val requirements: List<String>? = null,
    val skills: List<String>? = null,
    val salary: String? = null,
    val jobType: JobType? = null,
    val experienceLevel: ExperienceLevel? = null,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String
)

data class CreateJobApplicationRequest(
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null,
    val url: String? = null,
    val requirements: List<String>? = null,
    val skills: List<String>? = null,
    val salary: String? = null,
    val jobType: JobType? = null,
    val experienceLevel: ExperienceLevel? = null
)

data class UpdateJobApplicationRequest(
    val title: String? = null,
    val company: String? = null,
    val description: String? = null,
    val location: String? = null,
    val url: String? = null,
    val requirements: List<String>? = null,
    val skills: List<String>? = null,
    val salary: String? = null,
    val jobType: JobType? = null,
    val experienceLevel: ExperienceLevel? = null
)

data class JobApplicationResponse(
    val message: String,
    val data: JobApplicationData? = null
)

data class JobApplicationData(
    val jobApplication: JobApplication
)

data class JobApplicationsListResponse(
    val message: String,
    val data: JobApplicationsListData? = null
)

data class JobApplicationsListData(
    val jobApplications: List<JobApplication>,
    val total: Int
)

data class ScrapeJobRequest(
    val url: String
)

data class ScrapeJobResponse(
    val message: String,
    val data: ScrapeJobData? = null
)

data class ScrapeJobData(
    val jobDetails: ScrapedJobDetails
)

data class ScrapedJobDetails(
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null,
    val url: String? = null,
    val salary: String? = null,
    val jobType: JobType? = null,
    val experienceLevel: ExperienceLevel? = null
)

data class SimilarJobsRequest(
    val radius: Int? = null,
    val jobType: List<String>? = null,
    val experienceLevel: List<String>? = null,
    val salaryMin: Int? = null,
    val salaryMax: Int? = null,
    val remote: Boolean? = null,
    val limit: Int? = null
)

data class SimilarJobsResponse(
    val message: String,
    val data: SimilarJobsData? = null
)

data class SimilarJobsData(
    val similarJobs: List<SimilarJob>,
    val total: Int,
    val searchParams: SearchParams
)

data class SimilarJob(
    val title: String,
    val company: String,
    val description: String,
    val location: String,
    val url: String,
    val salary: String? = null,
    val jobType: String? = null,
    val experienceLevel: String? = null,
    val distance: Double? = null,
    val isRemote: Boolean? = null,
    val source: String,
    @SerializedName("postedDate")
    val postedDate: String? = null
)

data class SearchParams(
    val radius: Int? = null,
    val jobType: List<String>? = null,
    val experienceLevel: List<String>? = null,
    val salaryMin: Int? = null,
    val salaryMax: Int? = null,
    val remote: Boolean? = null,
    val limit: Int? = null,
    val title: String,
    val company: String,
    val location: String? = null
)

data class JobStatisticsResponse(
    val message: String,
    val data: JobStatisticsData? = null
)

data class JobStatisticsData(
    val totalApplications: Int,
    val topCompanies: List<CompanyCount>,
    val totalCompanies: Int
)

data class CompanyCount(
    val company: String,
    val count: Int
)

enum class JobType(val value: String) {
    FULL_TIME("full-time"),
    PART_TIME("part-time"),
    CONTRACT("contract"),
    INTERNSHIP("internship"),
    REMOTE("remote")
}

enum class ExperienceLevel(val value: String) {
    ENTRY("entry"),
    MID("mid"),
    SENIOR("senior"),
    LEAD("lead"),
    EXECUTIVE("executive")
}