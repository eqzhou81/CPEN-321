package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.UserSessionsResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SubmitAnswerRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SubmitAnswerResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.NavigateRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.UpdateStatusRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionProgressResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface SessionInterface {
    
    @POST("sessions/create")
    suspend fun createSession(
        @Body request: CreateSessionRequest
    ): Response<ApiResponse<CreateSessionResponse>>
    
    @GET("sessions/{sessionId}")
    suspend fun getSession(
        @Path("sessionId") sessionId: String
    ): Response<ApiResponse<SessionResponse>>
    
    @GET("sessions")
    suspend fun getUserSessions(
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<UserSessionsResponse>>
    
    @POST("sessions/submit-answer")
    suspend fun submitAnswer(
        @Body request: SubmitAnswerRequest
    ): Response<ApiResponse<SubmitAnswerResponse>>
    
    @PUT("sessions/{sessionId}/navigate")
    suspend fun navigateToQuestion(
        @Path("sessionId") sessionId: String,
        @Body request: NavigateRequest
    ): Response<ApiResponse<SessionResponse>>
    
    @PUT("sessions/{sessionId}/status")
    suspend fun updateSessionStatus(
        @Path("sessionId") sessionId: String,
        @Body request: UpdateStatusRequest
    ): Response<ApiResponse<SessionResponse>>
    
    @GET("sessions/{sessionId}/progress")
    suspend fun getSessionProgress(
        @Path("sessionId") sessionId: String
    ): Response<ApiResponse<SessionProgressResponse>>
    
    @DELETE("sessions/{sessionId}")
    suspend fun deleteSession(
        @Path("sessionId") sessionId: String
    ): Response<ApiResponse<Unit>>
}
