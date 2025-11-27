package com.cpen321.usermanagement.mocked

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * E2E Tests for Question Generation Feature (Mocked)
 * 
 * Uses MockWebServer to simulate backend responses and test error scenarios
 * 
 * ⚠️ IMPORTANT: Currently requires backend to be running because MockWebServer
 * URL is not yet injected into the app's Retrofit client. Once MockWebServer
 * injection is implemented, these tests will work without a backend.
 * 
 * Setup Requirements:
 * 1. ✅ MockWebServer injection implemented - backend NOT needed!
 * 2. Auth bypass is automatically enabled via BaseComposeTest
 * 
 * Test Cases:
 * - Success scenario with mocked successful response
 * - 5a: OpenAI API failure (500 error)
 * - 5c: LeetCode API failure (500 error)
 * - 6a: Question processing failure (500 error)
 * - Network timeout
 * - Invalid response format (400 error)
 */
class QuestionGenerationMockTest : BaseComposeTest() {
    
    private lateinit var mockWebServer: MockWebServer
    
    // Initialize MockWebServer BEFORE the compose rule is created
    // This ensures RetrofitClient is configured before any services are accessed
    init {
        try {
            mockWebServer = MockWebServer()
            mockWebServer.start(0) // Use any available port
            
            // Set MockWebServer URL in RetrofitClient BEFORE compose rule creates MainActivity
            // Note: API base URL includes "/api/" so we need to append it
            val baseUrl = "${mockWebServer.url("/")}api/"
            RetrofitClient.setTestBaseUrl(baseUrl)
            
            // Set test auth token immediately
            RetrofitClient.setAuthToken(
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
            )
            
            android.util.Log.d("QuestionGenerationMockTest", "MockWebServer initialized in init block at: $baseUrl")
        } catch (e: Exception) {
            android.util.Log.e("QuestionGenerationMockTest", "Failed to initialize MockWebServer in init: ${e.message}", e)
            throw java.io.IOException("Failed to setup MockWebServer: ${e.message}", e)
        }
    }
    
    @Before
    override fun setup() {
        // MockWebServer is already started in init block
        // Enqueue responses for app initialization (called during startup)
        // 1. GET /api/user/profile - called by AuthViewModel.checkAuthenticationStatus()
        try {
            val userProfileResponse = """
            {
                "data": {
                    "user": {
                        "id": "68f81f1397c6ff152b749c16",
                        "email": "test@example.com",
                        "name": "Test User",
                        "profilePicture": null,
                        "savedJobs": ["job1"],
                        "createdAt": "2024-01-01T00:00:00Z",
                        "updatedAt": "2024-01-01T00:00:00Z"
                    }
                }
            }
            """.trimIndent()
            mockWebServer.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(userProfileResponse)
                    .addHeader("Content-Type", "application/json")
            )
            
            // 2. GET /api/jobs - called to load jobs list on main screen
            val jobsResponse = """
            {
                "success": true,
                "data": [
                    {
                        "_id": "job1",
                        "title": "Software Engineer",
                        "company": "Test Company",
                        "location": "Test Location",
                        "description": "Test job description",
                        "url": "https://example.com/job",
                        "createdAt": "2024-01-01T00:00:00Z",
                        "updatedAt": "2024-01-01T00:00:00Z"
                    }
                ]
            }
            """.trimIndent()
            mockWebServer.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(jobsResponse)
                    .addHeader("Content-Type", "application/json")
            )
            
