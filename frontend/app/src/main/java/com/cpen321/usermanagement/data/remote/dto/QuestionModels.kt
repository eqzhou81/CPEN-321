package com.cpen321.usermanagement.data.remote.dto

import com.google.gson.annotations.SerializedName

object QuestionModels {
    
    // Enums
    enum class QuestionType {
        @SerializedName("behavioral") BEHAVIORAL,
        @SerializedName("technical") TECHNICAL
    }
    
    enum class QuestionStatus {
        @SerializedName("pending") PENDING,
        @SerializedName("completed") COMPLETED
    }
    
    // Request Models
    data class GenerateQuestionsRequest(
        @SerializedName("jobId") val jobId: String,
        @SerializedName("types") val types: List<String>,
        @SerializedName("count") val count: Int = 10
    )
    
    data class SubmitBehavioralAnswerRequest(
        @SerializedName("questionId") val questionId: String,
        @SerializedName("answer") val answer: String
    )
    
    // Response Models
    data class Question(
        @SerializedName("_id") val id: String,
        @SerializedName("jobId") val jobId: String,
        @SerializedName("userId") val userId: String,
        @SerializedName("type") val type: QuestionType,
        @SerializedName("title") val title: String,
        @SerializedName("description") val description: String? = null,
        @SerializedName("difficulty") val difficulty: String? = null,
        @SerializedName("tags") val tags: List<String> = emptyList(),
        @SerializedName("externalUrl") val externalUrl: String? = null,
        @SerializedName("status") val status: QuestionStatus,
        @SerializedName("createdAt") val createdAt: String,
        @SerializedName("updatedAt") val updatedAt: String
    )
    
    data class BehavioralFeedback(
        @SerializedName("feedback") val feedback: String,
        @SerializedName("score") val score: Int,
        @SerializedName("strengths") val strengths: List<String>,
        @SerializedName("improvements") val improvements: List<String>
    )
    
    data class QuestionProgress(
        @SerializedName("technical") val technical: ProgressStats,
        @SerializedName("behavioral") val behavioral: ProgressStats,
        @SerializedName("overall") val overall: ProgressStats
    )
    
    data class ProgressStats(
        @SerializedName("total") val total: Int,
        @SerializedName("completed") val completed: Int
    )
    
    // API Response Wrappers
    data class QuestionsResponse(
        @SerializedName("questions") val questions: List<Question>,
        @SerializedName("total") val total: Int
    )
    
    data class QuestionResponse(
        @SerializedName("question") val question: Question
    )
    
    data class BehavioralAnswerResponse(
        @SerializedName("feedback") val feedback: String,
        @SerializedName("score") val score: Int,
        @SerializedName("strengths") val strengths: List<String>,
        @SerializedName("improvements") val improvements: List<String>
    )
    
    data class QuestionProgressResponse(
        @SerializedName("jobId") val jobId: String,
        @SerializedName("progress") val progress: QuestionProgress
    )
}

