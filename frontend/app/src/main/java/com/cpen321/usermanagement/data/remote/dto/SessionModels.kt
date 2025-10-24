package com.cpen321.usermanagement.data.remote.dto

import com.google.gson.annotations.SerializedName

object SessionModels {
    
    // Enums
    enum class SessionStatus {
        @SerializedName("active") ACTIVE,
        @SerializedName("paused") PAUSED,
        @SerializedName("completed") COMPLETED,
        @SerializedName("cancelled") CANCELLED
    }
    
    // Request Models
    data class CreateSessionRequest(
        @SerializedName("jobId") val jobId: String,
        @SerializedName("questionTypes") val questionTypes: List<String> = listOf("behavioral"),
        @SerializedName("questionCount") val questionCount: Int = 10,
        @SerializedName("specificQuestionId") val specificQuestionId: String? = null
    )
    
    data class SubmitAnswerRequest(
        @SerializedName("sessionId") val sessionId: String,
        @SerializedName("questionId") val questionId: String,
        @SerializedName("answer") val answer: String
    )
    
    data class NavigateRequest(
        @SerializedName("questionIndex") val questionIndex: Int
    )
    
    data class UpdateStatusRequest(
        @SerializedName("status") val status: String
    )
    
    // Response Models
    data class Session(
        @SerializedName("_id") val id: String,
        @SerializedName("userId") val userId: String,
        @SerializedName("jobId") val jobId: String,
        @SerializedName("questionIds") val questionIds: List<Question>,
        @SerializedName("currentQuestionIndex") val currentQuestionIndex: Int,
        @SerializedName("status") val status: SessionStatus,
        @SerializedName("startedAt") val startedAt: String,
        @SerializedName("completedAt") val completedAt: String? = null,
        @SerializedName("totalQuestions") val totalQuestions: Int,
        @SerializedName("answeredQuestions") val answeredQuestions: Int,
        @SerializedName("progressPercentage") val progressPercentage: Int,
        @SerializedName("remainingQuestions") val remainingQuestions: Int,
        @SerializedName("currentQuestion") val currentQuestion: Question? = null,
        @SerializedName("createdAt") val createdAt: String,
        @SerializedName("updatedAt") val updatedAt: String
    )
    
    data class Question(
        @SerializedName("_id") val id: String,
        @SerializedName("jobId") val jobId: String,
        @SerializedName("userId") val userId: String,
        @SerializedName("type") val type: String,
        @SerializedName("title") val title: String,
        @SerializedName("description") val description: String? = null,
        @SerializedName("difficulty") val difficulty: String? = null,
        @SerializedName("tags") val tags: List<String> = emptyList(),
        @SerializedName("externalUrl") val externalUrl: String? = null,
        @SerializedName("status") val status: String,
        @SerializedName("createdAt") val createdAt: String,
        @SerializedName("updatedAt") val updatedAt: String
    )
    
    data class SessionFeedback(
        @SerializedName("feedback") val feedback: String,
        @SerializedName("score") val score: Int,
        @SerializedName("strengths") val strengths: List<String>,
        @SerializedName("improvements") val improvements: List<String>,
        @SerializedName("isLastQuestion") val isLastQuestion: Boolean,
        @SerializedName("nextQuestionId") val nextQuestionId: String? = null,
        @SerializedName("sessionCompleted") val sessionCompleted: Boolean
    )
    
    data class SessionStats(
        @SerializedName("total") val total: Int,
        @SerializedName("completed") val completed: Int,
        @SerializedName("active") val active: Int,
        @SerializedName("averageProgress") val averageProgress: Int
    )
    
    data class SessionProgress(
        @SerializedName("sessionId") val sessionId: String,
        @SerializedName("currentQuestionIndex") val currentQuestionIndex: Int,
        @SerializedName("totalQuestions") val totalQuestions: Int,
        @SerializedName("answeredQuestions") val answeredQuestions: Int,
        @SerializedName("progressPercentage") val progressPercentage: Int,
        @SerializedName("status") val status: SessionStatus,
        @SerializedName("remainingQuestions") val remainingQuestions: Int,
        @SerializedName("estimatedTimeRemaining") val estimatedTimeRemaining: Int? = null
    )
    
    // API Response Wrappers
    data class CreateSessionResponse(
        @SerializedName("session") val session: Session,
        @SerializedName("currentQuestion") val currentQuestion: Question
    )
    
    data class SessionResponse(
        @SerializedName("session") val session: Session,
        @SerializedName("currentQuestion") val currentQuestion: Question? = null
    )
    
    data class UserSessionsResponse(
        @SerializedName("sessions") val sessions: List<Session>,
        @SerializedName("stats") val stats: SessionStats
    )
    
    data class SubmitAnswerResponse(
        @SerializedName("session") val session: Session,
        @SerializedName("feedback") val feedback: SessionFeedback
    )
    
    data class SessionProgressResponse(
        @SerializedName("session") val session: SessionProgress
    )
}

