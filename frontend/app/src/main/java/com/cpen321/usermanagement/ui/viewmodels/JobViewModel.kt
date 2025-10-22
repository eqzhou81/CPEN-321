package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.repository.JobRepository
import com.cpen321.usermanagement.data.remote.dto.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for job management functionality
 * Handles UI state and business logic for job applications and similar jobs
 */
@HiltViewModel
class JobViewModel @Inject constructor(
    private val jobRepository: JobRepository
) : ViewModel() {

    // Job Applications State
    private val _jobApplications = MutableStateFlow<List<JobApplication>>(emptyList())
    val jobApplications: StateFlow<List<JobApplication>> = _jobApplications.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    // Selected Job State
    private val _selectedJob = MutableStateFlow<JobApplication?>(null)
    val selectedJob: StateFlow<JobApplication?> = _selectedJob.asStateFlow()
    
    // Similar Jobs State
    private val _similarJobs = MutableStateFlow<List<SimilarJob>>(emptyList())
    val similarJobs: StateFlow<List<SimilarJob>> = _similarJobs.asStateFlow()
    
    private val _isLoadingSimilarJobs = MutableStateFlow(false)
    val isLoadingSimilarJobs: StateFlow<Boolean> = _isLoadingSimilarJobs.asStateFlow()
    
    // Job Statistics State
    private val _jobStatistics = MutableStateFlow<JobStatisticsData?>(null)
    val jobStatistics: StateFlow<JobStatisticsData?> = _jobStatistics.asStateFlow()
    
    // Search State
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()
    
    private val _searchResults = MutableStateFlow<List<JobApplication>>(emptyList())
    val searchResults: StateFlow<List<JobApplication>> = _searchResults.asStateFlow()

    init {
        loadJobApplications()
        loadJobStatistics()
    }
    
    // Job Application Management

    fun loadJobApplications() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.getJobApplications().fold(
                onSuccess = { jobs ->
                    _jobApplications.value = jobs
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to load job applications"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun createJobApplication(request: CreateJobApplicationRequest) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.createJobApplication(request).fold(
                onSuccess = { job ->
                    _jobApplications.value = _jobApplications.value + job
                    // Refresh statistics after adding a job
                    loadJobStatistics()
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to create job application"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun createJobFromScrapedData(url: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.scrapeJobDetails(url).fold(
                onSuccess = { scrapedDetails ->
                    val request = CreateJobApplicationRequest(
                        title = scrapedDetails.title,
                        company = scrapedDetails.company,
                        description = scrapedDetails.description,
                        location = scrapedDetails.location,
                        url = scrapedDetails.url,
                        salary = scrapedDetails.salary,
                        jobType = scrapedDetails.jobType,
                        experienceLevel = scrapedDetails.experienceLevel
                    )
                    createJobApplication(request)
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to scrape job details"
                    _isLoading.value = false
                }
            )
        }
    }
    
    fun updateJobApplication(id: String, request: UpdateJobApplicationRequest) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.updateJobApplication(id, request).fold(
                onSuccess = { updatedJob ->
                    _jobApplications.value = _jobApplications.value.map { job ->
                        if (job.id == id) updatedJob else job
                    }
                    if (_selectedJob.value?.id == id) {
                        _selectedJob.value = updatedJob
                    }
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to update job application"
                }
            )
            
            _isLoading.value = false
        }
    }

    fun deleteJobApplication(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.deleteJobApplication(id).fold(
                onSuccess = {
                    _jobApplications.value = _jobApplications.value.filter { it.id != id }
                    if (_selectedJob.value?.id == id) {
                        _selectedJob.value = null
                    }
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to delete job application"
                }
            )
            
            _isLoading.value = false
        }
    }

    fun getJobApplication(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            jobRepository.getJobApplication(id).fold(
                onSuccess = { job ->
                    _selectedJob.value = job
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to fetch job application"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun clearSelectedJob() {
        _selectedJob.value = null
    }
    
    // Similar Jobs Search
    
    fun searchSimilarJobs(
        jobId: String,
        radius: Int = 25,
        includeRemote: Boolean = true,
        limit: Int = 20
    ) {
        viewModelScope.launch {
            _isLoadingSimilarJobs.value = true
            _error.value = null
            
            val request = SimilarJobsRequest(
                radius = radius,
                remote = includeRemote,
                limit = limit
            )
            
            jobRepository.searchSimilarJobs(jobId, request).fold(
                onSuccess = { jobs ->
                    _similarJobs.value = jobs
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to search similar jobs"
                }
            )
            
            _isLoadingSimilarJobs.value = false
        }
    }
    
    fun clearSimilarJobs() {
        _similarJobs.value = emptyList()
    }
    
    // Search Functionality

    fun searchJobApplications(query: String) {
        if (query.isBlank()) {
            _searchResults.value = emptyList()
            return
        }
        
        viewModelScope.launch {
            _searchQuery.value = query
            _isLoading.value = true
            _error.value = null
            
            jobRepository.searchJobApplications(query).fold(
                onSuccess = { jobs ->
                    _searchResults.value = jobs
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to search job applications"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun clearSearch() {
        _searchQuery.value = ""
        _searchResults.value = emptyList()
    }
    
    // Job Statistics
    
    private fun loadJobStatistics() {
        viewModelScope.launch {
            jobRepository.getJobStatistics().fold(
                onSuccess = { stats ->
                    _jobStatistics.value = stats
                },
                onFailure = { exception ->
                    // Don't show error for statistics, it's not critical
                }
            )
        }
    }
    
    // Utility Functions

    fun clearError() {
        _error.value = null
    }
    
    fun getJobTypeColor(jobType: JobType?): Int {
        return when (jobType) {
            JobType.FULL_TIME -> com.cpen321.usermanagement.R.color.job_type_full_time
            JobType.PART_TIME -> com.cpen321.usermanagement.R.color.job_type_part_time
            JobType.CONTRACT -> com.cpen321.usermanagement.R.color.job_type_contract
            JobType.INTERNSHIP -> com.cpen321.usermanagement.R.color.job_type_internship
            JobType.REMOTE -> com.cpen321.usermanagement.R.color.job_type_remote
            null -> com.cpen321.usermanagement.R.color.text_secondary
        }
    }
    
    fun getExperienceLevelColor(level: ExperienceLevel?): Int {
        return when (level) {
            ExperienceLevel.ENTRY -> com.cpen321.usermanagement.R.color.exp_entry
            ExperienceLevel.MID -> com.cpen321.usermanagement.R.color.exp_mid
            ExperienceLevel.SENIOR -> com.cpen321.usermanagement.R.color.exp_senior
            ExperienceLevel.LEAD -> com.cpen321.usermanagement.R.color.exp_lead
            ExperienceLevel.EXECUTIVE -> com.cpen321.usermanagement.R.color.exp_executive
            null -> com.cpen321.usermanagement.R.color.text_secondary
        }
    }
}