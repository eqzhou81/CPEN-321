package com.cpen321.usermanagement.util

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import com.cpen321.usermanagement.MainActivity
import org.junit.Before
import org.junit.Rule

/**
 * Base test class with common utilities for E2E tests
 * Provides Compose testing rules, UI Automator helpers, and common assertions
 */
abstract class BaseComposeTest {
    
    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()
    
    protected lateinit var device: UiDevice
    
    @Before
    open fun setup() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        
        // IMPORTANT: For E2E tests to work, backend must be running locally
        // Backend should be accessible at:
        // - Emulator: http://10.0.2.2:3000/api/ (STAGING_BASE_URL)
        // - Physical device: http://<your-local-ip>:3000/api/
        // 
        // Before running tests:
        // 1. cd backend && npm test (team requirement)
        // 2. cd backend && npm start (or npm run dev)
        // 3. Verify backend is running: curl http://localhost:3000/api/health (if endpoint exists)
        
        android.util.Log.d("BaseComposeTest", "Setting up test...")
        android.util.Log.d("BaseComposeTest", "STAGING_BASE_URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")
        android.util.Log.d("BaseComposeTest", "API_BASE_URL: ${com.cpen321.usermanagement.BuildConfig.API_BASE_URL}")
        android.util.Log.d("BaseComposeTest", "AUTH_BYPASS_ENABLED: ${com.cpen321.usermanagement.BuildConfig.AUTH_BYPASS_ENABLED}")
        
