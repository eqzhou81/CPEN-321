package com.cpen321.usermanagement.data.repository

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

interface SessionRepository {
    suspend fun createSession(request: CreateSessionRequest): Response<ApiResponse<CreateSessionResponse>>
    suspend fun getSession(sessionId: String): Response<ApiResponse<SessionResponse>>
    suspend fun getUserSessions(limit: Int = 20): Response<ApiResponse<UserSessionsResponse>>
    suspend fun submitAnswer(request: SubmitAnswerRequest): Response<ApiResponse<SubmitAnswerResponse>>
    suspend fun navigateToQuestion(sessionId: String, request: NavigateRequest): Response<ApiResponse<SessionResponse>>
    suspend fun updateSessionStatus(sessionId: String, request: UpdateStatusRequest): Response<ApiResponse<SessionResponse>>
    suspend fun getSessionProgress(sessionId: String): Response<ApiResponse<SessionProgressResponse>>
    suspend fun deleteSession(sessionId: String): Response<ApiResponse<Unit>>
}
