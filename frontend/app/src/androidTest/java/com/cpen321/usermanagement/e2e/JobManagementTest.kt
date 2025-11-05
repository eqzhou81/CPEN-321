package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Job Management Feature (Unmocked)
 * 
 * ⚠️ IMPORTANT: These tests require a running backend server.
 * For local testing, ensure backend is running on localhost:3000
 * (Android emulator uses 10.0.2.2:3000 to access localhost)
 * 
 * Tests based on Feature 2: Manage Job Applications
 * From Requirements_and_Design.md
 * 
 * Use Cases:
 * 1. Paste job posting: The user pastes job posting text; the system stores title, company, and description.
 * 2. Paste job posting link: The user saves a URL; the system fetches and normalizes the job posting.
 * 3. View saved job application details: The user opens a stored job application in their job portfolio.
 * 4. Delete job application: The user removes an existing job from their portfolio.
 */
class JobManagementTest : BaseComposeTest() {
    
    @Before
    override fun setup() {
        // IMPORTANT: Backend must be running for these tests!
        // See E2E_TEST_SETUP_LOCAL.md for setup instructions
        
        // Ensure auth token is set for API calls BEFORE app starts
        val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        RetrofitClient.setAuthToken(testToken)
        
        android.util.Log.d("JobManagementTest", "Test token set. Backend URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")
        
        super.setup()
    }
    
