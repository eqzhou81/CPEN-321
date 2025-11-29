package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Live Discussion Updates (Real-time Synchronization)
 *
 * Feature: Live Discussion Updates Between Multiple Users
 *
 * ⚠️ IMPORTANT SETUP REQUIREMENTS:
 * 1. Backend server must be running with WebSocket/SSE support for live updates
 * 2. These tests require MANUAL COORDINATION with a second tester
 * 3. User A (automated test) and User B (manual tester) must be synchronized
 *
 * Test Structure:
 * - User A: Automated tests (this device)
 * - User B: Manual tester (separate device/emulator)
 * - Each test includes step-by-step instructions for User B
 * - User A waits for User B's actions to appear (live updates)
 *
 * MANUAL TESTER SETUP (User B):
 * 1. Open the app on a separate device/emulator
 * 2. Log in with a DIFFERENT test account:
 *    Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNyIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.example-different-token
 * 3. Navigate to the Community Discussions screen
 * 4. Follow the instructions printed in the test logs
 *
 * HOW TO RUN THESE TESTS:
 * 1. Start the test on Device A (this runs automatically)
 * 2. Watch the Android Studio logs for "🔔 MANUAL TESTER (User B)" instructions
 * 3. Manual tester performs actions on Device B as instructed
 * 4. Test on Device A automatically verifies the live updates appear
 */
class LiveDiscussionsTest : BaseComposeTest() {