        // Wait for app to be fully ready - give time for navigation and auth check
        // With AUTH_BYPASS_ENABLED, the app should navigate from AUTH to MAIN
        // This also waits for initial backend calls (getCurrentUser, etc.) to complete
        waitForAppToBeReady()
    }
    
    /**
     * Wait for the app to be fully ready before running tests
     * Ensures navigation and auth check are complete
     * Extended timeout for backend connection (especially for unmocked E2E tests)
     * 
     * IMPORTANT: This waits for backend calls to complete. If backend is not running,
     * this will timeout after 90 seconds.
     */
    private fun waitForAppToBeReady() {
        android.util.Log.d("BaseComposeTest", "Waiting for app to be ready...")
        
        // Wait for either main screen or loading to complete
        // Extended timeout to 90 seconds to account for backend connection delays
        // If backend is not running, this will timeout and tests will fail with clear error
        val startTime = System.currentTimeMillis()
        
        try {
            composeTestRule.waitUntil(timeoutMillis = 90000) {
                try {
                    // Try to find main screen elements
                    val hasJobApplications = composeTestRule.onAllNodes(hasText("My Job Applications", substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                    val hasDiscussions = composeTestRule.onAllNodes(hasText("Community Discussions", substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                    // Or check if we're past the loading/auth screen (no "Sign in" text)
                    val pastAuthScreen = !composeTestRule.onAllNodes(hasText("Sign in", substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                    
                    val isReady = hasJobApplications || hasDiscussions || pastAuthScreen
                    
                    if (isReady) {
                        val elapsed = (System.currentTimeMillis() - startTime) / 1000
                        android.util.Log.d("BaseComposeTest", "App ready after ${elapsed}s")
                    } else {
                        // Log progress every 10 seconds
                        val elapsed = (System.currentTimeMillis() - startTime) / 1000
                        if (elapsed % 10 == 0L && elapsed > 0) {
                            android.util.Log.d("BaseComposeTest", "Still waiting for app... (${elapsed}s)")
                        }
                    }
                    
                    isReady
                } catch (e: Exception) {
                    android.util.Log.w("BaseComposeTest", "Error checking app state: ${e.message}")
                    false
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("BaseComposeTest", 
                "App failed to become ready after 90 seconds. " +
                "This usually means: " +
                "1. Backend is not running (start with: cd backend && npm start) " +
                "2. Backend is not accessible at ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL} " +
                "3. Network connectivity issues " +
                "4. Backend is taking too long to respond. " +
                "Check backend logs for errors. Exception: ${e.message}")
        }
        
        // Wait for Compose to be idle (all recompositions complete)
        composeTestRule.waitForIdle()
        // Additional delay to ensure UI is fully rendered and backend calls complete
        Thread.sleep(3000)
        
        android.util.Log.d("BaseComposeTest", "App setup complete. Ready for tests.")
    }
    
    /**
     * Wait for a node with the given tag to appear
     */
    protected fun waitForNodeWithTag(tag: String, timeoutMillis: Long = 5000) {
        composeTestRule.waitUntil(timeoutMillis) {
            composeTestRule.onAllNodes(hasTestTag(tag)).fetchSemanticsNodes().isNotEmpty()
        }
    }
    
    /**
     * Wait for text to appear (supports substring matching via hasText matcher)
     */
    protected fun waitForText(text: String, substring: Boolean = true, timeoutMillis: Long = 10000) {
        composeTestRule.waitUntil(timeoutMillis) {
            try {
                if (substring) {
                    // Use hasText with substring matching
                    composeTestRule.onAllNodes(hasText(text, substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                } else {
                    // Exact match
                    composeTestRule.onNodeWithText(text).assertExists()
                    true
                }
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500) // Additional delay after text appears
    }
    
    /**
     * Helper to get node with text (supports substring)
     * Usage: getNodeWithText("text", substring = true)
     * 
     * Note: When used inside waitUntil, don't call waitForText first as it will
     * create nested timeouts. Instead, use try-catch with the node directly.
     */
    protected fun getNodeWithText(text: String, substring: Boolean = true, waitForNode: Boolean = true): SemanticsNodeInteraction {
        // Only wait if explicitly requested (default true for backward compatibility)
        // When used inside waitUntil, set waitForNode=false to avoid nested timeouts
        if (waitForNode) {
            waitForText(text, substring, timeoutMillis = 15000)
        }
        
        // Small delay to ensure node is ready
        composeTestRule.waitForIdle()
        Thread.sleep(300)
        
        return if (substring) {
            // For substring matching, use onAllNodes and get first node
            // Note: This may throw if no nodes found, which is expected behavior
            composeTestRule.onAllNodes(hasText(text, substring = true))
                .onFirst()
        } else {
            composeTestRule.onNodeWithText(text)
        }
    }
    
    /**
     * Helper to find node by tag
     */
    protected fun findNodeByTag(tag: String): SemanticsNodeInteraction {
        return composeTestRule.onNodeWithTag(tag)
    }
    
    /**
     * Helper to find node by text
     */
    protected fun findNodeByText(text: String): SemanticsNodeInteraction {
        return composeTestRule.onNodeWithText(text)
    }
    
    /**
     * Helper to find node by content description
     */
    protected fun findNodeByContentDescription(description: String): SemanticsNodeInteraction {
        return composeTestRule.onNodeWithContentDescription(description)
    }
    
    /**
     * Assert that a button with given text is enabled
     */
    protected fun assertButtonEnabled(text: String) {
        composeTestRule.onNodeWithText(text)
            .assertIsEnabled()
            .assertIsDisplayed()
    }
    
    /**
     * Assert that a button with given text is disabled
     */
    protected fun assertButtonDisabled(text: String) {
        composeTestRule.onNodeWithText(text)
            .assertIsNotEnabled()
            .assertIsDisplayed()
    }
    
    /**
     * Click on a button by text
     * Includes safety checks to ensure button is ready for interaction
     */
    protected fun clickButton(text: String, waitForEnabled: Boolean = true) {
        // Wait for button to be available
        waitForText(text, substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Get node and ensure it's ready
        val button = getNodeWithText(text, substring = true)
        
        // Wait for button to be enabled and displayed
        composeTestRule.waitUntil(timeoutMillis = 20000) {
            try {
                button.assertExists()
                button.assertIsDisplayed()
                if (waitForEnabled) {
                    button.assertIsEnabled()
                }
                true
            } catch (e: Exception) {
                false
            }
        }
        
        composeTestRule.waitForIdle()
        Thread.sleep(1000) // Increased delay before clicking
        
        if (waitForEnabled) {
            button.assertIsEnabled()
        }
        button.performClick()
        composeTestRule.waitForIdle()
        Thread.sleep(1000) // Delay after clicking
    }
    
    /**
     * Click on a node by tag
     * Includes safety checks to ensure node is ready for interaction
     */
    protected fun clickNodeByTag(tag: String) {
        // Wait for node to be available
        composeTestRule.waitUntil(timeoutMillis = 20000) {
            try {
                composeTestRule.onNodeWithTag(tag)
                    .assertExists()
                    .assertIsDisplayed()
                    .assertIsEnabled()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        composeTestRule.onNodeWithTag(tag)
            .assertIsEnabled()
            .performClick()
        
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
    }
    
    /**
     * Type text into a node with tag
     */
    protected fun typeText(tag: String, text: String) {
        composeTestRule.onNodeWithTag(tag)
            .performTextInput(text)
    }
    
    /**
     * Wait for UI Automator element to appear
     */
    protected fun waitForUiAutomatorElement(selector: UiSelector, timeout: Long = 5000) {
        val startTime = System.currentTimeMillis()
        while (System.currentTimeMillis() - startTime < timeout) {
            if (device.findObject(selector).exists()) {
                return
            }
            Thread.sleep(100)
        }
    }
    
    /**
     * Open Settings app using UI Automator
     */
    protected fun openSettings() {
        device.executeShellCommand("am start -a android.settings.SETTINGS")
        Thread.sleep(1000)
    }
    
    /**
     * Press back button using UI Automator
     */
    protected fun pressBack() {
        device.pressBack()
        Thread.sleep(500)
    }
    
    /**
     * Return to app from another app
     */
    protected fun returnToApp() {
        // Try multiple strategies to return to app
        try {
            // Strategy 1: Use recent apps
            device.pressRecentApps()
            Thread.sleep(1000)
            
            // Look for app in recent apps (try different possible names)
            val appSelectors = listOf(
                UiSelector().text("UserManagement"),
                UiSelector().text("User Management"),
                UiSelector().description("UserManagement"),
                UiSelector().packageName("com.cpen321.usermanagement")
            )
            
            var found = false
            for (selector in appSelectors) {
                val appObject = device.findObject(selector)
                if (appObject.exists()) {
                    appObject.click()
                    found = true
                    break
                }
            }
            
            if (found) {
                Thread.sleep(2000)
                composeTestRule.waitForIdle()
                return
            }
        } catch (e: Exception) {
            android.util.Log.d("BaseComposeTest", "Recent apps strategy failed: ${e.message}")
        }
        
        // Strategy 2: Fallback - launch app directly
        try {
            device.pressHome()
            Thread.sleep(1000)
            device.executeShellCommand("am start -n com.cpen321.usermanagement/.MainActivity")
            Thread.sleep(2000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.e("BaseComposeTest", "Failed to return to app: ${e.message}", e)
            throw e
        }
    }
    
    /**
     * Check if text appears in snackbar
     */
    protected fun assertSnackbarText(text: String) {
        composeTestRule.waitUntil(timeoutMillis = 3000) {
            composeTestRule.onAllNodes(hasText(text)).fetchSemanticsNodes().isNotEmpty()
        }
        composeTestRule.onNodeWithText(text).assertIsDisplayed()
    }
    
    /**
     * Check if error message is displayed
     * Tries multiple strategies to find error text
     */
    protected fun assertErrorDisplayed(errorText: String) {
        // Try substring matching first (most flexible)
        try {
            composeTestRule.onAllNodes(hasText(errorText, substring = true))
                .onFirst()
                .assertIsDisplayed()
        } catch (e: Exception) {
            // Fallback to exact match
            composeTestRule.onNodeWithText(errorText)
                .assertIsDisplayed()
        }
    }
}