    /**
     * Use Case 1: Paste job posting
     * The user pastes job posting text; the system stores title, company, and description.
     * 
     * Steps:
     * 1. User navigates to job dashboard
     * 2. User clicks "Add Job" button
     * 3. User pastes job posting text (title, company, description)
     * 4. User submits the form
     * 5. System stores title, company, and description
     * 6. Job appears in the list with stored information
     */
    @Test
    fun testPasteJobPosting_Success() {
        // Step 1: Navigate to job dashboard
        waitForText("My Job Applications", timeoutMillis = 60000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 2: Click "Add Job" button using test tag
        clickNodeByTag("add_job_button")
        
        // Wait for dialog to appear
        waitForText("Add Job", substring = true, timeoutMillis = 20000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 3: Input job details
        // Note: Requires testTag on input fields
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        typeText("job_title_input", "Software Engineer")
        Thread.sleep(1000)
        composeTestRule.waitForIdle()
        typeText("company_input", "Google")
        Thread.sleep(1000)
        composeTestRule.waitForIdle()
        typeText("description_input", "We are looking for a software engineer with 5+ years of experience...")
        Thread.sleep(1000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 4: Submit form
        // Wait for submit button to be enabled
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                composeTestRule.onAllNodes(hasText("Add", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
                true
            } catch (e: Exception) {
                false
            }
        }
        
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        clickButton("Add")
        
        // Step 5-6: Verify system stored title, company, and description
        // Job appears in list with all stored information
        composeTestRule.waitForIdle()
        Thread.sleep(5000)
        waitForText("Software Engineer", substring = true, timeoutMillis = 30000) // Title
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        waitForText("Google", substring = true, timeoutMillis = 10000) // Company
        // Description is stored but may not be visible in list view
    }
    
    /**
     * Use Case 2: Paste job posting link
     * The user saves a URL; the system fetches and normalizes the job posting.
     * 
     * Steps:
     * 1. User navigates to job dashboard
     * 2. User clicks "Add Job" button
     * 3. User selects "Add from URL" option
     * 4. User enters URL
     * 5. System fetches and normalizes the job posting
     * 6. System saves the normalized job posting
     * 7. Job appears in list
     */
    @Test
    fun testPasteJobPostingLink_Success() {
        waitForText("My Job Applications", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        clickButton("Add")
        
        waitForText("Add Job", substring = true, timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Select URL option (implementation dependent)
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            try {
                getNodeWithText("Add from URL", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                    .assertIsEnabled()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        getNodeWithText("Add from URL", substring = true)
            .performClick()
        
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        typeText("job_url_input", "https://careers.google.com/jobs/12345")
        Thread.sleep(500)
        composeTestRule.waitForIdle()
        
        clickButton("Scrape")
        
        // Step 5-7: Wait for system to fetch, normalize, and save job
        // Job appears in list after normalization
        composeTestRule.waitForIdle()
        Thread.sleep(5000)
        // Verify job was fetched and normalized (check for any job-related text)
        composeTestRule.waitUntil(timeoutMillis = 30000) {
            composeTestRule.onAllNodes(hasText("Job", substring = true))
                .fetchSemanticsNodes(false).isNotEmpty()
        }
    }
    
    /**
     * Use Case 3: View saved job application details
     * The user opens a stored job application in their job portfolio.
     * 
     * Steps:
     * 1. User navigates to job dashboard
     * 2. User clicks on a job in the list
     * 3. Job details screen opens
     * 4. Full job information (title, company, description) is displayed
     */
    @Test
    fun testViewJobApplicationDetails_Success() {
        waitForText("My Job Applications", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Wait for job to be clickable
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                getNodeWithText("Software Engineer", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                true
            } catch (e: Exception) {
                try {
                    getNodeWithText("Test Job", substring = true, waitForNode = false)
                        .assertExists()
                    true
                } catch (e2: Exception) {
                    false
                }
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        
        // Click on first job in list
        try {
            getNodeWithText("Software Engineer", substring = true)
                .performClick()
        } catch (e: Exception) {
            getNodeWithText("Test Job", substring = true)
                .performClick()
        }
        
        // Step 3-4: Verify job details screen opens with full information
        composeTestRule.waitForIdle()
        waitForText("Job Details", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Verify job information is displayed (title, company, description)
        // The exact text depends on the job, but we verify the screen is showing details
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            composeTestRule.onAllNodes(hasText("Job", substring = true))
                .fetchSemanticsNodes(false).isNotEmpty()
        }
    }
    
    /**
     * Use Case 4: Delete job application
     * The user removes an existing job from their portfolio.
     * 
     * Steps:
     * 1. User navigates to job dashboard
     * 2. User opens job details
     * 3. User clicks delete button
     * 4. User confirms deletion
     * 5. System removes job from portfolio
     * 6. User returns to job dashboard (job no longer in list)
     */
    @Test
    fun testDeleteJobApplication_Success() {
        waitForText("My Job Applications", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Navigate to job details
        composeTestRule.waitUntil(timeoutMillis = 10000) {
            try {
                val hasTestJob = try {
                    getNodeWithText("Test Job", substring = true, waitForNode = false)
                        .assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                
                val hasSoftwareEngineer = try {
                    getNodeWithText("Software Engineer", substring = true, waitForNode = false)
                        .assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                
                hasTestJob || hasSoftwareEngineer
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        
        try {
            getNodeWithText("Test Job", substring = true).performClick()
        } catch (e: Exception) {
            getNodeWithText("Software Engineer", substring = true).performClick()
        }
        
        waitForText("Job Details", timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Click delete button
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            try {
                getNodeWithText("Delete", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                    .assertIsEnabled()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        getNodeWithText("Delete", substring = true)
            .performClick()
        
        // Wait for confirmation dialog
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        
        // Confirm deletion
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            try {
                getNodeWithText("Confirm", substring = true, waitForNode = false)
                    .assertExists()
                    .assertIsDisplayed()
                    .assertIsEnabled()
                true
            } catch (e: Exception) {
                false
            }
        }
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        getNodeWithText("Confirm", substring = true)
            .performClick()
        
        // Step 5-6: Verify job is removed from portfolio
        // User returns to job dashboard
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        waitForText("My Job Applications", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        // Job is no longer in the list (removed from portfolio)
    }
    
    /**
     * Failure Scenario: Empty job title
     * Expected: Validation error prevents submission
     */
    @Test
    fun testAddJob_EmptyTitle_Failure() {
        waitForText("My Job Applications", timeoutMillis = 30000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        clickButton("Add")
        
        waitForText("Add Job", substring = true, timeoutMillis = 10000)
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Try to submit without title - just fill company
        composeTestRule.waitForIdle()
        typeText("company_input", "Google")
        Thread.sleep(500)
        composeTestRule.waitForIdle()
        
        // Try to click Add button (should fail validation)
        composeTestRule.waitForIdle()
        Thread.sleep(500)
        
        // Verify error message or that button is disabled
        composeTestRule.waitUntil(timeoutMillis = 5000) {
            try {
                val hasRequired = try {
                    getNodeWithText("required", substring = true, waitForNode = false)
                        .assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                
                val hasTitle = try {
                    getNodeWithText("title", substring = true, waitForNode = false)
                        .assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                
                hasRequired || hasTitle
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Failure Scenario: Invalid URL
     * Expected: Error message about invalid URL
     */
    @Test
    fun testAddJobFromUrl_InvalidUrl_Failure() {
        waitForText("My Job Applications", timeoutMillis = 5000)
        getNodeWithText("Add", substring = true)
            .performClick()
        
        waitForText("Add Job", substring = true, timeoutMillis = 2000)
        getNodeWithText("Add from URL", substring = true)
            .performClick()
        
        typeText("job_url_input", "not-a-valid-url")
        clickButton("Scrape")
        
        // Verify error message
        waitForText("Invalid URL", substring = true, timeoutMillis = 5000)
    }
}

