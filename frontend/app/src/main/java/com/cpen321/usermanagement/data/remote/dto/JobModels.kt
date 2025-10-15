package com.cpen321.usermanagement.data.remote.dto

import com.google.gson.annotations.SerializedName

data class JobApplication(
    @SerializedName("_id")
    val id: String,
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null,
    val link: String? = null,
    val status: String? = null,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String
)

data class JobApplicationRequest(
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null,
    val link: String? = null,
    val status: String? = null
)

data class JobApplicationsResponse(
    val jobApplications: List<JobApplication>,
    val total: Int
)

data class JobScrapeRequest(
    val url: String
)

data class JobScrapeResponse(
    val jobDetails: JobDetails
)

data class JobDetails(
    val title: String,
    val company: String,
    val description: String,
    val location: String? = null
)
