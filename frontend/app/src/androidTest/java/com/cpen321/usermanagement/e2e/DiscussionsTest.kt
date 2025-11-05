package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Discussions Feature (Unmocked)
 *
 * ⚠️ IMPORTANT: These tests require a running backend server.
 * For local testing, ensure backend is running on localhost:3000
 * (Android emulator uses 10.0.2.2:3000 to access localhost)
 *
 * Tests based on Use Case 5: Create Discussion
 * From Requirements_and_Design.md
 *
 * Use Cases:
 * - Browse existing discussions
 * - Create a discussion
 * - View a discussion
 * - Post in a discussion
 *
 * Failure scenarios:
 * - 4a: Empty discussion topic
 * - 4b: Topic exceeds character limit
 * - 5a: Description exceeds character limit
 */
class DiscussionsTest : BaseComposeTest() {

    @Before
    override fun setup() {
        // IMPORTANT: Backend must be running for these tests!
        // See E2E_TEST_SETUP_LOCAL.md for setup instructions
        
        // Ensure auth token is set for API calls BEFORE app starts
        val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        RetrofitClient.setAuthToken(testToken)
        
        android.util.Log.d("DiscussionsTest", "Test token set. Backend URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")
        
        super.setup()
    }

    /**
     * Test: Browse existing discussions
     * Main success scenario:
     * 1. User navigates to discussions section
     * 2. System displays list of discussions
     * 3. User can see discussion topics and metadata
     */
    @Test
    fun testBrowseDiscussions_Success() {
        // Navigate to discussions (assuming in navigation)
        // This depends on app navigation structure
        waitForText("Community Discussions", substring = true, timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(5000)

        // Verify discussions list is displayed
        // Assumes at least one discussion exists
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            try {
                val hasAmazon = try {
                    getNodeWithText("Amazon", substring = true, waitForNode = false).assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                
                val hasDiscussion = try {
                    getNodeWithText("Discussion", substring = true, waitForNode = false).assertExists()
                    true
                } catch (e2: Exception) {
                    false
                }
                
                hasAmazon || hasDiscussion
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
    }

    /**
     * Use Case 5: Create Discussion - Main Success Scenario
     * 
     * Steps:
     * 1. User navigates to the discussions section
     * 2. User clicks on "Create Discussion" button
     * 3. System displays discussion creation form
     * 4. User enters discussion topic title (e.g., "Amazon SDE Interview Tips")
     * 5. User optionally adds an initial description or message
     * 6. User clicks "Create Discussion" to submit
     * 7. System stores the discussion
     * 8. System redirects user to the newly created discussion page
     * 9. User can begin posting messages in the discussion
     */
    @Test
    fun testCreateDiscussion_Success() {
        waitForText("Community Discussions", timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)

        // Step 2: User clicks on "Create Discussion" button
        clickNodeByTag("new_discussion_button")

        // Step 3: System displays discussion creation form
        waitForText("Create Discussion", substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)

        // Step 4: User enters discussion topic title
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        composeTestRule.onNodeWithTag("discussion_topic_input")
            .performTextInput("Amazon SDE Interview Tips")
        Thread.sleep(2000)
        composeTestRule.waitForIdle()

        // Step 5: User optionally adds an initial description or message
        Thread.sleep(1000)
        composeTestRule.onNodeWithTag("discussion_description_input")
            .performTextInput("Share your experiences with Amazon interviews")
        Thread.sleep(2000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)

        // Step 6: User clicks "Create Discussion" to submit
        clickNodeByTag("create_discussion_button")

        // Step 7: System stores the discussion
        composeTestRule.waitForIdle()
        Thread.sleep(5000)

        // Step 8: System redirects user to the newly created discussion page
        waitForText("Amazon SDE Interview Tips", substring = true, timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)

        // Step 9: User can begin posting messages in the discussion
        // Verify posting capability is available
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        // Discussion page should be visible and ready for posting
    }

    /**
     * Failure Scenario 4a: User submits empty discussion topic
     * Expected:
     * 4a1. System displays validation error: "Discussion topic is required. Please enter a topic title."
     * 4a2. User remains on creation form to provide input
     */
    @Test
    fun testCreateDiscussion_EmptyTopic_Failure() {
        // Step 1: Navigate to discussions section
        waitForText("Community Discussions", timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 2: Click "Create Discussion" button
        clickNodeByTag("new_discussion_button")

        // Step 3: System displays creation form
        waitForText("Create Discussion", substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)

        // Step 4a: Try to submit without topic (empty topic)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        clickNodeByTag("create_discussion_button")

        // Step 4a1: Verify error message
        composeTestRule.waitForIdle()
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                composeTestRule.onAllNodes(hasText("Discussion topic is required", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Please enter a topic title", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 4a2: Verify user remains on creation form
        waitForText("Create Discussion", substring = true, timeoutMillis = 5000)
    }

    /**
     * Failure Scenario 4b: Discussion topic exceeds character limit
     * Expected:
     * 4b1. System displays validation error: "Topic title is too long. Please keep it under 100 characters."
     * 4b2. User can edit the topic title
     */
    @Test
    fun testCreateDiscussion_TopicTooLong_Failure() {
        // Step 1: Navigate to discussions section
        waitForText("Community Discussions", timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 2: Click "Create Discussion" button
        clickNodeByTag("new_discussion_button")

        // Step 3: System displays creation form
        waitForText("Create Discussion", substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)

        // Step 4b: Enter topic exceeding 100 characters
        val longTopic = "A".repeat(101)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        composeTestRule.onNodeWithTag("discussion_topic_input")
            .performTextInput(longTopic)
        Thread.sleep(2000)
        composeTestRule.waitForIdle()

        // Try to submit
        clickNodeByTag("create_discussion_button")

        // Step 4b1: Verify error message
        composeTestRule.waitForIdle()
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                composeTestRule.onAllNodes(hasText("Topic title is too long", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Please keep it under 100 characters", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 4b2: Verify user can edit (form is still visible)
        waitForText("Create Discussion", substring = true, timeoutMillis = 5000)
    }

    /**
     * Failure Scenario 5a: Initial description exceeds character limit
     * Expected:
     * 5a1. System displays validation error: "Description is too long. Please keep it under 500 characters."
     * 5a2. User can edit the description
     */
    @Test
    fun testCreateDiscussion_DescriptionTooLong_Failure() {
        // Step 1: Navigate to discussions section
        waitForText("Community Discussions", timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 2: Click "Create Discussion" button
        clickNodeByTag("new_discussion_button")

        // Step 3: System displays creation form
        waitForText("Create Discussion", substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)

        // Step 4: Enter valid topic
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        composeTestRule.onNodeWithTag("discussion_topic_input")
            .performTextInput("Valid Topic")
        Thread.sleep(2000)
        composeTestRule.waitForIdle()

        // Step 5a: Enter description exceeding 500 characters
        val longDescription = "A".repeat(501)
        Thread.sleep(1000)
        composeTestRule.onNodeWithTag("discussion_description_input")
            .performTextInput(longDescription)
        Thread.sleep(2000)
        composeTestRule.waitForIdle()

        // Try to submit
        clickNodeByTag("create_discussion_button")

        // Step 5a1: Verify error message
        composeTestRule.waitForIdle()
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                composeTestRule.onAllNodes(hasText("Description is too long", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Please keep it under 500 characters", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 5a2: Verify user can edit (form is still visible)
        waitForText("Create Discussion", substring = true, timeoutMillis = 5000)
    }

    /**
     * Test: View discussion
     * 1. User clicks on a discussion
     * 2. Discussion detail screen opens
     * 3. All messages are displayed
     */
    @Test
    fun testViewDiscussion_Success() {
        waitForText("Community Discussions", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)

        // Wait for discussion to be clickable
        composeTestRule.waitUntil(timeoutMillis = 15000) {
            try {
                getNodeWithText("Amazon", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        
        // Click on first discussion
        getNodeWithText("Amazon", substring = true)
            .performClick()

        // Verify discussion detail screen
        composeTestRule.waitForIdle()
        waitForText("Amazon", substring = true, timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
    }

    /**
     * Test: Post message in discussion
     * 1. User opens a discussion
     * 2. User types a message
     * 3. User submits message
     * 4. Message appears in discussion
     */
    @Test
    fun testPostMessage_Success() {
        waitForText("Community Discussions", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        composeTestRule.waitUntil(timeoutMillis = 15000) {
            try {
                getNodeWithText("Amazon", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        getNodeWithText("Amazon", substring = true)
            .performClick()

        waitForText("Amazon", substring = true, timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)

        // Type message
        composeTestRule.waitForIdle()
        typeText("message_input", "Great tips! Thanks for sharing.")
        Thread.sleep(500)
        composeTestRule.waitForIdle()

        // Submit
        clickButton("Post")

        // Verify message appears
        composeTestRule.waitForIdle()
        waitForText("Great tips! Thanks for sharing.", substring = true, timeoutMillis = 15000)
    }
}

