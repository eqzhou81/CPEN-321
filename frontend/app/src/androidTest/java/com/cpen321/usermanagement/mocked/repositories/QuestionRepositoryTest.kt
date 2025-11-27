package com.cpen321.usermanagement.mocked.repositories

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.usermanagement.data.remote.api.QuestionApiService
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.data.repository.QuestionRepository
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
 * Mocked Repository Tests for QuestionRepository
 * Uses MockWebServer to simulate backend responses
 * 
 * Tests all repository methods with various response scenarios:
 * - Success (200/201)
 * - Client errors (400, 404)
 * - Server errors (500)
 * - Network errors (timeout)
 */
@RunWith(AndroidJUnit4::class)
class QuestionRepositoryTest {
    
    private lateinit var mockWebServer: MockWebServer
    private lateinit var repository: QuestionRepository
    private lateinit var apiService: QuestionApiService
    
    @Before
    fun setup() {
        try {
            mockWebServer = MockWebServer()
            // Use a specific port or let MockWebServer choose one
            mockWebServer.start(0) // 0 = use any available port
            
            // Create Retrofit instance pointing to MockWebServer
            val retrofit = Retrofit.Builder()
                .baseUrl(mockWebServer.url("/"))
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            
            apiService = retrofit.create(QuestionApiService::class.java)
            repository = QuestionRepository(apiService)
        } catch (e: Exception) {
            // If setup fails, ensure mockWebServer is still initialized as null-safe
            throw java.io.IOException("Failed to setup MockWebServer: ${e.message}", e)
        }
    }
    
    @After
    fun tearDown() {
        if (::mockWebServer.isInitialized) {
            mockWebServer.shutdown()
        }
    }
    
    /**
     * Test: generateQuestions - Success (201)
     */
    @Test
    fun testGenerateQuestions_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "behavioralQuestions": [
                    {
                        "id": "q1",
                        "title": "Tell me about yourself",
                        "type": "BEHAVIORAL",
                        "status": "pending"
                    }
                ],
                "technicalQuestions": [
                    {
                        "id": "q2",
                        "title": "Two Sum",
                        "type": "TECHNICAL",
                        "url": "https://leetcode.com/problems/two-sum",
                        "status": "pending"
                    }
                ],
                "totalQuestions": 2
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.generateQuestions(
                jobId = "test_job_123",
                questionTypes = listOf(QuestionType.BEHAVIORAL, QuestionType.TECHNICAL)
            )
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { questionsData ->
                assertEquals("Should have 2 total questions", 2, questionsData.totalQuestions)
                assertTrue("Should have behavioral questions", 
                    questionsData.behavioralQuestions.isNotEmpty())
                assertTrue("Should have technical questions",
                    questionsData.technicalQuestions.isNotEmpty())
            }
        }
    }
    
    /**
     * Test: generateQuestions - Failure (400 - Invalid Request)
     */
    @Test
    fun testGenerateQuestions_InvalidRequest_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "success": false,
                    "message": "Job ID is required"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.generateQuestions(
                jobId = "",
                questionTypes = listOf(QuestionType.BEHAVIORAL)
            )
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: generateQuestions - Failure (500 - Server Error)
     */
    @Test
    fun testGenerateQuestions_ServerError_Mocked() {
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
            val result = repository.generateQuestions(
                jobId = "test_job_123",
                questionTypes = listOf(QuestionType.BEHAVIORAL)
            )
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: getQuestions - Success (200)
     */
    @Test
    fun testGetQuestions_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "behavioralQuestions": [],
                "technicalQuestions": [],
                "totalQuestions": 0
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getQuestions(jobId = "test_job_123")
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: getQuestions - Failure (404 - Not Found)
     */
    @Test
    fun testGetQuestions_NotFound_Mocked() {
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
            val result = repository.getQuestions(jobId = "nonexistent_job")
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: getQuestionProgress - Success
     */
    @Test
    fun testGetQuestionProgress_Success_Mocked() {
        val successResponse = """
        {
            "message": "Success",
            "data": {
                "totalQuestions": 8,
                "completedQuestions": 3,
                "behavioralCompleted": 1,
                "technicalCompleted": 2,
                "completionPercentage": 37.5
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getQuestionProgress(jobId = "test_job_123")
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { progress ->
                assertNotNull("Progress should not be null", progress)
            }
        }
    }
    
    /**
     * Test: toggleQuestionCompleted - Success
     */
    @Test
    fun testToggleQuestionCompleted_Success_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody("{}")
        )
        
        runBlocking {
            val result = repository.toggleQuestionCompleted("test_question_123")
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: Network timeout
     */
    @Test
    fun testGenerateQuestions_Timeout_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBodyDelay(60, java.util.concurrent.TimeUnit.SECONDS)
                .setBody("{}")
        )
        
        runBlocking {
            val result = repository.generateQuestions(
                jobId = "test_job_123",
                questionTypes = listOf(QuestionType.BEHAVIORAL)
            )
            
            // Should fail due to timeout
            assertTrue("Should fail on timeout", result.isFailure)
        }
    }
}

