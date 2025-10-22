package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Question Generation API Service
 * Handles all question generation and management functionality
 */
interface QuestionApiService {
    
    // Question Generation
    
    @POST("jobs/{jobId}/questions/generate")
    suspend fun generateQuestions(
        @Path("jobId") jobId: String,
        @Body request: GenerateQuestionsRequest
    ): Response<GenerateQuestionsResponse>
    
    @GET("jobs/{jobId}/questions")
    suspend fun getQuestions(
        @Path("jobId") jobId: String,
        @Query("type") type: String? = null
    ): Response<GenerateQuestionsResponse>
    
    @GET("jobs/{jobId}/questions/progress")
    suspend fun getQuestionProgress(
        @Path("jobId") jobId: String
    ): Response<QuestionProgressResponse>
    
    // Individual Question Management
    
    @GET("questions/{questionId}")
    suspend fun getQuestion(
        @Path("questionId") questionId: String
    ): Response<BehavioralQuestion>
    
    @PUT("questions/{questionId}/answer")
    suspend fun submitAnswer(
        @Path("questionId") questionId: String,
        @Body request: SubmitAnswerRequest
    ): Response<SubmitAnswerResponse>
    
    @DELETE("questions/{questionId}")
    suspend fun deleteQuestion(
        @Path("questionId") questionId: String
    ): Response<Unit>
    
    // Question Categories and Types
    
    @GET("questions/categories")
    suspend fun getQuestionCategories(): Response<List<QuestionCategory>>
    
    @GET("questions/difficulties")
    suspend fun getQuestionDifficulties(): Response<List<QuestionDifficulty>>
}
