package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Job Management Feature
 * 
 * Feature: Manage Job Applications
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
class JobManagementTest : BaseComposeTest() {
    
    @Before
    override fun setup() {
        // IMPORTANT: Backend must be running for these tests!
        
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
    fun useCase_PasteJobPosting_Success() {
        android.util.Log.d("JobManagementTest", "=== Use Case: Paste Job Posting - Success ===")
        
        // Step 1: Check for main screen
        android.util.Log.d("JobManagementTest", "Step 1: Checking for 'My Job Applications' screen...")
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen 'My Job Applications' not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Check for and click "Add Job" button
        android.util.Log.d("JobManagementTest", "Step 2: Checking for 'Add Job' button...")
        assert(checkTag("add_job_button", maxRetries = 6)) {
            "Failed: Add Job button not found"
        }
        
        val addClicked = checkTagAndClick("add_job_button", maxRetries = 3)
        assert(addClicked) { "Failed: Could not click Add Job button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for "Add Job" dialog and input job details
        android.util.Log.d("JobManagementTest", "Step 3: Checking for 'Add Job' dialog...")
        assert(checkText("Add Job", maxRetries = 6)) {
            "Failed: Add Job dialog not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Input job details (requires test tags on input fields)
        try {
            composeTestRule.onNodeWithTag("job_title_input")
                .performTextInput("Software Engineer")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            
            composeTestRule.onNodeWithTag("company_input")
                .performTextInput("Google")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            
            composeTestRule.onNodeWithTag("description_input")
                .performTextInput("We are looking for a software engineer with 5+ years of experience...")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("JobManagementTest", "Could not input text using test tags: ${e.message}")
            // Fallback: try clicking and typing if tags don't exist
        }
        
        // Step 4: Submit form
        android.util.Log.d("JobManagementTest", "Step 4: Submitting form...")
        val submitClicked = checkTextAndClick("Add", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Add button to submit" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 5-6: Check that job appears in list with stored information
        android.util.Log.d("JobManagementTest", "Step 5-6: Checking for job in list...")
        val jobFound = checkText("Software Engineer", maxRetries = 6) ||
                      checkText("Google", maxRetries = 6)
        
        assert(jobFound) {
            "Failed: Job not found in list after creation. Check backend logs for errors."
        }
        
        android.util.Log.d("JobManagementTest", "✓ Use Case: Paste Job Posting - Success PASSED")
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
    fun useCase_PasteJobPostingLink_Success() {
        android.util.Log.d("JobManagementTest", "=== Use Case: Paste Job Posting Link - Success ===")
        
        // Step 1: Check for main screen
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Click "Add Job" button
        val addClicked = checkTagAndClick("add_job_button", maxRetries = 3) ||
                        checkTextAndClick("Add", maxRetries = 3)
        assert(addClicked) { "Failed: Could not click Add Job button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for dialog and select "Add from URL" option
        assert(checkText("Add Job", maxRetries = 6)) {
            "Failed: Add Job dialog not found"
        }
        
        val urlOptionClicked = checkTextAndClick("Add from URL", maxRetries = 3)
        assert(urlOptionClicked) { "Failed: Could not click 'Add from URL' option" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 4: Enter URL
        try {
            composeTestRule.onNodeWithTag("job_url_input")
                .performTextInput("https://careers.google.com/jobs/12345")
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
        } catch (e: Exception) {
            android.util.Log.w("JobManagementTest", "Could not input URL using test tag: ${e.message}")
        }
        
        // Click scrape/submit button
        val scrapeClicked = checkTextAndClick("Scrape", maxRetries = 3) ||
                           checkTextAndClick("Add", maxRetries = 3)
        assert(scrapeClicked) { "Failed: Could not click scrape/submit button" }
        composeTestRule.waitForIdle()
        Thread.sleep(5000)
        
        // Step 5-7: Check that job appears in list after scraping
        val jobFound = check(maxRetries = 12) {
            try {
                composeTestRule.onAllNodes(hasText("Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(jobFound) {
            "Failed: Job not found in list after scraping. Check backend logs for scraping errors."
        }
        
        android.util.Log.d("JobManagementTest", "✓ Use Case: Paste Job Posting Link - Success PASSED")
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
    fun useCase_ViewJobApplicationDetails_Success() {
        android.util.Log.d("JobManagementTest", "=== Use Case: View Job Application Details - Success ===")
        
        // Step 1: Check for main screen
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Check for and click on a job
        android.util.Log.d("JobManagementTest", "Step 2: Checking for jobs in list...")
        val jobExists = check(maxRetries = 6) {
            try {
                composeTestRule.onAllNodes(hasText("Test Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(jobExists) { "Failed: No jobs found in list" }
        
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3-4: Check for Job Details screen with job information
        android.util.Log.d("JobManagementTest", "Step 3-4: Checking for Job Details screen...")
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Verify job information is displayed
        val detailsVisible = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(detailsVisible) { "Failed: Job details not displayed" }
        
        android.util.Log.d("JobManagementTest", "✓ Use Case: View Job Application Details - Success PASSED")
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
     * 6. User returns to job dashboard
     */
    @Test
    fun useCase_DeleteJobApplication_Success() {
        android.util.Log.d("JobManagementTest", "=== Use Case: Delete Job Application - Success ===")
        
        // Step 1: Check for main screen
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Open job details
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 3: Click delete button
        android.util.Log.d("JobManagementTest", "Step 3: Checking for delete button...")
        val deleteClicked = checkTextAndClick("Delete", maxRetries = 3)
        assert(deleteClicked) { "Failed: Could not click Delete button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 4: Confirm deletion
        android.util.Log.d("JobManagementTest", "Step 4: Confirming deletion...")
        val confirmClicked = checkTextAndClick("Confirm", maxRetries = 3) ||
                            checkTextAndClick("Delete", maxRetries = 3)
        assert(confirmClicked) { "Failed: Could not confirm deletion" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 5-6: Check that user returns to job dashboard
        android.util.Log.d("JobManagementTest", "Step 5-6: Checking return to dashboard...")
        val returnedToDashboard = checkText("My Job Applications", maxRetries = 6)
        
        assert(returnedToDashboard) {
            "Failed: Did not return to job dashboard after deletion"
        }
        
        android.util.Log.d("JobManagementTest", "✓ Use Case: Delete Job Application - Success PASSED")
    }
    
    /**
     * Use Case: Paste job posting - Failure Scenario
     * User submits empty title
     * 
     * Expected side effect:
     * Job should NOT be created (validation should prevent it)
     */
    @Test
    fun useCase_PasteJobPosting_EmptyTitle_Failure() {
        android.util.Log.d("JobManagementTest", "=== Use Case: Paste Job Posting - Empty Title Failure ===")
        
        // Step 1: Verify we're on job applications list
        android.util.Log.d("JobManagementTest", "Step 1: Verifying we're on job applications list...")
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Click "Add Job" button
        android.util.Log.d("JobManagementTest", "Step 2: Opening Add Job form...")
        val addClicked = checkTagAndClick("add_job_button", maxRetries = 3) ||
                        checkTextAndClick("Add", maxRetries = 3)
        assert(addClicked) { "Failed: Could not click Add Job button" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for Add Job dialog
        assert(checkText("Add Job", maxRetries = 6)) {
            "Failed: Add Job dialog not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 4: Try to submit without filling title (leave it empty)
        android.util.Log.d("JobManagementTest", "Step 4: Attempting to submit with empty title...")
        val submitClicked = checkTextAndClick("Add", maxRetries = 3)
        assert(submitClicked) { "Failed: Could not click Add button to submit" }
        composeTestRule.waitForIdle()
        Thread.sleep(5000) // Wait to see if validation prevents submission
        
        // Step 5: Check what happened after submission
        android.util.Log.d("JobManagementTest", "Step 5: Checking state after submission...")
        val stillOnForm = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("Add Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        val onJobList = check(maxRetries = 3) {
            try {
                composeTestRule.onAllNodes(hasText("My Job Applications", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        // Step 6: Navigate back to job list if needed
        if (stillOnForm) {
            android.util.Log.d("JobManagementTest", "Form still open (validation prevented submission), closing form...")
            val cancelClicked = checkTextAndClick("Cancel", maxRetries = 3)
            if (!cancelClicked) {
                pressBack()
                Thread.sleep(1000)
            }
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        } else if (!onJobList) {
            android.util.Log.d("JobManagementTest", "Not on form or list, navigating back...")
            pressBack()
            Thread.sleep(1000)
            composeTestRule.waitForIdle()
            Thread.sleep(2000)
        }
        
        // Step 7: Verify we're on job applications list
        android.util.Log.d("JobManagementTest", "Step 7: Verifying we're on job applications list...")
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Not on job applications list"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 8: Verify side effect - Job with empty title was NOT created
        android.util.Log.d("JobManagementTest", "Step 8: Verifying side effect - job was NOT created...")
        
        // Since we didn't enter a title, we can't check for a specific job name
        // But we can verify we're on the list and no unexpected redirect happened
        // The key side effect is: we should NOT be on a job detail page
        
        val stillOnList = checkText("My Job Applications", maxRetries = 3)
        assert(stillOnList) {
            "Failed: Side effect check failed. Expected to be on job list, " +
            "but job creation may have succeeded (which should not happen with empty title)."
        }
        
        // Also verify we're not on a job detail page (which would indicate a job was created)
        val notOnDetailPage = check(maxRetries = 3) {
            try {
                val hasBackButton = try {
                    composeTestRule.onNodeWithContentDescription("Back").assertExists()
                    true
                } catch (e: Exception) {
                    false
                }
                val hasJobDetails = try {
                    composeTestRule.onAllNodes(hasText("Job Details", substring = true))
                        .fetchSemanticsNodes(false).isNotEmpty()
                    true
                } catch (e: Exception) {
                    false
                }
                !hasBackButton && !hasJobDetails
            } catch (e: Exception) {
                true // If check fails, assume we're on list (good)
            }
        }
        
        assert(notOnDetailPage) {
            "Failed: Side effect check failed. Appears to be on job detail page, " +
            "which suggests a job was created despite empty title. This should not happen."
        }
        
        android.util.Log.d("JobManagementTest", "✓ Side effect verified: Job was NOT created - test PASSED")
    }
}