            android.util.Log.d("QuestionGenerationMockTest", "Enqueued initialization responses")
        } catch (e: Exception) {
            android.util.Log.e("QuestionGenerationMockTest", "Failed to enqueue responses: ${e.message}", e)
            throw java.io.IOException("Failed to enqueue MockWebServer responses: ${e.message}", e)
        }
        
        // super.setup() includes:
        // - Auth bypass (AUTH_BYPASS_ENABLED=true)
        // - waitForAppToBeReady() - waits for navigation to complete
        // - UI Automator device setup
        // Note: App will use MockWebServer URL because we set it above
        super.setup()
    }
    
    @After
    fun tearDown() {
        // Reset RetrofitClient to use production URL
        RetrofitClient.setTestBaseUrl(null)
        
        // Shutdown MockWebServer
        if (::mockWebServer.isInitialized) {
            mockWebServer.shutdown()
        }
    }
    
    /**
     * Success scenario with mocked successful response
     */
    @Test
    fun testGenerateQuestions_Success_Mocked() {
        // Enqueue successful response
        val successResponse = """
        {
            "success": true,
            "data": {
                "behavioralQuestions": [
                    {
                        "id": "q1",
                        "title": "Tell me about yourself",
                        "type": "BEHAVIORAL"
                    }
                ],
                "technicalQuestions": [
                    {
                        "id": "q2",
                        "title": "Two Sum",
                        "type": "TECHNICAL",
                        "url": "https://leetcode.com/problems/two-sum"
                    }
                ],
                "totalQuestions": 2
            }
        }
        """.trimIndent()
        
        // Enqueue response for POST /api/questions/generate
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(successResponse)
                .addHeader("Content-Type", "application/json")
        )
        
        // Navigate and generate questions
        // Note: waitForAppToBeReady() in setup() already waited for main screen
        // But we'll wait again to ensure we're on the right screen
        waitForText("My Job Applications", timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        
        // Wait for job to be available before clicking
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            try {
                getNodeWithText("Software Engineer", substring = true)
                    .assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        getNodeWithText("Software Engineer", substring = true)
            .assertIsDisplayed()
            .performClick()
        
        waitForText("Job Details", timeoutMillis = 3000)
        composeTestRule.waitForIdle()
        
        getNodeWithText("Generate Questions", substring = true)
            .assertIsDisplayed()
            .performClick()
        
        // Wait for success
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                getNodeWithText("Behavioral Questions", substring = true)
                    .assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        getNodeWithText("Behavioral Questions", substring = true)
            .assertIsDisplayed()
        getNodeWithText("Technical Questions", substring = true)
            .assertIsDisplayed()
    }
    
    /**
     * Failure Scenario 5a: OpenAI API failure (500 error)
     */
    @Test
    fun testGenerateQuestions_OpenAIFailure_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("""
                {
                    "success": false,
                    "message": "Unable to generate behavioral questions at this time. Please try again later."
                }
                """.trimIndent())
        )
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Software Engineer", substring = true)
            .performClick()
        
        waitForText("Job Details", timeoutMillis = 3000)
        getNodeWithText("Generate Questions", substring = true)
            .performClick()
        
        // Verify error message
        waitForText("Unable to generate behavioral questions", substring = true, timeoutMillis = 5000)
        assertErrorDisplayed("Please try again later")
    }
    
    /**
     * Failure Scenario: Network timeout
     */
    @Test
    fun testGenerateQuestions_Timeout_Mocked() {
        // Enqueue response with delay that exceeds timeout
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBodyDelay(60, java.util.concurrent.TimeUnit.SECONDS) // Exceeds timeout
                .setBody("{}")
        )
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Software Engineer", substring = true)
            .performClick()
        
        waitForText("Job Details", timeoutMillis = 3000)
        getNodeWithText("Generate Questions", substring = true)
            .performClick()
        
        // Verify timeout error (implementation dependent)
        waitForText("timeout", substring = true, timeoutMillis = 35000)
    }
    
    /**
     * Failure Scenario: Invalid request (400 error)
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
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Software Engineer", substring = true)
            .performClick()
        
        waitForText("Job Details", timeoutMillis = 3000)
        getNodeWithText("Generate Questions", substring = true)
            .performClick()
        
        // Verify error message
        waitForText("Job ID is required", substring = true, timeoutMillis = 5000)
    }
}

