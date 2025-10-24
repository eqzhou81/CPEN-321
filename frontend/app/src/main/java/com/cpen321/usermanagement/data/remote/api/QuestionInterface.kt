package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.GenerateQuestionsRequest
import com.cpen321.usermanagement.data.remote.dto.QuestionsResponse
import com.cpen321.usermanagement.data.remote.dto.SubmitBehavioralAnswerRequest
import com.cpen321.usermanagement.data.remote.dto.BehavioralAnswerResponse
import com.cpen321.usermanagement.data.remote.dto.QuestionResponse
import com.cpen321.usermanagement.data.remote.dto.QuestionProgressResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface QuestionInterface {
    
    @POST("questions/generate")
    suspend fun generateQuestions(
        @Body request: GenerateQuestionsRequest
    ): Response<ApiResponse<QuestionsResponse>>
    
    @GET("questions/job/{jobId}")
    suspend fun getQuestions(
        @Path("jobId") jobId: String,
        @Query("type") type: String? = null
    ): Response<ApiResponse<QuestionsResponse>>
    
    @POST("questions/behavioral/submit")
    suspend fun submitBehavioralAnswer(
        @Body request: SubmitBehavioralAnswerRequest
    ): Response<ApiResponse<BehavioralAnswerResponse>>
    
    @PUT("questions/{questionId}/toggle")
    suspend fun toggleQuestionCompleted(
        @Path("questionId") questionId: String
    ): Response<ApiResponse<QuestionResponse>>
    
    @GET("questions/job/{jobId}/progress")
    suspend fun getQuestionProgress(
        @Path("jobId") jobId: String
    ): Response<ApiResponse<QuestionProgressResponse>>
}
