package com.cpen321.usermanagement.util

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import com.cpen321.usermanagement.MainActivity
import org.junit.Before
import org.junit.Rule

/**
 * Base test class with common utilities for E2E tests
 * Provides Compose testing rules and deterministic wait helpers
 * 
 * IMPORTANT: The app must set a test tag "app_ready" when initial data is loaded.
 * This tag should be set in the main screen composable after auth + initial fetch completes.
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
        
        // Wait for app to be fully ready using deterministic tag-based check
        waitForAppReady()
    }
    
    /**
     * Wait for the app to be fully ready before running tests
     * First tries to find "app_ready" test tag, then falls back to text-based detection
     * 
     * IMPORTANT: For best results, add Modifier.testTag("app_ready") on the main screen
     * once all initial data is loaded. Otherwise, this falls back to text-based detection.
     */
    protected fun waitForAppReady(timeoutMs: Long = 90_000) {
        android.util.Log.d("BaseComposeTest", "Waiting for app to be ready...")
        
        // First try tag-based detection (preferred) - short timeout
        val readyByTag = try {
            waitUntilExists(hasTestTag("app_ready"), timeoutMs = 5000)
        } catch (e: Exception) {
            android.util.Log.d("BaseComposeTest", "app_ready tag not found, will try text fallback")
            false
        }
        
        if (readyByTag) {
            composeTestRule.waitForIdle()
            android.util.Log.d("BaseComposeTest", "App ready - app_ready tag found")
            return
        }
        
        // Fallback to text-based detection (for backward compatibility)
        android.util.Log.d("BaseComposeTest", "app_ready tag not found, using text-based detection...")
        
        // Try multiple text patterns with shorter timeouts
        val remainingTimeout = timeoutMs - 5000
        val ready = try {
            // Try "My Job Applications" first (most specific)
            waitUntilExists(hasText("My Job Applications", substring = true), timeoutMs = remainingTimeout / 3) ||
            // Try "Community Discussions" 
            waitUntilExists(hasText("Community Discussions", substring = true), timeoutMs = remainingTimeout / 3) ||
            // Try any job-related text (more flexible)
            waitUntilExists(
                hasText("Job", substring = true)
                    .or(hasText("Applications", substring = true))
                    .or(hasText("Add Job", substring = true)),
                timeoutMs = remainingTimeout / 3
            )
        } catch (e: Exception) {
            android.util.Log.e("BaseComposeTest", "Text-based detection also failed: ${e.message}")
            false
        }
        
        if (!ready) {
            android.util.Log.e("BaseComposeTest", 
                "App failed to become ready after ${timeoutMs}ms. " +
                "This usually means: " +
                "1. Backend is not running (start with: cd backend && npm start) " +
                "2. Backend is not accessible at ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL} " +
                "3. Network connectivity issues " +
                "4. Backend is taking too long to respond " +
                "5. App is not setting 'app_ready' test tag when ready. " +
                "Check backend logs for errors.")
            printSemanticsTree("APP_NOT_READY")
            // Print what's actually on screen to help debug
            android.util.Log.e("BaseComposeTest", "Printing current screen state for debugging...")
            throw AssertionError("App not ready after ${timeoutMs}ms. Check backend is running and accessible. See logcat for screen state.")
        }
        
        composeTestRule.waitForIdle()
        android.util.Log.d("BaseComposeTest", "App ready - detected via text fallback")
    }
    
    /**
     * Wait until a node matching the matcher exists
     * Deterministic wait that doesn't rely on fixed delays
     * @return true if found within timeout, throws exception if timeout
     */
    protected fun waitUntilExists(
        matcher: SemanticsMatcher,
        timeoutMs: Long = 60_000
    ): Boolean {
        return try {
            composeTestRule.waitUntil(timeoutMs) {
                try {
                    composeTestRule.onAllNodes(matcher).fetchSemanticsNodes(false).isNotEmpty()
                } catch (_: Throwable) {
                    false
                }
            }
            true
        } catch (e: Throwable) {
            // waitUntil throws when timeout occurs - this is expected
            if (e.message?.contains("timeout") == true || e.message?.contains("Timeout") == true) {
                android.util.Log.d("BaseComposeTest", "waitUntilExists timed out after ${timeoutMs}ms")
            } else {
                android.util.Log.w("BaseComposeTest", "waitUntilExists failed: ${e.message}")
            }
            false
        }
    }
    
    /**
     * Wait until a node matching the matcher is visible (displayed)
     * More strict than waitUntilExists - ensures node is actually visible
     */
    protected fun waitUntilVisible(
        matcher: SemanticsMatcher,
        timeoutMs: Long = 60_000
    ): Unit {
        composeTestRule.waitUntil(timeoutMs) {
            try {
                val nodes = composeTestRule.onAllNodes(matcher).fetchSemanticsNodes(false)
                if (nodes.isEmpty()) {
                    false
                } else {
                    // Try to assert the first node is displayed
                    try {
                        composeTestRule.onAllNodes(matcher).onFirst().assertIsDisplayed()
                        true
                    } catch (_: Throwable) {
                        false
                    }
                }
            } catch (_: Throwable) {
                false
            }
        }
    }
    
    /**
     * Click on a node by tag with scrolling support
     * Ensures node exists, is visible, and optionally enabled before clicking
     */
    protected fun clickByTag(
        tag: String,
        waitEnabled: Boolean = true,
        timeoutMs: Long = 60_000
    ) {
        waitUntilExists(hasTestTag(tag), timeoutMs)
        
        // Scroll into view if inside a scrollable container
        try {
            composeTestRule.onNode(hasScrollToNodeAction())
                .performScrollToNode(hasTestTag(tag))
        } catch (_: Throwable) {
            // Not in a scrollable container, or already visible - continue
        }
        
        val node = composeTestRule.onNodeWithTag(tag)
        
        // Wait for node to be visible and optionally enabled
        if (waitEnabled) {
            composeTestRule.waitUntil(timeoutMs) {
                try {
                    node.assertIsDisplayed()
                    node.assertIsEnabled()
                    true
                } catch (_: Throwable) {
                    false
                }
            }
        } else {
            composeTestRule.waitUntil(timeoutMs) {
                try {
                    node.assertIsDisplayed()
                    true
                } catch (_: Throwable) {
                    false
                }
            }
        }
        
        node.performClick()
        composeTestRule.waitForIdle()
    }
    
    /**
     * Type text into a node by tag with scrolling support
     * Waits for node to exist, scrolls if needed, optionally clears, then types
     */
    protected fun typeIntoTag(
        tag: String,
        text: String,
        clear: Boolean = false,
        timeoutMs: Long = 60_000
    ) {
        waitUntilExists(hasTestTag(tag), timeoutMs)
        
        val node = composeTestRule.onNodeWithTag(tag)
        
        // Try scrolling into view
        try {
            composeTestRule.onNode(hasScrollToNodeAction())
                .performScrollToNode(hasTestTag(tag))
        } catch (_: Throwable) {
            // Not in a scrollable container - continue
        }
        
        // Wait for node to be visible
        composeTestRule.waitUntil(timeoutMs) {
            try {
                node.assertIsDisplayed()
                true
            } catch (_: Throwable) {
                false
            }
        }
        
        if (clear) {
            try {
                node.performTextClearance()
            } catch (_: Throwable) {
                // Text clearance not supported - continue
            }
        }
        
        node.performTextInput(text)
        composeTestRule.waitForIdle()
    }
    
    /**
     * Get count of list items by tag
     * If listTag is the container, counts children tagged "job_list_item" (or similar)
     */
    protected fun listItemCount(listTag: String): Int {
        return composeTestRule.onAllNodes(hasTestTag(listTag)).fetchSemanticsNodes(false).let {
            // If listTag is the container, count children tagged "job_list_item"
            composeTestRule.onAllNodes(hasTestTag("job_list_item")).fetchSemanticsNodes(false).size
        }
    }
    
    /**
     * Assert snackbar text appears (with longer timeout for real backend)
     * Prefers container tag if available, otherwise searches for text
     */
    protected fun assertSnackbar(
        textContains: String,
        timeoutMs: Long = 10_000
    ) {
        // Prefer a snackbar container tag if you have one
        // e.g., onNodeWithTag("snackbar_host").assert(hasAnyDescendant(hasText(...)))
        // For now, search for text directly
        composeTestRule.waitUntil(timeoutMs) {
            try {
                composeTestRule.onAllNodes(hasText(textContains, substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (_: Throwable) {
                false
            }
        }
        composeTestRule.onAllNodes(hasText(textContains, substring = true))
            .onFirst()
            .assertIsDisplayed()
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
    
    /**
     * Print semantics tree for debugging
     * Useful when tests fail to see what's actually on screen
     */
    protected fun printSemanticsTree(tag: String = "SEMANTICS") {
        try {
            composeTestRule.onRoot().printToLog(tag)
        } catch (e: Exception) {
            android.util.Log.w("BaseComposeTest", "Failed to print semantics tree: ${e.message}")
        }
    }
    
    /**
     * Wait until count of nodes matching the matcher equals expected count
     */
    protected fun waitUntilCount(
        matcher: SemanticsMatcher,
        expected: Int,
        timeoutMs: Long = 30_000
    ): Boolean {
        return try {
            composeTestRule.waitUntil(timeoutMs) {
                try {
                    composeTestRule.onAllNodes(matcher).fetchSemanticsNodes(false).size == expected
                } catch (_: Throwable) {
                    false
                }
            }
            true
        } catch (e: Exception) {
            android.util.Log.w("BaseComposeTest", "waitUntilCount failed: ${e.message}")
            false
        }
    }
    
    /**
     * Wait until count of nodes matching the matcher is at least minCount
     */
    protected fun waitUntilAtLeast(
        matcher: SemanticsMatcher,
        minCount: Int,
        timeoutMs: Long = 30_000
    ): Boolean {
        return try {
            composeTestRule.waitUntil(timeoutMs) {
                try {
                    composeTestRule.onAllNodes(matcher).fetchSemanticsNodes(false).size >= minCount
                } catch (_: Throwable) {
                    false
                }
            }
            true
        } catch (e: Exception) {
            android.util.Log.w("BaseComposeTest", "waitUntilAtLeast failed: ${e.message}")
            false
        }
    }
    
    // ============================================================================
    // Legacy helpers - kept for backward compatibility but should be migrated
    // ============================================================================
    
    /**
     * Wait for text to appear (supports substring matching)
     * @deprecated Use waitUntilExists(hasText(...)) instead
     */
    @Deprecated("Use waitUntilExists(hasText(...)) for deterministic waits")
    protected fun waitForText(text: String, substring: Boolean = true, timeoutMillis: Long = 10_000) {
        waitUntilExists(hasText(text, substring = substring), timeoutMs = timeoutMillis)
        composeTestRule.waitForIdle()
    }
    
    /**
     * Get node with text (supports substring)
     * @deprecated Use waitUntilExists() + onNodeWithText() or onAllNodes(hasText(...)).onFirst()
     */
    @Deprecated("Use waitUntilExists() + onNodeWithText() or onAllNodes(hasText(...)).onFirst()")
    protected fun getNodeWithText(text: String, substring: Boolean = true, waitForNode: Boolean = true): SemanticsNodeInteraction {
        if (waitForNode) {
            waitUntilExists(hasText(text, substring = substring), timeoutMs = 15_000)
        }
        composeTestRule.waitForIdle()
        
        return if (substring) {
            composeTestRule.onAllNodes(hasText(text, substring = true)).onFirst()
        } else {
            composeTestRule.onNodeWithText(text)
        }
    }
    
    /**
     * Check function with retry logic
     * @deprecated Use waitUntilExists() instead for deterministic waits
     */
    @Deprecated("Use waitUntilExists() for deterministic waits instead of retry loops")
    protected fun check(
        maxRetries: Int = 3,
        retryDelayMs: Long = 5000,
        checkFunction: () -> Boolean
    ): Boolean {
        var attempt = 0
        while (attempt < maxRetries) {
            try {
                composeTestRule.waitForIdle()
                if (checkFunction()) {
                    android.util.Log.d("BaseComposeTest", "✓ Check passed on attempt ${attempt + 1}")
                    return true
                }
            } catch (e: Exception) {
                android.util.Log.d("BaseComposeTest", "Check failed on attempt ${attempt + 1}: ${e.message}")
            }
            
            attempt++
            if (attempt < maxRetries) {
                android.util.Log.d("BaseComposeTest", "Retrying check in ${retryDelayMs}ms... (attempt ${attempt + 1}/$maxRetries)")
                Thread.sleep(retryDelayMs)
            }
        }
        
        android.util.Log.w("BaseComposeTest", "✗ Check failed after $maxRetries attempts")
        return false
    }
    
    /**
     * Check for text on screen with retry logic
     * @deprecated Use waitUntilExists(hasText(...)) instead
     */
    @Deprecated("Use waitUntilExists(hasText(...)) for deterministic waits")
    protected fun checkText(
        text: String,
        substring: Boolean = true,
        maxRetries: Int = 3
    ): Boolean {
        return check(maxRetries = maxRetries) {
            try {
                if (substring) {
                    composeTestRule.onAllNodes(hasText(text, substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                } else {
                    composeTestRule.onNodeWithText(text).assertExists()
                    true
                }
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Check for element with test tag with retry logic
     * @deprecated Use waitUntilExists(hasTestTag(...)) instead
     */
    @Deprecated("Use waitUntilExists(hasTestTag(...)) for deterministic waits")
    protected fun checkTag(
        tag: String,
        maxRetries: Int = 3
    ): Boolean {
        return check(maxRetries = maxRetries) {
            try {
                composeTestRule.onNodeWithTag(tag).assertExists()
                true
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Check for text and click it with retry logic
     * @deprecated Use clickByTag() with test tags, or waitUntilExists() + performClick()
     */
    @Deprecated("Use clickByTag() with test tags, or waitUntilExists() + performClick()")
    protected fun checkTextAndClick(
        text: String,
        substring: Boolean = true,
        maxRetries: Int = 3
    ): Boolean {
        return try {
            // Wait for element to exist (with timeout handling)
            val exists = waitUntilExists(hasText(text, substring = substring), timeoutMs = 10_000)
            if (!exists) {
                android.util.Log.d("BaseComposeTest", "Text '$text' not found for clicking")
                return false
            }
            
            // Try scrolling if in scrollable
            try {
                composeTestRule.onNode(hasScrollToNodeAction())
                    .performScrollToNode(hasText(text, substring = substring))
            } catch (_: Throwable) {}
            
            val node = if (substring) {
                composeTestRule.onAllNodes(hasText(text, substring = true)).onFirst()
            } else {
                composeTestRule.onNodeWithText(text)
            }
            
            // Wait for node to be displayed and enabled (with timeout handling)
            try {
                composeTestRule.waitUntil(5_000) {
                    try {
                        node.assertIsDisplayed()
                        node.assertIsEnabled()
                        true
                    } catch (_: Throwable) {
                        false
                    }
                }
            } catch (e: Throwable) {
                android.util.Log.d("BaseComposeTest", "Node not ready for clicking: ${e.message}")
                return false
            }
            
            node.performClick()
            composeTestRule.waitForIdle()
            true
        } catch (e: Throwable) {
            android.util.Log.w("BaseComposeTest", "checkTextAndClick failed: ${e.message}")
            false
        }
    }
    
    /**
     * Check for tag and click it with retry logic
     * @deprecated Use clickByTag() instead
     */
    @Deprecated("Use clickByTag() instead")
    protected fun checkTagAndClick(
        tag: String,
        maxRetries: Int = 3
    ): Boolean {
        return try {
            clickByTag(tag, waitEnabled = true, timeoutMs = 30_000)
            true
        } catch (e: Exception) {
            android.util.Log.w("BaseComposeTest", "checkTagAndClick failed: ${e.message}")
            false
        }
    }
    
    /**
     * Check for element and click it with retry logic
     * @deprecated Use clickByTag() or waitUntilExists() + performClick() instead
     */
    @Deprecated("Use clickByTag() or waitUntilExists() + performClick() instead")
    protected fun checkAndClick(
        maxRetries: Int = 3,
        checkFunction: () -> SemanticsNodeInteraction?
    ): Boolean {
        var attempt = 0
        while (attempt < maxRetries) {
            try {
                composeTestRule.waitForIdle()
                val node = checkFunction()
                if (node != null) {
                    node.performClick()
                    android.util.Log.d("BaseComposeTest", "✓ Clicked element on attempt ${attempt + 1}")
                    composeTestRule.waitForIdle()
                    return true
                }
            } catch (e: Exception) {
                android.util.Log.d("BaseComposeTest", "Click failed on attempt ${attempt + 1}: ${e.message}")
            }
            
            attempt++
            if (attempt < maxRetries) {
                android.util.Log.d("BaseComposeTest", "Retrying click in 5000ms... (attempt ${attempt + 1}/$maxRetries)")
                Thread.sleep(5000)
            }
        }
        
        android.util.Log.w("BaseComposeTest", "✗ Click failed after $maxRetries attempts")
        return false
    }
    
    // ============================================================================
    // UIAutomator helpers - use sparingly, only when Compose can't handle it
    // ============================================================================
    
    /**
     * Press back button using UI Automator
     * Use sparingly - prefer Compose navigation when possible
     */
    protected fun pressBack() {
        device.pressBack()
        composeTestRule.waitForIdle()
    }
    
    /**
     * Open Settings app using UI Automator
     * Use only for cross-app testing - can steal focus from Compose
     */
    protected fun openSettings() {
        device.executeShellCommand("am start -a android.settings.SETTINGS")
        composeTestRule.waitForIdle()
    }
    
    /**
     * Return to app from another app
     * Use only when absolutely necessary - can break Compose semantics
     */
    protected fun returnToApp() {
        // Try multiple strategies to return to app
        try {
            // Strategy 1: Use recent apps
            device.pressRecentApps()
            composeTestRule.waitForIdle()
            
            // Look for app in recent apps
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
                composeTestRule.waitForIdle()
                waitForAppReady(timeoutMs = 30_000) // Re-wait for app ready
                return
            }
        } catch (e: Exception) {
            android.util.Log.d("BaseComposeTest", "Recent apps strategy failed: ${e.message}")
        }
        
        // Strategy 2: Fallback - launch app directly
        try {
            device.pressHome()
            composeTestRule.waitForIdle()
            device.executeShellCommand("am start -n com.cpen321.usermanagement/.MainActivity")
            composeTestRule.waitForIdle()
            waitForAppReady(timeoutMs = 30_000) // Re-wait for app ready
        } catch (e: Exception) {
            android.util.Log.e("BaseComposeTest", "Failed to return to app: ${e.message}", e)
            throw e
        }
    }
}
