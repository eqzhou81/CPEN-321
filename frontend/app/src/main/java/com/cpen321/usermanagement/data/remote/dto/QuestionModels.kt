package com.cpen321.usermanagement.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Question Generation Data Transfer Objects
 * Handles behavioral and technical questions for job applications
 */

data class GenerateQuestionsRequest(
    val jobId: String,
    @SerializedName("types") val types: List<String>,
    val count: Int = 10
)

data class GenerateQuestionsResponse(
    val message: String,
    val data: QuestionsData? = null
)

// Alias for compatibility
typealias QuestionsResponse = GenerateQuestionsResponse

data class QuestionsData(
    val behavioralQuestions: List<BehavioralQuestion>,
    val technicalQuestions: List<TechnicalQuestion>,
    val totalQuestions: Int,
    val jobApplication: JobApplication
)

data class BehavioralQuestion(
    @SerializedName("_id")
    val id: String,
    val jobId: String,
    val title: String,
    val description: String,
    val difficulty: QuestionDifficulty?,
    val tags: List<String>? = null,
    val status: String? = null,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String,
    // Additional fields for compatibility
    val expectedAnswer: String? = null,
    val tips: List<String>? = null,
    val userAnswer: String? = null,
    val completedAt: String? = null
) {
    // Computed properties
    val question: String get() = title
    val category: String get() = tags?.firstOrNull() ?: "General"
    val isCompleted: Boolean get() = status == "completed"
}

data class TechnicalQuestion(
    @SerializedName("_id")
    val id: String,
    val jobId: String,
    val title: String,
    val description: String,
    val difficulty: QuestionDifficulty?,
    val tags: List<String>? = null,
    val externalUrl: String? = null,
    val status: String? = null,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String,
    // Additional fields for compatibility
    val language: String? = null,
    val hints: List<String>? = null,
    val testCases: List<TestCase>? = null,
    val expectedSolution: String? = null,
    val userSolution: String? = null,
    val completedAt: String? = null
) {
    // Computed properties
    val category: String get() = tags?.firstOrNull() ?: "General"
    val isCompleted: Boolean get() = status == "completed"
}

data class TestCase(
    val input: String,
    val expectedOutput: String,
    val description: String? = null
)

data class QuestionProgress(
    val totalQuestions: Int,
    val completedQuestions: Int,
    val behavioralCompleted: Int,
    val technicalCompleted: Int,
    val completionPercentage: Double
)

data class QuestionProgressResponse(
    val message: String,
    val data: QuestionProgress? = null
)

// Alias for compatibility
typealias QuestionResponse = QuestionProgressResponse

data class SubmitAnswerRequest(
    val questionId: String,
    val answer: String,
    val questionType: QuestionType
)

// Alias for compatibility
typealias SubmitBehavioralAnswerRequest = SubmitAnswerRequest

data class SubmitAnswerResponse(
    val message: String,
    val data: SubmittedAnswer? = null
)

// Alias for compatibility
typealias BehavioralAnswerResponse = SubmitAnswerResponse

data class SubmittedAnswer(
    val questionId: String,
    val isCorrect: Boolean,
    val feedback: String? = null,
    val score: Int? = null
)

enum class QuestionType(val value: String) {
    BEHAVIORAL("behavioral"),
    TECHNICAL("technical")
}

enum class QuestionDifficulty(val value: String, val displayName: String) {
    EASY("easy", "Easy"),
    MEDIUM("medium", "Medium"),
    HARD("hard", "Hard")
}

enum class QuestionCategory(val value: String, val displayName: String) {
    // Behavioral Categories
    LEADERSHIP("leadership", "Leadership"),
    TEAMWORK("teamwork", "Teamwork"),
    PROBLEM_SOLVING("problem-solving", "Problem Solving"),
    COMMUNICATION("communication", "Communication"),
    ADAPTABILITY("adaptability", "Adaptability"),
    CONFLICT_RESOLUTION("conflict-resolution", "Conflict Resolution"),
    
    // Technical Categories
    ALGORITHMS("algorithms", "Algorithms"),
    DATA_STRUCTURES("data-structures", "Data Structures"),
    SYSTEM_DESIGN("system-design", "System Design"),
    DATABASE("database", "Database"),
    NETWORKING("networking", "Networking"),
    SECURITY("security", "Security"),
    FRONTEND("frontend", "Frontend"),
    BACKEND("backend", "Backend"),
    MOBILE("mobile", "Mobile Development")
}

// Jack-dev generate questions DTOs
data class GenerateQuestionsFromDescriptionRequest(
    val jobDescription: String,
    val jobId: String
)

data class GenerateQuestionsFromDescriptionResponse(
    val success: Boolean,
    val data: List<LeetCodeTopic>? = null,
    val message: String? = null,
    val error: String? = null
)

data class LeetCodeTopic(
    val topic: String,
    val questions: List<LeetCodeQuestion>
)

data class LeetCodeQuestion(
    val id: String,
    val title: String,
    val url: String,
    val difficulty: String? = null,
    val tags: List<String>? = null
)
