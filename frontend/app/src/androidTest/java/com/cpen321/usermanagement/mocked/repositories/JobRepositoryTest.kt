package com.cpen321.usermanagement.mocked.repositories

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.usermanagement.data.remote.api.JobApiService
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.data.repository.JobRepository
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Mocked Repository Tests for JobRepository
 * Uses MockWebServer to simulate backend responses
 */
@RunWith(AndroidJUnit4::class)
class JobRepositoryTest {
    
    private lateinit var mockWebServer: MockWebServer
    private lateinit var repository: JobRepository
    private lateinit var apiService: JobApiService
    
    @Before
    fun setup() {
        try {
            mockWebServer = MockWebServer()
            mockWebServer.start(0) // Use any available port
            
            val retrofit = Retrofit.Builder()
                .baseUrl(mockWebServer.url("/"))
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            
            apiService = retrofit.create(JobApiService::class.java)
            repository = JobRepository(apiService)
        } catch (e: Exception) {
            throw RuntimeException("Failed to setup MockWebServer: ${e.message}", e)
        }
    }
    
    @After
    fun tearDown() {
        if (::mockWebServer.isInitialized) {
            mockWebServer.shutdown()
        }
    }
    
    /**
     * Test: createJobApplication - Success (201)
     */
    @Test
    fun testCreateJobApplication_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "jobApplication": {
                    "id": "job123",
                    "title": "Software Engineer",
                    "company": "Google",
                    "description": "Test description"
                }
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(successResponse)
        )
        
        runBlocking {
            val request = CreateJobApplicationRequest(
                title = "Software Engineer",
                company = "Google",
                description = "Test description"
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
     * Test: createJobApplication - Failure (400 - Validation Error)
     */
    @Test
    fun testCreateJobApplication_ValidationError_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "success": false,
                    "message": "Title is required"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val request = CreateJobApplicationRequest(
                title = "",
                company = "Google",
                description = "Test"
            )
            
            val result = repository.createJobApplication(request)
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: getJobApplications - Success (200)
     */
    @Test
    fun testGetJobApplications_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "jobApplications": [
                    {
                        "id": "job1",
                        "title": "Software Engineer",
                        "company": "Google"
                    }
                ],
                "total": 1
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getJobApplications(page = 1, limit = 20)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { jobs ->
                assertTrue("Should have jobs", jobs.isNotEmpty())
            }
        }
    }
    
    /**
     * Test: getJobApplication - Success
     */
    @Test
    fun testGetJobApplication_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "jobApplication": {
                    "id": "job123",
                    "title": "Software Engineer",
                    "company": "Google"
                }
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getJobApplication("job123")
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { job ->
                assertEquals("ID should match", "job123", job.id)
            }
        }
    }
    
    /**
     * Test: getJobApplication - Failure (404)
     */
    @Test
    fun testGetJobApplication_NotFound_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""
                {
                    "success": false,
                    "message": "Job not found"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.getJobApplication("nonexistent")
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: deleteJobApplication - Success
     */
    @Test
    fun testDeleteJobApplication_Success_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("")
        )
        
        runBlocking {
            val result = repository.deleteJobApplication("job123")
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: searchJobApplications - Success
     */
    @Test
    fun testSearchJobApplications_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "jobApplications": [],
                "total": 0
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.searchJobApplications("engineer", page = 1, limit = 20)
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: scrapeJobDetails - Success
     */
    @Test
    fun testScrapeJobDetails_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "jobDetails": {
                    "title": "Software Engineer",
                    "company": "Google",
                    "description": "Scraped description"
                }
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.scrapeJobDetails("https://example.com/job")
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: Server Error (500)
     */
    @Test
    fun testGetJobApplications_ServerError_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("""
                {
                    "success": false,
                    "message": "Internal server error"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.getJobApplications()
            
            assertTrue("Should fail", result.isFailure)
        }
    }
}

