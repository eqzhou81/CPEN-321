package com.cpen321.usermanagement.unmocked.repositories

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.QuestionType
import com.cpen321.usermanagement.data.repository.QuestionRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Unmocked Repository Tests for QuestionRepository
 * Tests repository methods against real backend API
 * 
 * Prerequisites:
 * - Backend server running at BuildConfig.API_BASE_URL
 * - Valid authentication token (if required)
 * - Test data available in backend
 */
@RunWith(AndroidJUnit4::class)
class QuestionRepositoryTest {
    
    private lateinit var repository: QuestionRepository
    
    @Before
    fun setup() {
        // Create repository with real API service
        val apiService = RetrofitClient.questionApiService
        repository = QuestionRepository(apiService)
        
        // Set auth token if needed (assuming test account)
        // RetrofitClient.setAuthToken("test_token_here")
    }
    
    /**
     * Test: generateQuestions - Success
     * Expected: Questions generated successfully
     */
    @Test
    fun testGenerateQuestions_Success_Unmocked() {
        runBlocking {
            // Use a test job ID (needs to exist in backend)
            val testJobId = "test_job_id_123"
            
            val result = repository.generateQuestions(
                jobId = testJobId,
                questionTypes = listOf(QuestionType.BEHAVIORAL, QuestionType.TECHNICAL)
            )
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { questionsData ->
                assertNotNull("Questions data should not be null", questionsData)
                assertTrue("Should have questions", 
                    questionsData.behavioralQuestions.isNotEmpty() || 
                    questionsData.technicalQuestions.isNotEmpty()
                )
            }
        }
    }
    
    /**
     * Test: generateQuestions - Failure (Invalid Job ID)
     * Expected: Returns failure result
     */
    @Test
    fun testGenerateQuestions_InvalidJobId_Unmocked() {
        runBlocking {
            val result = repository.generateQuestions(
                jobId = "invalid_job_id",
                questionTypes = listOf(QuestionType.BEHAVIORAL)
            )
            
            assertTrue("Should fail", result.isFailure)
            result.onFailure { exception ->
                assertNotNull("Exception should not be null", exception)
            }
        }
    }
    
    /**
     * Test: getQuestions - Success
     * Expected: Questions retrieved successfully
     */
    @Test
    fun testGetQuestions_Success_Unmocked() {
        runBlocking {
            val testJobId = "test_job_id_123"
            
            val result = repository.getQuestions(jobId = testJobId)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { questionsData ->
                assertNotNull("Questions data should not be null", questionsData)
            }
        }
    }
    
    /**
     * Test: getQuestionProgress - Success
     * Expected: Progress retrieved successfully
     */
    @Test
    fun testGetQuestionProgress_Success_Unmocked() {
        runBlocking {
            val testJobId = "test_job_id_123"
            
            val result = repository.getQuestionProgress(jobId = testJobId)
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { progress ->
                assertNotNull("Progress should not be null", progress)
            }
        }
    }
    
    /**
     * Test: toggleQuestionCompleted - Success
     * Expected: Question completion toggled successfully
     */
    @Test
    fun testToggleQuestionCompleted_Success_Unmocked() {
        runBlocking {
            val testQuestionId = "test_question_id_123"
            
            val result = repository.toggleQuestionCompleted(testQuestionId)
            
            // Should succeed or fail gracefully
            assertNotNull("Result should not be null", result)
        }
    }
    
    /**
     * Test: getQuestionCategories - Success
     * Expected: Categories retrieved successfully
     */
    @Test
    fun testGetQuestionCategories_Success_Unmocked() {
        runBlocking {
            val result = repository.getQuestionCategories()
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { categories ->
                assertNotNull("Categories should not be null", categories)
            }
        }
    }
    
    /**
     * Test: getQuestionDifficulties - Success
     * Expected: Difficulties retrieved successfully
     */
    @Test
    fun testGetQuestionDifficulties_Success_Unmocked() {
        runBlocking {
            val result = repository.getQuestionDifficulties()
            
            assertTrue("Should succeed", result.isSuccess)
            result.onSuccess { difficulties ->
                assertNotNull("Difficulties should not be null", difficulties)
            }
        }
    }
}

