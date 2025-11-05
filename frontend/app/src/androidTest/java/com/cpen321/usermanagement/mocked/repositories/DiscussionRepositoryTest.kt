package com.cpen321.usermanagement.mocked.repositories

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.usermanagement.data.remote.api.DiscussionApi
import com.cpen321.usermanagement.data.remote.api.DiscussionDetailResponse
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.repository.DiscussionRepository
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
 * Mocked Repository Tests for DiscussionRepository
 * Uses MockWebServer to simulate backend responses
 */
@RunWith(AndroidJUnit4::class)
class DiscussionRepositoryTest {
    
    private lateinit var mockWebServer: MockWebServer
    private lateinit var repository: DiscussionRepository
    private lateinit var api: DiscussionApi
    
    @Before
    fun setup() {
        try {
            mockWebServer = MockWebServer()
            mockWebServer.start(0) // Use any available port
            
            val retrofit = Retrofit.Builder()
                .baseUrl(mockWebServer.url("/"))
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            
            api = retrofit.create(DiscussionApi::class.java)
            repository = DiscussionRepository(api)
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
     * Test: getAllDiscussions - Success (200)
     */
    @Test
    fun testGetAllDiscussions_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": [
                {
                    "id": "disc1",
                    "topic": "Amazon SDE Interview",
                    "description": "Discussion about Amazon interviews",
                    "messageCount": 5,
                    "participantCount": 3
                }
            ]
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getAllDiscussions(
                search = null,
                sortBy = "recent",
                page = 1,
                limit = 20
            )
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { discussions ->
                assertTrue("Should have discussions", discussions.isNotEmpty())
            }
        }
    }
    
    /**
     * Test: createDiscussion - Success (201)
     */
    @Test
    fun testCreateDiscussion_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "discussionId": "disc123"
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.createDiscussion(
                topic = "Test Discussion",
                description = "Test description"
            )
            
            assertTrue("Should succeed", result.isSuccess)
        }
    }
    
    /**
     * Test: createDiscussion - Failure (400 - Empty Topic)
     */
    @Test
    fun testCreateDiscussion_EmptyTopic_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "success": false,
                    "message": "Topic cannot be empty."
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.createDiscussion(
                topic = "",
                description = "Test"
            )
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: createDiscussion - Failure (400 - Topic Too Long)
     */
    @Test
    fun testCreateDiscussion_TopicTooLong_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "success": false,
                    "message": "Topic cannot exceed 100 characters."
                }
                """.trimIndent())
        )
        
        runBlocking {
            val longTopic = "A".repeat(101)
            val result = repository.createDiscussion(
                topic = longTopic,
                description = "Test"
            )
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: getDiscussionById - Success (200)
     */
    @Test
    fun testGetDiscussionById_Success_Mocked() {
        val successResponse = """
        {
            "success": true,
            "data": {
                "id": "disc123",
                "topic": "Amazon SDE Interview",
                "description": "Discussion about interviews",
                "messages": [],
                "messageCount": 0
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.getDiscussionById("disc123")
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { discussion ->
                assertEquals("ID should match", "disc123", discussion.id)
            }
        }
    }
    
    /**
     * Test: getDiscussionById - Failure (404)
     */
    @Test
    fun testGetDiscussionById_NotFound_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(404)
                .setBody("""
                {
                    "success": false,
                    "message": "Discussion not found"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.getDiscussionById("nonexistent")
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: postMessage - Success (200)
     */
    @Test
    fun testPostMessage_Success_Mocked() {
        val successResponse = """
        {
            "message": {
                "id": "msg123",
                "content": "Test message",
                "userId": "user123",
                "userName": "Test User"
            }
        }
        """.trimIndent()
        
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setBody(successResponse)
        )
        
        runBlocking {
            val result = repository.postMessage("disc123", "Test message")
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { response ->
                assertNotNull("Message should not be null", response.message)
            }
        }
    }
    
    /**
     * Test: postMessage - Failure (400 - Empty Content)
     */
    @Test
    fun testPostMessage_EmptyContent_Mocked() {
        mockWebServer.enqueue(
            MockResponse()
                .setResponseCode(400)
                .setBody("""
                {
                    "success": false,
                    "message": "Message content is required"
                }
                """.trimIndent())
        )
        
        runBlocking {
            val result = repository.postMessage("disc123", "")
            
            assertTrue("Should fail", result.isFailure)
        }
    }
    
    /**
     * Test: Server Error (500)
     */
    @Test
    fun testGetAllDiscussions_ServerError_Mocked() {
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
            val result = repository.getAllDiscussions()
            
            assertTrue("Should fail", result.isFailure)
        }
    }
}

