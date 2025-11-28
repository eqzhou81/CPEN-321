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
import org.junit.Test
import java.io.IOException

/**
 * E2E Tests for Job Management Feature (Mocked)
 * 
 * Uses MockWebServer to simulate backend responses
 * 
 * ✅ MockWebServer injection implemented - backend NOT needed!
 * 
 * Setup Requirements:
 * 1. ✅ MockWebServer automatically replaces backend
 * 2. Auth bypass is automatically enabled via BaseComposeTest
 */
class JobManagementMockTest : BaseComposeTest() {
    
    private lateinit var mockWebServer: MockWebServer
    
    // Initialize MockWebServer BEFORE the compose rule is created
    init {
        try {
            mockWebServer = MockWebServer()
            mockWebServer.start(0) // Use any available port
            
            // Set MockWebServer URL in RetrofitClient BEFORE compose rule creates MainActivity
            val baseUrl = "${mockWebServer.url("/")}api/"
            RetrofitClient.setTestBaseUrl(baseUrl)
            
            // Set test auth token immediately
            RetrofitClient.setAuthToken(
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
            )
            
            android.util.Log.d("JobManagementMockTest", "MockWebServer initialized in init block at: $baseUrl")
        } catch (e: Exception) {
            android.util.Log.e("JobManagementMockTest", "Failed to initialize MockWebServer: ${e.message}", e)
            throw java.io.IOException("Failed to setup MockWebServer: ${e.message}", e)
        }
    }
    
    @Before
    override fun setup() {
        // MockWebServer is already started in init block
        // Enqueue responses for app initialization
        try {
            
            // Enqueue responses for app initialization
            val userProfileResponse = """
            {
                "data": {
                    "user": {
                        "id": "68f81f1397c6ff152b749c16",
                        "email": "test@example.com",
                        "name": "Test User",
                        "profilePicture": null,
                        "savedJobs": [],
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
            
            val jobsResponse = """
            {
                "success": true,
                "data": []
            }
            """.trimIndent()
            mockWebServer.enqueue(
                MockResponse()
                    .setResponseCode(200)
                    .setBody(jobsResponse)
                    .addHeader("Content-Type", "application/json")
            )
        } catch (e: Exception) {
            throw IOException("Failed to setup MockWebServer: ${e.message}", e)
        }
        
        // super.setup() includes:
        // - Auth bypass (AUTH_BYPASS_ENABLED=true)
        // - waitForAppToBeReady() - waits for navigation to complete
        // - UI Automator device setup
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
     * Success: Create job - mocked response
     */
    @Test
    fun testAddJob_Success_Mocked() {
        val successResponse = """
        {
            "id": "job123",
            "title": "Software Engineer",
            "company": "Google",
            "description": "Job description here"
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(successResponse)
        )
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Add", substring = true)
            .performClick()
        
        waitForText("Add Job", substring = true, timeoutMillis = 2000)
        
        // Verify success - job appears in list
        waitForText("Software Engineer", substring = true, timeoutMillis = 5000)
    }
    
    /**
     * Failure: Server error (500)
     */
    @Test
    fun testAddJob_ServerError_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(500)
                .setBody("""
                {
                    "message": "Internal server error"
                }
                """.trimIndent())
        )
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Add", substring = true)
            .performClick()
        
        waitForText("Add Job", substring = true, timeoutMillis = 2000)
        
        // Verify error message
        waitForText("error", substring = true, timeoutMillis = 5000)
    }
    
    /**
     * Failure: Validation error (400)
     */
    @Test
    fun testAddJob_ValidationError_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "message": "Title is required"
                }
                """.trimIndent())
        )
        
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Add", substring = true)
            .performClick()
        
        waitForText("Add Job", substring = true, timeoutMillis = 2000)
        
        // Verify validation error
        waitForText("required", substring = true, timeoutMillis = 5000)
    }
}

