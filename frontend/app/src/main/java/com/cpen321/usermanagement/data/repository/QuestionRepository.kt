package com.cpen321.usermanagement.data.repository

import com.cpen321.usermanagement.data.remote.api.QuestionApiService
import com.cpen321.usermanagement.data.remote.dto.*
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for question generation and management operations
 * Handles data flow between UI and API
 */
@Singleton
class QuestionRepository @Inject constructor(
    private val questionApiService: QuestionApiService
) {
    
    // Question Generation
    
    suspend fun generateQuestions(
        jobId: String,
        questionTypes: List<QuestionType> = listOf(QuestionType.BEHAVIORAL, QuestionType.TECHNICAL)
    ): Result<QuestionsData> {
        return try {
            val request = GenerateQuestionsRequest(
                jobId = jobId,
                types = questionTypes.map { it.value },
                count = 10
            )
            val response = questionApiService.generateQuestions(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to generate questions"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Jack-dev generate questions endpoint
    suspend fun generateQuestionsFromDescription(jobDescription: String, jobId: String): Result<GenerateQuestionsFromDescriptionResponse> {
        return try {
            val request = GenerateQuestionsFromDescriptionRequest(jobDescription, jobId)
            val response = questionApiService.generateQuestionsFromDescription(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to generate questions from description"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getQuestions(
        jobId: String,
        type: QuestionType? = null
    ): Result<QuestionsData> {
        return try {
            val response = questionApiService.getQuestions(jobId, type?.value)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch questions"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getQuestionProgress(jobId: String): Result<QuestionProgress> {
        return try {
            val response = questionApiService.getQuestionProgress(jobId)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch question progress"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Individual Question Management
    
    suspend fun getQuestion(questionId: String): Result<BehavioralQuestion> {
        return try {
            val response = questionApiService.getQuestion(questionId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch question"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun submitAnswer(
        questionId: String,
        answer: String,
        questionType: QuestionType
    ): Result<SubmittedAnswer> {
        return try {
            val request = SubmitAnswerRequest(questionId, answer, questionType)
            val response = questionApiService.submitAnswer(questionId, request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to submit answer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun toggleQuestionCompleted(questionId: String): Result<Unit> {
        return try {
            val response = questionApiService.toggleQuestionCompleted(questionId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to toggle question completion"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteQuestion(questionId: String): Result<Unit> {
        return try {
            val response = questionApiService.deleteQuestion(questionId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to delete question"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // Question Categories and Types
    
    suspend fun getQuestionCategories(): Result<List<QuestionCategory>> {
        return try {
            val response = questionApiService.getQuestionCategories()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch question categories"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getQuestionDifficulties(): Result<List<QuestionDifficulty>> {
        return try {
            val response = questionApiService.getQuestionDifficulties()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.message() ?: "Failed to fetch question difficulties"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
