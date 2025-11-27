package com.cpen321.usermanagement.mocked

import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * End-to-end UI tests for Discussions (Mocked with MockWebServer + Dispatcher)
 *
 * What this fixes:
 * - Uses a Dispatcher so ALL network calls get a response (no flakiness).
 * - Actually types into fields & clicks buttons before asserting.
 * - Handles local validation vs server error flows correctly.
 * - Avoids /api duplication by setting the right baseUrl for Retrofit.
 */
class DiscussionsMockTest : BaseComposeTest() {

    private lateinit var mockWebServer: MockWebServer

    // ===== Utilities =====
    private fun json(code: Int, body: String) =
        MockResponse()
            .setResponseCode(code)
            .addHeader("Content-Type", "application/json")
            .setBody(body)

    private fun ok(body: String) = json(200, body)
    private fun created(body: String) = json(201, body)

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
            
            android.util.Log.d("DiscussionsMockTest", "MockWebServer initialized in init block at: $baseUrl")
        } catch (e: Exception) {
            android.util.Log.e("DiscussionsMockTest", "Failed to initialize MockWebServer: ${e.message}", e)
            throw java.io.IOException("Failed to setup MockWebServer: ${e.message}", e)
        }
    }

    @Before
    override fun setup() {
        // MockWebServer is already started and configured in init block
        // Set up dispatcher to handle all requests
        try {
            // ---- Dispatcher handles ALL requests from the Discussions screens ----
            mockWebServer.dispatcher = object : Dispatcher() {
                override fun dispatch(request: RecordedRequest): MockResponse {
                    val path = request.path ?: "/"
                    val method = request.method ?: "GET"

                    // Normalize path: when baseUrl ends with /api/, service paths should NOT include "api/" again
                    // Expected common paths:
                    //   GET  /api/user/profile (actual endpoint)
                    //   GET  /api/users/me (alternative)
                    //   GET  /api/jobs
                    //   GET  /api/discussions
                    //   POST /api/discussions
                    // Some apps also ping Socket.IO:
                    //   GET  /socket.io/...
                    return when {
                        (path == "/api/user/profile" || path == "/api/users/me") && method == "GET" -> {
                            ok("""
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
                            """.trimIndent())
                        }

                        path == "/api/jobs" && method == "GET" -> {
                            ok("""{ "success": true, "data": [] }""")
                        }

                        // Initial discussions list render
                        path == "/api/discussions" && method == "GET" -> {
                            ok("""{ "success": true, "data": [] }""")
                        }

                        // Create discussion happy path
                        path == "/api/discussions" && method == "POST" -> {
                            // Always succeed for this dispatcher; individual tests can inject 400/500 by swapping dispatcher
                            created("""{ "success": true, "discussionId": "disc123" }""")
                        }

                        // Some libraries hit Socket.IO endpoints - keep them from 404ing/hanging
                        path.startsWith("/socket.io/") -> {
                            ok("{}")
                        }

                        else -> {
                            // Surface unknown calls loudly to the test log
                            MockResponse().setResponseCode(404)
                                .setBody("""{"error":"No handler for $method $path"}""")
                        }
                    }
                }
            }
            
            android.util.Log.d("DiscussionsMockTest", "Dispatcher configured for MockWebServer")
        } catch (e: Exception) {
            android.util.Log.e("DiscussionsMockTest", "Failed to setup dispatcher: ${e.message}", e)
            throw java.io.IOException("Failed to setup MockWebServer dispatcher: ${e.message}", e)
        }

        // BaseComposeTest.setup() handles: auth bypass, waitForAppToBeReady, UI Automator device, etc.
        super.setup()
    }

    @After
    fun tearDown() {
        RetrofitClient.setTestBaseUrl(null)
        try {
            mockWebServer.shutdown()
        } catch (e: Exception) {
            android.util.Log.e("DiscussionsMockTest", "Error shutting down MockWebServer: ${e.message}", e)
        }
        // If BaseComposeTest has a tearDown(), call it:
        try {
            val m = BaseComposeTest::class.java.methods.firstOrNull { it.name == "tearDown" && it.parameterCount == 0 }
            m?.invoke(this)
        } catch (_: Throwable) { /* ignore if not present */ }
    }

    // ============ TESTS ============

    /**
     * Success: create a discussion end-to-end
     * - Opens dialog
     * - Types a topic
     * - Presses Create
     * - Verifies the UI shows success (either toast/snackbar or refreshed list)
     *
     * NOTE: If your UI reloads the list after POST, we need to serve a list containing the new item.
     * We can do that by swapping the dispatcher temporarily for this test to return the created item
     * on the *second* GET /api/discussions.
     */
    @Test
    fun testCreateDiscussion_Success_Mocked() {
        // Swap dispatcher to capture that after POST, next GET returns the new item.
        var discussionsGetCount = 0
        mockWebServer.dispatcher = object : Dispatcher() {
            override fun dispatch(req: RecordedRequest): MockResponse {
                val path = req.path ?: "/"
                val method = req.method ?: "GET"
                return when {
                    path == "/api/users/me" && method == "GET" ->
                        ok("""{"data":{"user":{"id":"u1","email":"t@e.com","name":"Test User"}}}""")

                    path == "/api/jobs" && method == "GET" ->
                        ok("""{"success":true,"data":[]}""")

                    path == "/api/discussions" && method == "GET" -> {
                        discussionsGetCount++
                        if (discussionsGetCount >= 2) {
                            ok("""{"success":true,"data":[{"id":"disc123","topic":"Amazon SDE Interview Tips"}]}""")
                        } else {
                            ok("""{"success":true,"data":[]}""")
                        }
                    }

                    path == "/api/discussions" && method == "POST" ->
                        created("""{"success":true,"discussionId":"disc123"}""")

                    path.startsWith("/socket.io/") ->
                        ok("{}")

                    else -> MockResponse().setResponseCode(404)
                }
            }
        }

        // 1) Wait for landing screen
        waitForText("Community Discussions", timeoutMillis = 5_000)

        // 2) Open create dialog
        getNodeWithText("New Discussion", substring = true).performClick()
        waitForText("Create Discussion", timeoutMillis = 2_000)

        // 3) Type topic and submit
        getNodeWithText("Topic", substring = true).performTextInput("Amazon SDE Interview Tips")
        getNodeWithText("Create", substring = true).performClick()

        // 4) Verify result (either success toast/snackbar, or item in the list after refresh)
        // Prefer checking the newly shown topic in the list:
        waitForText("Amazon SDE Interview Tips", substring = true, timeoutMillis = 5_000)
    }

    /**
     * Failure: Empty topic (client-side validation, no network call)
     */
    @Test
    fun testCreateDiscussion_EmptyTopic_ShowsLocalError() {
        waitForText("Community Discussions", timeoutMillis = 5_000)
        getNodeWithText("New Discussion", substring = true).performClick()
        waitForText("Create Discussion", timeoutMillis = 2_000)

        // Do NOT type anything, just hit Create
        getNodeWithText("Create", substring = true).performClick()

        // Expect client-side validation message (match your actual UI text)
        waitForText("Topic cannot be empty", substring = true, timeoutMillis = 5_000)
    }

    /**
     * Failure: Topic too long (client-side validation OR server 400)
     * This variant triggers client-side validation by typing 101 chars.
     */
    @Test
    fun testCreateDiscussion_TopicTooLong_LocalValidation() {
        waitForText("Community Discussions", timeoutMillis = 5_000)
        getNodeWithText("New Discussion", substring = true).performClick()
        waitForText("Create Discussion", timeoutMillis = 2_000)

        val longTopic = "A".repeat(101) // > 100 char
        getNodeWithText("Topic", substring = true).performTextInput(longTopic)
        getNodeWithText("Create", substring = true).performClick()

        waitForText("Topic cannot exceed 100 characters", substring = true, timeoutMillis = 5_000)
    }

    /**
     * Failure: Server error (500) after trying to create a valid topic
     * Here we *force* the POST to return 500 by swapping dispatcher for this test.
     */
    @Test
    fun testCreateDiscussion_ServerError_Mocked() {
        mockWebServer.dispatcher = object : Dispatcher() {
            override fun dispatch(req: RecordedRequest): MockResponse {
                val path = req.path ?: "/"
                val method = req.method ?: "GET"
                return when {
                    path == "/api/users/me" && method == "GET" ->
                        ok("""{"data":{"user":{"id":"u1","email":"t@e.com","name":"Test User"}}}""")
                    path == "/api/jobs" && method == "GET" ->
                        ok("""{"success":true,"data":[]}""")
                    path == "/api/discussions" && method == "GET" ->
                        ok("""{"success":true,"data":[]}""")
                    path == "/api/discussions" && method == "POST" ->
                        json(500, """{"success":false,"message":"Internal server error"}""")
                    path.startsWith("/socket.io/") ->
                        ok("{}")
                    else -> MockResponse().setResponseCode(404)
                }
            }
        }

        waitForText("Community Discussions", timeoutMillis = 5_000)
        getNodeWithText("New Discussion", substring = true).performClick()
        waitForText("Create Discussion", timeoutMillis = 2_000)

        getNodeWithText("Topic", substring = true).performTextInput("Any valid topic")
        getNodeWithText("Create", substring = true).performClick()

        // Match whatever your app shows on 500 (toast/snackbar/dialog)
        waitForText("Internal server error", substring = true, timeoutMillis = 5_000)
    }
}
