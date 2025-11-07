package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.uiautomator.UiSelector
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Discussions Feature
 * 
 * Feature: Community Discussions
 * 
 * ⚠️ IMPORTANT: These tests require a running backend server.
 * For local testing, ensure backend is running on localhost:3000
 * (Android emulator uses 10.0.2.2:3000 to access localhost)
 * 
 * Test Structure:
 * - Each use case is a separate test function
 * - Uses check() functions with retry logic (5 second delays)
 * - Tests organized by use case scenarios
 */
class DiscussionsTest : BaseComposeTest() {

    /**
     * Navigate to discussions screen by clicking the discussions button in the top app bar
     * This should be called at the start of each test to ensure we're on the discussions screen
     */
    private fun navigateToDiscussions() {
        android.util.Log.d("DiscussionsTest", "Navigating to discussions screen...")
        
        // Step 1: Wait for main screen to load
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen 'My Job Applications' not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Find and click the discussions button (Chat icon in top app bar)
        // The button has contentDescription = "Discussions"
        android.util.Log.d("DiscussionsTest", "Looking for Discussions button...")
        var discussionsButtonClicked = false
        
        // Try to find and click by content description
        val buttonFound = check(maxRetries = 6) {
            try {
                composeTestRule.onNodeWithContentDescription("Discussions").assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        if (buttonFound) {
            try {
                composeTestRule.onNodeWithContentDescription("Discussions").performClick()
                android.util.Log.d("DiscussionsTest", "✓ Clicked Discussions button")
                discussionsButtonClicked = true
            } catch (e: Exception) {
                android.util.Log.w("DiscussionsTest", "Could not click Discussions button: ${e.message}")
            }
        }
        
        // Fallback: try clicking by text if content description didn't work
        if (!discussionsButtonClicked) {
            android.util.Log.w("DiscussionsTest", "Discussions button not found by content description, trying text...")
            discussionsButtonClicked = checkTextAndClick("Discussions", maxRetries = 3)
        }
        
        assert(discussionsButtonClicked) {
            "Failed: Could not find or click Discussions button. " +
            "Make sure the button has contentDescription='Discussions' in the top app bar."
        }
        
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Verify we're on the discussions screen
        android.util.Log.d("DiscussionsTest", "Verifying we're on discussions screen...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Did not navigate to Community Discussions screen"
        }
        
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        android.util.Log.d("DiscussionsTest", "✓ Successfully navigated to discussions screen")
    }

    @Before
    override fun setup() {
        // IMPORTANT: Backend must be running for these tests!
        
        // Ensure auth token is set for API calls BEFORE app starts
        val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        RetrofitClient.setAuthToken(testToken)
        
        android.util.Log.d("DiscussionsTest", "Test token set. Backend URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")
        
        super.setup()
        
        // Navigate to discussions screen after app setup
        navigateToDiscussions()
    }

    /**
     * Use Case: Browse existing discussions
     * Main success scenario:
     * 1. User navigates to discussions section (already done in setup)
     * 2. System displays list of discussions
     * 3. User can see discussion topics and metadata
     * 4. User clicks on multiple discussions to browse
     */
    @Test
    fun useCase_BrowseDiscussions_Success() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Browse Discussions - Success ===")
        
        // Note: Navigation to discussions is already done in setup()
        // Step 1 is complete - we're already on discussions screen
        
        // Step 2-3: Check that discussions list is displayed
        android.util.Log.d("DiscussionsTest", "Step 2-3: Checking for discussions list...")
        val discussionsFound = check(maxRetries = 6) {
            try {
                composeTestRule.onAllNodes(hasText("Amazon", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(discussionsFound) {
            "Failed: Discussions list not displayed. Check backend for existing discussions."
        }
        
        // Step 4: Click on multiple discussions to browse
        android.util.Log.d("DiscussionsTest", "Step 4: Clicking on multiple discussions to browse...")
        
        // Click on first discussion
        val firstClicked = checkTextAndClick("Amazon", substring = true, maxRetries = 3) ||
                          checkTextAndClick("Discussion", substring = true, maxRetries = 3)
        assert(firstClicked) { "Failed: Could not click on first discussion" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Verify we're on discussion detail screen
        val onDetailScreen = checkText("Amazon", maxRetries = 3) ||
                            check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        assert(onDetailScreen) { "Failed: Did not navigate to discussion detail screen" }
        
        // Go back to discussions list
        android.util.Log.d("DiscussionsTest", "Going back to discussions list...")
        val backClicked = checkAndClick(maxRetries = 3) {
            try {
                composeTestRule.onNodeWithContentDescription("Back")
            } catch (e: Exception) {
                null
            }
        }
        if (!backClicked) {
            // Fallback: try pressing device back button
            pressBack()
            Thread.sleep(1000)
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Verify we're back on discussions list
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Did not return to discussions list"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Click on another discussion (if available)
        val secondClicked = checkTextAndClick("Discussion", substring = true, maxRetries = 3)
        if (secondClicked) {
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
            android.util.Log.d("DiscussionsTest", "✓ Successfully clicked on second discussion")
        } else {
            android.util.Log.d("DiscussionsTest", "Note: Only one discussion available, that's okay")
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Use Case: Browse Discussions - Success PASSED")
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
    fun useCase_CreateDiscussion_Success() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Create Discussion - Success ===")
        
        // Note: Navigation to discussions is already done in setup()
        // Step 1 is complete - we're already on discussions screen
        
        // Step 2: Check for and click "Create Discussion" button
        android.util.Log.d("DiscussionsTest", "Step 2: Checking for 'Create Discussion' button...")
        assert(checkTag("new_discussion_button", maxRetries = 6)) {
            "Failed: Create Discussion button not found"
        }
        
        val createClicked = checkTagAndClick("new_discussion_button", maxRetries = 3)
        assert(createClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for creation form
        android.util.Log.d("DiscussionsTest", "Step 3: Checking for 'Create Discussion' form...")
        assert(checkText("Create Discussion", maxRetries = 6)) {
            "Failed: Create Discussion form not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 4: Enter discussion topic title
        android.util.Log.d("DiscussionsTest", "Step 4: Entering topic title...")
        try {
            composeTestRule.onNodeWithTag("discussion_topic_input")
                .performTextInput("Amazon SDE Interview Tips")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("DiscussionsTest", "Could not input topic using test tag: ${e.message}")
        }
        
        // Step 5: Optionally add description
        android.util.Log.d("DiscussionsTest", "Step 5: Entering description...")
        try {
            composeTestRule.onNodeWithTag("discussion_description_input")
                .performTextInput("Share your experiences with Amazon interviews")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("DiscussionsTest", "Could not input description using test tag: ${e.message}")
        }
        
        // Step 6: Click "Create Discussion" to submit
        android.util.Log.d("DiscussionsTest", "Step 6: Submitting discussion...")
        val submitClicked = checkTagAndClick("create_discussion_button", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 7-8: Check that discussion is created and user is redirected
        android.util.Log.d("DiscussionsTest", "Step 7-8: Checking for created discussion...")
        val discussionCreated = checkText("Amazon SDE Interview Tips", maxRetries = 6)
        
        assert(discussionCreated) {
            "Failed: Discussion not created or not redirected. Check backend logs for errors."
        }
        
        // Step 9: Verify user can post messages (form should be available)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        android.util.Log.d("DiscussionsTest", "✓ Use Case: Create Discussion - Success PASSED")
    }

    /**
     * Use Case: Create Discussion - Failure Scenario 4a
     * User submits empty discussion topic
     * 
     * Expected side effect:
     * Discussion should NOT be created (validation should prevent it)
     */
    @Test
    fun useCase_CreateDiscussion_EmptyTopic_Failure() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Create Discussion - Empty Topic Failure ===")
        
        // Note: Navigation to discussions is already done in setup()
        // We're already on discussions screen
        
        // Step 1: Get current discussions list state (count or names)
        android.util.Log.d("DiscussionsTest", "Step 1: Getting baseline discussions list...")
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Verify we're on discussions list
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        
        // Step 2: Click "Create Discussion"
        android.util.Log.d("DiscussionsTest", "Step 2: Opening Create Discussion form...")
        val createClicked = checkTagAndClick("new_discussion_button", maxRetries = 3)
        assert(createClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for form
        assert(checkText("Create Discussion", maxRetries = 6)) {
            "Failed: Create Discussion form not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 4: Try to submit without entering any topic (leave it empty)
        android.util.Log.d("DiscussionsTest", "Step 4: Attempting to submit with empty topic...")
        val submitClicked = checkTagAndClick("create_discussion_button", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(5000) // Wait longer to see if validation prevents submission
        
        // Step 5: Check what happened after submission
        // If validation worked correctly, we should still be on the form OR back on list without creating
        android.util.Log.d("DiscussionsTest", "Step 5: Checking state after submission...")
        val stillOnForm = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Create Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        val onDiscussionList = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Community Discussions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 6: Navigate back to discussions list if needed
        if (stillOnForm) {
            android.util.Log.d("DiscussionsTest", "Form still open (validation prevented submission), closing form...")
            val cancelClicked = checkTextAndClick("Cancel", maxRetries = 3)
            if (!cancelClicked) {
                pressBack()
                Thread.sleep(1000)
            }
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        } else if (!onDiscussionList) {
            android.util.Log.d("DiscussionsTest", "Not on form or list, navigating back...")
            pressBack()
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        }
        
        // Step 7: Verify we're on discussions list
        android.util.Log.d("DiscussionsTest", "Step 7: Verifying we're on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 8: Verify side effect - No new discussion was created
        // Since we didn't enter a topic, we can't check for a specific name
        // But we can verify that we're still on the list and no unexpected redirect happened
        // The key side effect is: we should NOT be on a discussion detail page
        android.util.Log.d("DiscussionsTest", "Step 8: Verifying side effect - discussion was NOT created...")
        
        val stillOnList = checkText("Community Discussions", maxRetries = 3)
        assert(stillOnList) {
            "Failed: Side effect check failed. Expected to be on discussions list, " +
            "but discussion creation may have succeeded (which should not happen with empty topic)."
        }
        
        // Also verify we're not on a discussion detail page (which would indicate a discussion was created)
        val notOnDetailPage = check(maxRetries = 3) {
            try {
                // If we're on a detail page, we'd see a back button or message input
                val hasBackButton = try {
                    composeTestRule.onNodeWithContentDescription("Back").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                val hasMessageInput = try {
                    composeTestRule.onNodeWithTag("message_input").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                // We should NOT be on detail page (no back button or message input visible)
                !hasBackButton && !hasMessageInput
            } catch (e: Exception) {
                true // If check fails, assume we're on list (good)
            }
        }
        
        assert(notOnDetailPage) {
            "Failed: Side effect check failed. Appears to be on discussion detail page, " +
            "which suggests a discussion was created despite empty topic. This should not happen."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Side effect verified: Discussion was NOT created - test PASSED")
    }

    /**
     * Use Case: Create Discussion - Failure Scenario 4b
     * Discussion topic exceeds character limit
     * 
     * Expected side effect:
     * Discussion should NOT be created (validation should prevent it)
     */
    @Test
    fun useCase_CreateDiscussion_TopicTooLong_Failure() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Create Discussion - Topic Too Long Failure ===")
        
        // Note: Navigation to discussions is already done in setup()
        // We're already on discussions screen
        
        // Step 1: Verify we're on discussions list
        android.util.Log.d("DiscussionsTest", "Step 1: Verifying we're on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Click "Create Discussion"
        android.util.Log.d("DiscussionsTest", "Step 2: Opening Create Discussion form...")
        val createClicked = checkTagAndClick("new_discussion_button", maxRetries = 3)
        assert(createClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for form
        assert(checkText("Create Discussion", maxRetries = 6)) {
            "Failed: Create Discussion form not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 4: Enter topic exceeding 100 characters (invalid input)
        android.util.Log.d("DiscussionsTest", "Step 4: Entering topic exceeding 100 characters...")
        val longTopic = "A".repeat(101)
        try {
            composeTestRule.onNodeWithTag("discussion_topic_input")
                .performTextInput(longTopic)
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("DiscussionsTest", "Could not input topic: ${e.message}")
            assert(false) { "Failed: Could not input topic text" }
        }
        
        // Step 5: Try to submit
        android.util.Log.d("DiscussionsTest", "Step 5: Attempting to submit with topic too long...")
        val submitClicked = checkTagAndClick("create_discussion_button", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(5000) // Wait longer to see if validation prevents submission
        
        // Step 6: Check what happened after submission
        android.util.Log.d("DiscussionsTest", "Step 6: Checking state after submission...")
        val stillOnForm = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Create Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        val onDiscussionList = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Community Discussions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 7: Navigate back to discussions list if needed
        if (stillOnForm) {
            android.util.Log.d("DiscussionsTest", "Form still open (validation prevented submission), closing form...")
            val cancelClicked = checkTextAndClick("Cancel", maxRetries = 3)
            if (!cancelClicked) {
                pressBack()
                Thread.sleep(1000)
            }
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        } else if (!onDiscussionList) {
            android.util.Log.d("DiscussionsTest", "Not on form or list, navigating back...")
            pressBack()
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        }
        
        // Step 8: Verify we're on discussions list
        android.util.Log.d("DiscussionsTest", "Step 8: Verifying we're on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 9: Verify side effect - Discussion with long topic was NOT created
        android.util.Log.d("DiscussionsTest", "Step 8: Verifying side effect - discussion was NOT created...")
        
        // Check that the long topic (101 'A's) does NOT appear in the discussions list
        val longTopicExists = check(maxRetries = 3) {
            try {
                // Try to find the long topic in the list
                composeTestRule.onAllNodes(hasText("A".repeat(101), substring = false))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Test PASSES if the long topic is NOT found (discussion was NOT created)
        assert(!longTopicExists) {
            "Failed: Side effect check failed. Found discussion with topic '${"A".repeat(101)}' in the list, " +
            "which means the discussion was created despite topic being too long. This should not happen."
        }
        
        // Also verify we're not on a discussion detail page
        val notOnDetailPage = check(maxRetries = 3) {
            try {
                val hasBackButton = try {
                    composeTestRule.onNodeWithContentDescription("Back").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                val hasMessageInput = try {
                    composeTestRule.onNodeWithTag("message_input").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                !hasBackButton && !hasMessageInput
            } catch (e: Exception) {
                true
            }
        }
        
        assert(notOnDetailPage) {
            "Failed: Side effect check failed. Appears to be on discussion detail page, " +
            "which suggests a discussion was created despite topic being too long."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Side effect verified: Discussion was NOT created - test PASSED")
    }

    /**
     * Use Case: Create Discussion - Failure Scenario 5a
     * Initial description exceeds character limit
     * 
     * Expected side effect:
     * Discussion should NOT be created (validation should prevent it)
     */
    @Test
    fun useCase_CreateDiscussion_DescriptionTooLong_Failure() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Create Discussion - Description Too Long Failure ===")
        
        // Note: Navigation to discussions is already done in setup()
        // We're already on discussions screen
        
        // Step 1: Verify we're on discussions list
        android.util.Log.d("DiscussionsTest", "Step 1: Verifying we're on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Click "Create Discussion"
        android.util.Log.d("DiscussionsTest", "Step 2: Opening Create Discussion form...")
        val createClicked = checkTagAndClick("new_discussion_button", maxRetries = 3)
        assert(createClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for form
        assert(checkText("Create Discussion", maxRetries = 6)) {
            "Failed: Create Discussion form not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 4: Enter valid topic
        android.util.Log.d("DiscussionsTest", "Step 4: Entering valid topic...")
        val testTopic = "Test Discussion ${System.currentTimeMillis()}"
        try {
            composeTestRule.onNodeWithTag("discussion_topic_input")
                .performTextInput(testTopic)
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("DiscussionsTest", "Could not input topic: ${e.message}")
            assert(false) { "Failed: Could not input topic text" }
        }
        
        // Step 5: Enter description exceeding 500 characters (invalid input)
        android.util.Log.d("DiscussionsTest", "Step 5: Entering description exceeding 500 characters...")
        val longDescription = "A".repeat(501)
        try {
            composeTestRule.onNodeWithTag("discussion_description_input")
                .performTextInput(longDescription)
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("DiscussionsTest", "Could not input description: ${e.message}")
            assert(false) { "Failed: Could not input description text" }
        }
        
        // Step 6: Try to submit
        android.util.Log.d("DiscussionsTest", "Step 6: Attempting to submit with description too long...")
        val submitClicked = checkTagAndClick("create_discussion_button", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Create Discussion button" }
        composeTestRule.waitForIdle()
        Thread.sleep(5000) // Wait longer to see if validation prevents submission
        
        // Step 7: Check what happened after submission
        android.util.Log.d("DiscussionsTest", "Step 7: Checking state after submission...")
        val stillOnForm = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Create Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        val onDiscussionList = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Community Discussions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 8: Navigate back to discussions list if needed
        if (stillOnForm) {
            android.util.Log.d("DiscussionsTest", "Form still open (validation prevented submission), closing form...")
            val cancelClicked = checkTextAndClick("Cancel", maxRetries = 3)
            if (!cancelClicked) {
                pressBack()
                Thread.sleep(1000)
            }
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        } else if (!onDiscussionList) {
            android.util.Log.d("DiscussionsTest", "Not on form or list, navigating back...")
            pressBack()
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        }
        
        // Step 9: Verify we're on discussions list
        android.util.Log.d("DiscussionsTest", "Step 9: Verifying we're on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: Not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 10: Verify side effect - Discussion with test topic was NOT created
        android.util.Log.d("DiscussionsTest", "Step 10: Verifying side effect - discussion was NOT created...")
        
        // Check that the test topic does NOT appear in the discussions list
        val testTopicExists = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText(testTopic, substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Test PASSES if the test topic is NOT found (discussion was NOT created)
        assert(!testTopicExists) {
            "Failed: Side effect check failed. Found discussion with topic '$testTopic' in the list, " +
            "which means the discussion was created despite description being too long. This should not happen."
        }
        
        // Also verify we're not on a discussion detail page
        val notOnDetailPage = check(maxRetries = 3) {
            try {
                val hasBackButton = try {
                    composeTestRule.onNodeWithContentDescription("Back").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                val hasMessageInput = try {
                    composeTestRule.onNodeWithTag("message_input").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                !hasBackButton && !hasMessageInput
            } catch (e: Exception) {
                true
            }
        }
        
        assert(notOnDetailPage) {
            "Failed: Side effect check failed. Appears to be on discussion detail page, " +
            "which suggests a discussion was created despite description being too long."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Side effect verified: Discussion was NOT created - test PASSED")
    }

    /**
     * Use Case: View discussion
     * 1. User clicks on a discussion
     * 2. Discussion detail screen opens
     * 3. All messages are displayed
     */
    @Test
    fun useCase_ViewDiscussion_Success() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: View Discussion - Success ===")
        
        // Note: Navigation to discussions is already done in setup()
        // Step 1 is complete - we're already on discussions screen
        
        // Step 2: Check for and click on a discussion
        android.util.Log.d("DiscussionsTest", "Step 2: Checking for discussions to click...")
        val discussionExists = check(maxRetries = 6) {
            try {
                composeTestRule.onAllNodes(hasText("Amazon", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(discussionExists) { "Failed: No discussions found to view" }
        
        val discussionClicked = checkTextAndClick("Amazon", substring = true, maxRetries = 3) ||
                               checkTextAndClick("Discussion", substring = true, maxRetries = 3)
        assert(discussionClicked) { "Failed: Could not click on discussion" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check that discussion detail screen opens
        android.util.Log.d("DiscussionsTest", "Step 3: Checking for discussion detail screen...")
        val detailScreenVisible = checkText("Amazon", maxRetries = 6) ||
                                 check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Discussion", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(detailScreenVisible) { "Failed: Discussion detail screen not displayed" }
        
        android.util.Log.d("DiscussionsTest", "✓ Use Case: View Discussion - Success PASSED")
    }

    /**
     * Use Case: Post message in discussion
     * 1. User opens a discussion
     * 2. User types a message
     * 3. User submits message
     * 4. Message appears in discussion
     */
    @Test
    fun useCase_PostMessage_Success() {
        android.util.Log.d("DiscussionsTest", "=== Use Case: Post Message - Success ===")
        
        // Note: Navigation to discussions is already done in setup()
        // Step 1: We're already on discussions screen, now open a discussion
        
        val discussionClicked = checkTextAndClick("Amazon", substring = true, maxRetries = 3) ||
                               checkTextAndClick("Discussion", substring = true, maxRetries = 3)
        assert(discussionClicked) { "Failed: Could not click on discussion" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        assert(checkText("Amazon", maxRetries = 6)) {
            "Failed: Discussion detail screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Type message
        android.util.Log.d("DiscussionsTest", "Step 2: Waiting for message input field to be ready...")
        composeTestRule.waitForIdle()
        Thread.sleep(3000) // Give time for the bottom bar to render
        
        // Wait for the message input field to be available (by test tag)
        android.util.Log.d("DiscussionsTest", "Looking for message input field with test tag 'message_input'...")
        val inputFieldReady = check(maxRetries = 8, retryDelayMs = 2000) {
            try {
                composeTestRule.onNodeWithTag("message_input").assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        assert(inputFieldReady) {
            "Failed: Message input field not found. The field may not be rendered yet or test tag is missing."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Message input field found, now typing message...")
        
        // Type the message using the test tag
        var messageTyped = false
        var attempt = 0
        val maxAttempts = 5
        
        while (!messageTyped && attempt < maxAttempts) {
            try {
                composeTestRule.waitForIdle()
                Thread.sleep(1000)
                
                android.util.Log.d("DiscussionsTest", "Attempt ${attempt + 1}: Typing message into input field...")
                
                // Find the TextField by test tag and type the message
                val textFieldNode = composeTestRule.onNodeWithTag("message_input")
                textFieldNode.assertExists()
                textFieldNode.assertIsEnabled()
                
                // Click to focus first
                textFieldNode.performClick()
                Thread.sleep(1000)
                composeTestRule.waitForIdle()
                
                // Clear any existing text and type new message
                textFieldNode.performTextInput("Great tips! Thanks for sharing.")
                Thread.sleep(1500)
                composeTestRule.waitForIdle()
                
                // Verify the text was entered by checking if it appears in the TextField
                val textEntered = check(maxRetries = 4, retryDelayMs = 1000) {
                    try {
                        // The text should now be in the TextField, so we can check for it
                        composeTestRule.onAllNodes(hasText("Great tips", substring = true))
                            .fetchSemanticsNodes(false).isNotEmpty() ||
                        composeTestRule.onAllNodes(hasText("Thanks for sharing", substring = true))
                            .fetchSemanticsNodes(false).isNotEmpty()
                    } catch (e: Exception) {
                        false
                    }
                }
                
                if (textEntered) {
                    messageTyped = true
                    android.util.Log.d("DiscussionsTest", "✓ Message successfully typed into input field")
                } else {
                    android.util.Log.w("DiscussionsTest", "Text input performed but verification failed, retrying...")
                }
                
            } catch (e: Exception) {
                android.util.Log.w("DiscussionsTest", "Attempt ${attempt + 1} failed: ${e.message}")
                e.printStackTrace()
            }
            
            attempt++
            if (!messageTyped && attempt < maxAttempts) {
                android.util.Log.d("DiscussionsTest", "Retrying in 2 seconds... (attempt ${attempt + 1}/$maxAttempts)")
                Thread.sleep(2000)
            }
        }
        
        assert(messageTyped) {
            "Failed: Could not type message after $maxAttempts attempts. " +
            "The message input field may not be accessible or interactive. " +
            "Check if the field is enabled and visible."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Message typed successfully, waiting before submission...")
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Submit message
        android.util.Log.d("DiscussionsTest", "Step 3: Submitting message...")
        // The button is an IconButton with contentDescription "Send Message"
        val sendClicked = checkAndClick(maxRetries = 3) {
            try {
                composeTestRule.onNodeWithContentDescription("Send Message")
            } catch (e: Exception) {
                null
            }
        }
        assert(sendClicked) { "Failed: Could not click Send button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 4: Check that message appears
        android.util.Log.d("DiscussionsTest", "Step 4: Checking for posted message...")
        val messageFound = checkText("Great tips! Thanks for sharing.", maxRetries = 6)
        
        assert(messageFound) {
            "Failed: Message not found after posting. Check backend logs for errors."
        }
        
        android.util.Log.d("DiscussionsTest", "✓ Use Case: Post Message - Success PASSED")
    }
}
