package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.SessionInterface
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
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionRepositoryImpl @Inject constructor(
    private val sessionInterface: SessionInterface,
    private val tokenManager: TokenManager
) : SessionRepository {
    
    companion object {
        private const val TAG = "SessionRepositoryImpl"
    }
    
    private suspend fun ensureTokenSet() {
        val token = tokenManager.getTokenSync()
        if (token != null) {
            Log.d(TAG, "Setting auth token (length: ${token.length})")
            RetrofitClient.setAuthToken(token)
        } else {
            Log.w(TAG, "No token found in TokenManager!")
        }
    }
    
    override suspend fun createSession(request: CreateSessionRequest): Response<ApiResponse<CreateSessionResponse>> {
        ensureTokenSet()
        return sessionInterface.createSession(request)
    }
    
    override suspend fun getSession(sessionId: String): Response<ApiResponse<SessionResponse>> {
        ensureTokenSet()
        return sessionInterface.getSession(sessionId)
    }
    
    override suspend fun getUserSessions(limit: Int): Response<ApiResponse<UserSessionsResponse>> {
        ensureTokenSet()
        return sessionInterface.getUserSessions(limit)
    }
    
    override suspend fun submitAnswer(request: SubmitAnswerRequest): Response<ApiResponse<SubmitAnswerResponse>> {
        ensureTokenSet()
        return sessionInterface.submitAnswer(request)
    }
    
    override suspend fun navigateToQuestion(
        sessionId: String, 
        request: NavigateRequest
    ): Response<ApiResponse<SessionResponse>> {
        ensureTokenSet()
        return sessionInterface.navigateToQuestion(sessionId, request)
    }
    
    override suspend fun updateSessionStatus(
        sessionId: String, 
        request: UpdateStatusRequest
    ): Response<ApiResponse<SessionResponse>> {
        ensureTokenSet()
        return sessionInterface.updateSessionStatus(sessionId, request)
    }
    
    override suspend fun getSessionProgress(sessionId: String): Response<ApiResponse<SessionProgressResponse>> {
        ensureTokenSet()
        return sessionInterface.getSessionProgress(sessionId)
    }
    
    override suspend fun deleteSession(sessionId: String): Response<ApiResponse<Unit>> {
        ensureTokenSet()
        return sessionInterface.deleteSession(sessionId)
    }
}
