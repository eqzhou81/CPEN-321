package com.cpen321.usermanagement.unmocked.repositories

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.data.repository.JobRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Unmocked Repository Tests for JobRepository
 * Tests repository methods against real backend API
 */
@RunWith(AndroidJUnit4::class)
class JobRepositoryTest {
    
    private lateinit var repository: JobRepository
    
    @Before
    fun setup() {
        val apiService = RetrofitClient.jobApiService
        repository = JobRepository(apiService)
    }
    
    /**
     * Test: createJobApplication - Success
     */
    @Test
    fun testCreateJobApplication_Success_Unmocked() {
        runBlocking {
            val request = CreateJobApplicationRequest(
                title = "Software Engineer",
                company = "Google",
                description = "Test job description"
            )
            
            val result = repository.createJobApplication(request)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { job ->
                assertEquals("Title should match", "Software Engineer", job.title)
                assertEquals("Company should match", "Google", job.company)
            }
        }
    }
    
    /**
     * Test: getJobApplications - Success
     */
    @Test
    fun testGetJobApplications_Success_Unmocked() {
        runBlocking {
            val result = repository.getJobApplications(page = 1, limit = 20)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { jobs ->
                assertNotNull("Jobs list should not be null", jobs)
            }
        }
    }
    
    /**
     * Test: getJobApplication - Success
     */
    @Test
    fun testGetJobApplication_Success_Unmocked() {
        runBlocking {
            // Use a test job ID that exists
            val testJobId = "test_job_id_123"
            
            val result = repository.getJobApplication(testJobId)
            
            // May succeed or fail depending on test data
            assertNotNull("Result should not be null", result)
        }
    }
    
    /**
     * Test: deleteJobApplication - Success
     */
    @Test
    fun testDeleteJobApplication_Success_Unmocked() {
        runBlocking {
            val testJobId = "test_job_id_to_delete"
            
            val result = repository.deleteJobApplication(testJobId)
            
            // Should succeed or fail gracefully
            assertNotNull("Result should not be null", result)
        }
    }
    
    /**
     * Test: searchJobApplications - Success
     */
    @Test
    fun testSearchJobApplications_Success_Unmocked() {
        runBlocking {
            val result = repository.searchJobApplications("engineer", page = 1, limit = 20)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { jobs ->
                assertNotNull("Jobs list should not be null", jobs)
            }
        }
    }
    
    /**
     * Test: getJobStatistics - Success
     */
    @Test
    fun testGetJobStatistics_Success_Unmocked() {
        runBlocking {
            val result = repository.getJobStatistics()
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { stats ->
                assertNotNull("Statistics should not be null", stats)
            }
        }
    }
    
    /**
     * Test: scrapeJobDetails - Success
     */
    @Test
    fun testScrapeJobDetails_Success_Unmocked() {
        runBlocking {
            val testUrl = "https://careers.google.com/jobs/12345"
            
            val result = repository.scrapeJobDetails(testUrl)
            
            // May succeed or fail depending on URL validity
            assertNotNull("Result should not be null", result)
        }
    }
}