    private fun navigateFromMainScreenToDiscussionsScreen() {
        android.util.Log.d("LiveDiscussionsTest", "Navigating to discussions screen...")

        // Wait for main screen
        assert(checkText("Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)

        // Click discussions tab in bottom navigation (using unmerged tree)
        val tabFound = check(maxRetries = 6) {
            try {
                composeTestRule.onNodeWithContentDescription("Discussions", useUnmergedTree = true).assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }

        if (tabFound) {
            try {
                composeTestRule.onNodeWithContentDescription("Discussions", useUnmergedTree = true).performClick()
                android.util.Log.d("LiveDiscussionsTest", "✓ Clicked Discussions tab")
            } catch (e: Exception) {
                android.util.Log.w("LiveDiscussionsTest", "Could not click Discussions tab: ${e.message}")
            }
        }

        composeTestRule.waitForIdle()
        Thread.sleep(2000)

        // Verify we're on the discussions screen
        assert(checkText("Discussions", maxRetries = 6)) {
            "Failed: Did not navigate to Discussions screen"
        }

        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        android.util.Log.d("LiveDiscussionsTest", "✓ Successfully navigated to discussions screen")
    }

    @Before
    override fun setup() {
        // Set auth token for User A
        val userAToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        RetrofitClient.setAuthToken(userAToken)

        android.util.Log.d("LiveDiscussionsTest", "User A token set. Backend URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")

        super.setup()
        navigateFromMainScreenToDiscussionsScreen()
    }

    private fun printCreateDiscussionInstructions(expectedTopic: String) {
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "═══════════════════════════════════════════════════════════════")
        android.util.Log.e("LiveDiscussionsTest", "🔔 MANUAL TESTER (User B) - ACTION REQUIRED")
        android.util.Log.e("LiveDiscussionsTest", "═══════════════════════════════════════════════════════════════")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "📱 On your device (User B), perform these steps NOW:")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "1. Navigate to Community Discussions screen")
        android.util.Log.e("LiveDiscussionsTest", "2. Click the 'Create Discussion' button (+ icon)")
        android.util.Log.e("LiveDiscussionsTest", "3. Enter topic: $expectedTopic")
        android.util.Log.e("LiveDiscussionsTest", "4. Enter description: Testing real-time updates")
        android.util.Log.e("LiveDiscussionsTest", "5. Click 'Create Discussion' to submit")
        android.util.Log.e("LiveDiscussionsTest", "6. Wait for confirmation that discussion was created")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "⏱️  User A will wait up to 60 seconds for the discussion to appear")
        android.util.Log.e("LiveDiscussionsTest", "═══════════════════════════════════════════════════════════════")
        android.util.Log.e("LiveDiscussionsTest", "")
    }

    private fun waitForDiscussionToAppear(expectedTopic: String): Boolean {
        android.util.Log.d("LiveDiscussionsTest", "User A: Waiting for new discussion to appear...")
        return check(maxRetries = 60, retryDelayMs = 2000) {
            try {
                composeTestRule.waitForIdle()
                val nodes = composeTestRule.onAllNodes(hasText(expectedTopic, substring = true))
                    .fetchSemanticsNodes(false)
                if (nodes.isNotEmpty()) {
                    android.util.Log.d("LiveDiscussionsTest", "✓ Discussion found in list!")
                    true
                } else {
                    android.util.Log.d("LiveDiscussionsTest", "Waiting... (checking again in 2 seconds)")
                    false
                }
            } catch (e: Exception) {
                android.util.Log.d("LiveDiscussionsTest", "Check failed: ${e.message}")
                false
            }
        }
    }

    @Test
    fun liveUpdate_CreateDiscussion_AppearsToOtherUsers() {
        android.util.Log.d("LiveDiscussionsTest", "=== LIVE UPDATE TEST: Create Discussion ===")
        val timestamp = System.currentTimeMillis()
        val expectedTopic = "Live Test Discussion $timestamp"
        android.util.Log.d("LiveDiscussionsTest", "User A: Waiting on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: User A not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        printCreateDiscussionInstructions(expectedTopic)
        val discussionAppeared = waitForDiscussionToAppear(expectedTopic)
        assert(discussionAppeared) {
            "Failed: Live update did not occur - Discussion '$expectedTopic' did not appear on User A's screen within 60 seconds. " +
                    "Verify: (1) User B successfully created the discussion, (2) Backend is properly sending live updates, " +
                    "(3) Frontend is properly receiving and displaying live updates."
        }

        android.util.Log.d("LiveDiscussionsTest", "✓ SUCCESS: New discussion appeared in real-time on User A's device!")

        // Verify we can click on the new discussion
        android.util.Log.d("LiveDiscussionsTest", "Verifying discussion is interactive...")
        val clicked = checkTextAndClick(expectedTopic, substring = true, maxRetries = 3)

        if (clicked) {
            android.util.Log.d("LiveDiscussionsTest", "✓ Successfully clicked on the new discussion")
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        }

        android.util.Log.d("LiveDiscussionsTest", "✓ LIVE UPDATE TEST PASSED: Discussion creation synced successfully")
    }


    private fun printRapidMessagesInstructions(
        discussionTopic: String,
        message1: String,
        message2: String,
        message3: String
    ) {
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "╔═════════════════════════════════════════════════════════════════╗")
        android.util.Log.e("LiveDiscussionsTest", "║                                                                 ║")
        android.util.Log.e("LiveDiscussionsTest", "║     🔔 MANUAL TESTER (User B) - ACTION REQUIRED NOW!          ║")
        android.util.Log.e("LiveDiscussionsTest", "║                                                                 ║")
        android.util.Log.e("LiveDiscussionsTest", "╚═════════════════════════════════════════════════════════════════╝")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "📋 TEST: Rapid Multiple Messages - Live Update")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "⚠️  This test has TWO parts: Create discussion, then post 3 messages")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")
        android.util.Log.e("LiveDiscussionsTest", "┃  📋 PART 1: CREATE DISCUSSION WITH THIS TOPIC:                 ┃")
        android.util.Log.e("LiveDiscussionsTest", "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "    >>> $discussionTopic <<<")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")
        android.util.Log.e("LiveDiscussionsTest", "┃  📋 PART 2: AFTER CREATING, POST THESE 3 MESSAGES RAPIDLY:    ┃")
        android.util.Log.e("LiveDiscussionsTest", "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "  Message 1:")
        android.util.Log.e("LiveDiscussionsTest", "    >>> $message1 <<<")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "  Message 2:")
        android.util.Log.e("LiveDiscussionsTest", "    >>> $message2 <<<")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "  Message 3:")
        android.util.Log.e("LiveDiscussionsTest", "    >>> $message3 <<<")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "📱 DETAILED STEPS:")
        android.util.Log.e("LiveDiscussionsTest", "   1. Click 'Create Discussion' button")
        android.util.Log.e("LiveDiscussionsTest", "   2. PASTE the discussion topic shown above")
        android.util.Log.e("LiveDiscussionsTest", "   3. Add any description (required)")
        android.util.Log.e("LiveDiscussionsTest", "   4. Click 'Create Discussion'")
        android.util.Log.e("LiveDiscussionsTest", "   5. Wait for discussion to be created and opened")
        android.util.Log.e("LiveDiscussionsTest", "   6. IMMEDIATELY paste and send Message 1")
        android.util.Log.e("LiveDiscussionsTest", "   7. IMMEDIATELY paste and send Message 2")
        android.util.Log.e("LiveDiscussionsTest", "   8. IMMEDIATELY paste and send Message 3")
        android.util.Log.e("LiveDiscussionsTest", "   9. Send all 3 messages as FAST as possible!")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "⏱️  User A will wait up to 2 minutes for discussion + messages")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "═══════════════════════════════════════════════════════════════════")
        android.util.Log.e("LiveDiscussionsTest", "")
    }

    private fun waitForDiscussionAndOpen(discussionTopic: String) {
        android.util.Log.d("LiveDiscussionsTest", "User A: Waiting for discussion '$discussionTopic' to appear in list...")
        val discussionAppeared = check(maxRetries = 40, retryDelayMs = 2000) {
            try {
                composeTestRule.waitForIdle()
                composeTestRule.onAllNodes(hasText(discussionTopic, substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        assert(discussionAppeared) {
            "Failed: Discussion '$discussionTopic' did not appear in list. User B may not have created it yet."
        }
        android.util.Log.e("LiveDiscussionsTest", "✅ Discussion appeared in list!")
        android.util.Log.d("LiveDiscussionsTest", "User A: Opening the new discussion...")
        val clicked = checkTextAndClick(discussionTopic, substring = true, maxRetries = 3)
        assert(clicked) { "Failed: Could not click on the new discussion" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
    }

    private fun waitForMessage(message: String, messageNumber: Int, maxRetries: Int = 20): Boolean {
        android.util.Log.d("LiveDiscussionsTest", "User A: Waiting for message $messageNumber...")
        val appeared = check(maxRetries = maxRetries, retryDelayMs = 2000) {
            try {
                composeTestRule.waitForIdle()
                composeTestRule.onAllNodes(hasText(message, substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        if (appeared) {
            android.util.Log.e("LiveDiscussionsTest", "✅ Message $messageNumber appeared!")
        }
        return appeared
    }

    @Test
    fun liveUpdate_RapidMessages_AllAppearToOtherUsers() {
        android.util.Log.d("LiveDiscussionsTest", "=== LIVE UPDATE TEST: Rapid Multiple Messages ===")
        val timestamp = System.currentTimeMillis()
        val discussionTopic = "Rapid Test Discussion $timestamp"
        val message1 = "Rapid message 1 $timestamp"
        val message2 = "Rapid message 2 $timestamp"
        val message3 = "Rapid message 3 $timestamp"
        android.util.Log.d("LiveDiscussionsTest", "User A: Waiting on discussions list...")
        assert(checkText("Community Discussions", maxRetries = 6)) {
            "Failed: User A not on Community Discussions screen"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        printRapidMessagesInstructions(discussionTopic, message1, message2, message3)
        waitForDiscussionAndOpen(discussionTopic)
        android.util.Log.d("LiveDiscussionsTest", "User A: Now in discussion, waiting for message 1...")
        assert(waitForMessage(message1, 1, 30)) { "Failed: Message 1 did not appear" }
        assert(waitForMessage(message2, 2)) { "Failed: Message 2 did not appear" }
        assert(waitForMessage(message3, 3)) { "Failed: Message 3 did not appear" }
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.e("LiveDiscussionsTest", "╔═══════════════════════════════════════════════════════════╗")
        android.util.Log.e("LiveDiscussionsTest", "║  ✅ SUCCESS! All 3 messages appeared in real-time!       ║")
        android.util.Log.e("LiveDiscussionsTest", "╚═══════════════════════════════════════════════════════════╝")
        android.util.Log.e("LiveDiscussionsTest", "")
        android.util.Log.d("LiveDiscussionsTest", "✓ LIVE UPDATE TEST PASSED: Rapid messages synced successfully")
    }

}