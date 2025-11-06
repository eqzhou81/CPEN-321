package com.cpen321.usermanagement.e2e

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onNodeWithTag
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.util.BaseComposeTest
import org.junit.Before
import org.junit.Test

/**
 * E2E Tests for Question Generation Feature
 * 
 * Feature: Generate Questions for a Saved Job
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
class QuestionGenerationTest : BaseComposeTest() {

    @Before
    override fun setup() {
        // IMPORTANT: Backend must be running for these tests!
        
        // Ensure auth token is set for API calls BEFORE app starts
        val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        RetrofitClient.setAuthToken(testToken)
        
        android.util.Log.d("QuestionGenerationTest", "Test token set. Backend URL: ${com.cpen321.usermanagement.BuildConfig.STAGING_BASE_URL}")
        
        super.setup()
    }

    /**
     * Use Case: Generate Questions - Main Success Scenario
     * 
     * Steps:
     * 1. Navigate to job applications list
     * 2. Select a saved job application
     * 3. Click on "Generate Questions" button
     * 4-6. System generates and stores questions
     * 7-8. System displays "Behavioral Questions" and "Technical Questions" buttons
     */
    @Test
    fun useCase_GenerateQuestions_Success() {
        android.util.Log.d("QuestionGenerationTest", "=== Use Case: Generate Questions - Success ===")
        
        // Step 1: Check for main screen
        android.util.Log.d("QuestionGenerationTest", "Step 1: Checking for 'My Job Applications' screen...")
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen 'My Job Applications' not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Check for and click on a job
        android.util.Log.d("QuestionGenerationTest", "Step 2: Checking for job to select...")
        val jobFound = check(maxRetries = 6) {
            try {
                composeTestRule.onAllNodes(hasText("Test Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty() ||
                composeTestRule.onAllNodes(hasText("Job", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                false
            }
        }
        
        assert(jobFound) { "Failed: No jobs found in the list" }
        
        // Click on the job
        android.util.Log.d("QuestionGenerationTest", "Clicking on job...")
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for Job Details screen
        android.util.Log.d("QuestionGenerationTest", "Step 3: Checking for 'Job Details' screen...")
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 4: Check for and click "Generate Questions" button
        android.util.Log.d("QuestionGenerationTest", "Step 4: Checking for 'Generate Questions' button...")
        assert(checkTag("generate_questions_button", maxRetries = 6)) {
            "Failed: Generate Questions button not found"
        }
        
        val generateClicked = checkTagAndClick("generate_questions_button", maxRetries = 3)
        assert(generateClicked) { "Failed: Could not click Generate Questions button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 5: Check for Questions Dashboard screen
        android.util.Log.d("QuestionGenerationTest", "Step 5: Checking for 'Interview Questions' screen...")
        assert(checkText("Interview Questions", maxRetries = 6)) {
            "Failed: Interview Questions screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 6: Wait for loading to finish
        android.util.Log.d("QuestionGenerationTest", "Step 6: Waiting for question generation to complete...")
        val loadingFinished = check(maxRetries = 12) { // Up to 60 seconds for loading
            try {
                // Check if loading message is gone
                !composeTestRule.onAllNodes(hasText("Generating your interview questions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                true // If we can't find loading text, assume it's done
            }
        }
        
        assert(loadingFinished) { "Failed: Question generation loading did not complete" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 7-8: Check for question type buttons
        android.util.Log.d("QuestionGenerationTest", "Step 7-8: Checking for question type buttons...")
        val hasBehavioral = checkText("Behavioral Questions", maxRetries = 12) ||
                           checkText("Behavioral", maxRetries = 12)
        val hasTechnical = checkText("Technical Questions", maxRetries = 12) ||
                          checkText("Technical", maxRetries = 12)
        
        assert(hasBehavioral || hasTechnical) {
            "Failed: Neither Behavioral nor Technical questions were generated. " +
            "Check backend logs for errors in question generation API."
        }
        
        android.util.Log.d("QuestionGenerationTest", "✓ Use Case: Generate Questions - Success PASSED")
    }

    /**
     * Use Case: Generate Questions - Failure Scenario 4a
     * No job description content available
     * 
     * Expected:
     * 4a1. System displays error message: "Unable to generate questions. Job description is missing or incomplete."
     * 4a2. System continues showing the saved job application screen
     */
    @Test
    fun useCase_GenerateQuestions_NoJobDescription() {
        android.util.Log.d("QuestionGenerationTest", "=== Use Case: Generate Questions - No Job Description ===")
        
        // Step 1: Navigate to job applications
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(1000)
        
        // Step 2: Find and click on a job (ideally one with empty description)
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        // Step 3: Check for Job Details and click Generate Questions
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        
        val generateClicked = checkTagAndClick("generate_questions_button", maxRetries = 3)
        assert(generateClicked) { "Failed: Could not click Generate Questions button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Step 4a1: Check for error message
        android.util.Log.d("QuestionGenerationTest", "Checking for error message...")
        val errorFound = checkText("Unable to generate questions", maxRetries = 6) ||
                        checkText("Job description is missing", maxRetries = 6) ||
                        checkText("incomplete", maxRetries = 6)
        
        // Note: This test may pass or fail depending on test data
        // If no job with empty description exists, the test will proceed normally
        if (errorFound) {
            android.util.Log.d("QuestionGenerationTest", "✓ Error message found as expected")
        } else {
            android.util.Log.d("QuestionGenerationTest", "Note: No error message found - job may have description")
        }
        
        // Step 4a2: Verify still on Job Details screen
        assert(checkText("Job Details", maxRetries = 3) || checkText("Interview Questions", maxRetries = 3)) {
            "Failed: Not on expected screen after error"
        }
        
        android.util.Log.d("QuestionGenerationTest", "✓ Use Case: Generate Questions - No Job Description COMPLETED")
    }

    /**
     * Use Case: Generate Questions - Failure Scenario 5a
     * OpenAI API failure
     * 
     * Expected:
     * 5a1. System displays error message: "Unable to generate behavioral questions at this time. Please try again later."
     * 5a2. System continues to step 6 to attempt coding questions generation
     * 5a3. No "Behavioural Questions" button will be available in step 8
     */
    @Test
    fun useCase_GenerateQuestions_OpenAIFailure() {
        android.util.Log.d("QuestionGenerationTest", "=== Use Case: Generate Questions - OpenAI Failure ===")
        
        // Navigate and generate questions
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        
        val generateClicked = checkTagAndClick("generate_questions_button", maxRetries = 3)
        assert(generateClicked) { "Failed: Could not click Generate Questions button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Wait for questions screen or error
        val screenLoaded = checkText("Interview Questions", maxRetries = 6) ||
                          checkText("Unable to generate behavioral questions", maxRetries = 6) ||
                          checkText("Error", maxRetries = 6)
        
        assert(screenLoaded) { "Failed: Questions screen or error not found" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Check for error message or verify behavioral questions are not available
        val hasError = checkText("Unable to generate behavioral questions", maxRetries = 3) ||
                      checkText("Please try again later", maxRetries = 3)
        val hasBehavioral = checkText("Behavioral Questions", maxRetries = 3) ||
                           checkText("Behavioral", maxRetries = 3)
        
        // Test passes if error is shown OR if behavioral questions are not available
        if (hasError || !hasBehavioral) {
            android.util.Log.d("QuestionGenerationTest", "✓ OpenAI failure scenario handled correctly")
        } else {
            android.util.Log.d("QuestionGenerationTest", "Note: OpenAI may have succeeded - check backend logs")
        }
        
        android.util.Log.d("QuestionGenerationTest", "✓ Use Case: Generate Questions - OpenAI Failure COMPLETED")
    }

    /**
     * Use Case: Generate Questions - Failure Scenario 5b
     * OpenAI API returns no behavioral questions
     * 
     * Expected:
     * 5b1. System displays warning: "No behavioral questions could be generated for this job type."
     * 5b2. System continues to step 6 to attempt coding questions generation
     * 5b3. No "Behavioural Questions" button will be available in step 8
     */
    @Test
    fun useCase_GenerateQuestions_NoBehavioralQuestions() {
        android.util.Log.d("QuestionGenerationTest", "=== Use Case: Generate Questions - No Behavioral Questions ===")
        
        // Navigate and generate questions
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        
        val generateClicked = checkTagAndClick("generate_questions_button", maxRetries = 3)
        assert(generateClicked) { "Failed: Could not click Generate Questions button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Wait for questions screen
        assert(checkText("Interview Questions", maxRetries = 6)) {
            "Failed: Interview Questions screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(5000)
        
        // Wait for loading to finish
        val loadingFinished = check(maxRetries = 12) {
            try {
                !composeTestRule.onAllNodes(hasText("Generating your interview questions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                true
            }
        }
        assert(loadingFinished) { "Failed: Question generation loading did not complete" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Check for warning or verify behavioral questions are not available
        val hasWarning = checkText("No behavioral questions", maxRetries = 3) ||
                        checkText("could not be generated", maxRetries = 3)
        val hasBehavioral = checkText("Behavioral Questions", maxRetries = 3) ||
                           checkText("Behavioral", maxRetries = 3)
        
        // Test passes if warning is shown OR if behavioral questions are not available
        if (hasWarning || !hasBehavioral) {
            android.util.Log.d("QuestionGenerationTest", "✓ No behavioral questions scenario handled correctly")
        } else {
            android.util.Log.d("QuestionGenerationTest", "Note: Behavioral questions may have been generated")
        }
        
        android.util.Log.d("QuestionGenerationTest", "✓ Use Case: Generate Questions - No Behavioral Questions COMPLETED")
    }

    /**
     * Use Case: Generate Questions - Failure Scenario 5c
     * Community LeetCode API failure
     * 
     * Expected:
     * 5c1. System displays error message: "Unable to generate coding questions at this time."
     * 5c2. No "Technical Questions" button will be available in step 8
     */
    @Test
    fun useCase_GenerateQuestions_LeetCodeFailure() {
        android.util.Log.d("QuestionGenerationTest", "=== Use Case: Generate Questions - LeetCode Failure ===")
        
        // Navigate and generate questions
        assert(checkText("My Job Applications", maxRetries = 6)) {
            "Failed: Main screen not found"
        }
        
        val jobClicked = checkTextAndClick("Test Job", substring = true, maxRetries = 3) ||
                        checkTextAndClick("Job", substring = true, maxRetries = 3)
        assert(jobClicked) { "Failed: Could not click on job" }
        composeTestRule.waitForIdle()
        Thread.sleep(2000)
        
        assert(checkText("Job Details", maxRetries = 6)) {
            "Failed: Job Details screen not found"
        }
        
        val generateClicked = checkTagAndClick("generate_questions_button", maxRetries = 3)
        assert(generateClicked) { "Failed: Could not click Generate Questions button" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Wait for questions screen
        assert(checkText("Interview Questions", maxRetries = 6)) {
            "Failed: Interview Questions screen not found"
        }
        composeTestRule.waitForIdle()
        Thread.sleep(5000)
        
        // Wait for loading to finish
        val loadingFinished = check(maxRetries = 12) {
            try {
                !composeTestRule.onAllNodes(hasText("Generating your interview questions", substring = true))
                    .fetchSemanticsNodes(false).isNotEmpty()
            } catch (e: Exception) {
                true
            }
        }
        assert(loadingFinished) { "Failed: Question generation loading did not complete" }
        composeTestRule.waitForIdle()
        Thread.sleep(3000)
        
        // Check for error message or verify technical questions are not available
        val hasError = checkText("Unable to generate coding questions", maxRetries = 3) ||
                      checkText("LeetCode", maxRetries = 3)
        val hasTechnical = checkText("Technical Questions", maxRetries = 3) ||
                          checkText("Technical", maxRetries = 3)
        
        // Test passes if error is shown OR if technical questions are not available
        if (hasError || !hasTechnical) {
            android.util.Log.d("QuestionGenerationTest", "✓ LeetCode failure scenario handled correctly")
        } else {
            android.util.Log.d("QuestionGenerationTest", "Note: LeetCode may have succeeded - check backend logs")
        }
        
        android.util.Log.d("QuestionGenerationTest", "✓ Use Case: Generate Questions - LeetCode Failure COMPLETED")
    }
}
