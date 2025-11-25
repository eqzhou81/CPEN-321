package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.repository.QuestionRepository
import com.cpen321.usermanagement.data.remote.dto.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel for question generation and management functionality
 * Handles UI state and business logic for behavioral and technical questions
 */
@HiltViewModel
class QuestionViewModel @Inject constructor(
    private val questionRepository: QuestionRepository
) : ViewModel() {
    
    // Questions State
    private val _questions = MutableStateFlow<QuestionsData?>(null)
    val questions: StateFlow<QuestionsData?> = _questions.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    // Question Progress State
    private val _questionProgress = MutableStateFlow<QuestionProgress?>(null)
    val questionProgress: StateFlow<QuestionProgress?> = _questionProgress.asStateFlow()
    
    // Selected Question State
    private val _selectedQuestion = MutableStateFlow<BehavioralQuestion?>(null)
    val selectedQuestion: StateFlow<BehavioralQuestion?> = _selectedQuestion.asStateFlow()
    
    private val _selectedTechnicalQuestion = MutableStateFlow<TechnicalQuestion?>(null)
    val selectedTechnicalQuestion: StateFlow<TechnicalQuestion?> = _selectedTechnicalQuestion.asStateFlow()
    
    // Answer Submission State
    private val _isSubmittingAnswer = MutableStateFlow(false)
    val isSubmittingAnswer: StateFlow<Boolean> = _isSubmittingAnswer.asStateFlow()
    
    private val _submittedAnswer = MutableStateFlow<SubmittedAnswer?>(null)
    val submittedAnswer: StateFlow<SubmittedAnswer?> = _submittedAnswer.asStateFlow()
    
    // Question Generation
    
    fun generateQuestions(
        jobId: String,
        questionTypes: List<QuestionType> = listOf(QuestionType.BEHAVIORAL, QuestionType.TECHNICAL)
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            questionRepository.generateQuestions(jobId, questionTypes).fold(
                onSuccess = { questionsData ->
                    _questions.value = questionsData
                    loadQuestionProgress(jobId)
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to generate questions"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    // Jack-dev generate questions from description
    fun generateQuestionsFromDescription(jobDescription: String, jobId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            questionRepository.generateQuestionsFromDescription(jobDescription, jobId).fold(
                onSuccess = { response ->
                    if (response.success) {
                        // Questions are now stored in the database, reload them
                        loadQuestions(jobId, QuestionType.TECHNICAL)
                    } else {
                        _error.value = response.message ?: "Failed to generate questions"
                    }
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to generate questions from description"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    private fun convertLeetCodeTopicsToQuestionsData(topics: List<LeetCodeTopic>): QuestionsData {
        val technicalQuestions = mutableListOf<TechnicalQuestion>()
        
        topics.forEach { topic ->
            topic.questions.forEach { question ->
                technicalQuestions.add(
                    TechnicalQuestion(
                        id = question.id,
                        jobId = "leetcode-generated", // Placeholder job ID
                        title = question.title,
                        description = "LeetCode problem for ${topic.topic}",
                        difficulty = when (question.difficulty?.lowercase()) {
                            "easy" -> QuestionDifficulty.EASY
                            "medium" -> QuestionDifficulty.MEDIUM
                            "hard" -> QuestionDifficulty.HARD
                            else -> QuestionDifficulty.MEDIUM
                        },
                        tags = listOf(topic.topic),
                        language = null,
                        hints = null,
                        testCases = null,
                        expectedSolution = null,
                        userSolution = null,
                        completedAt = null,
                        createdAt = java.time.Instant.now().toString(),
                        updatedAt = java.time.Instant.now().toString()
                    )
                )
            }
        }
        
        return QuestionsData(
            behavioralQuestions = emptyList(),
            technicalQuestions = technicalQuestions,
            totalQuestions = technicalQuestions.size,
            jobApplication = JobApplication(
                id = "leetcode-generated",
                userId = "mock-user",
                title = "LeetCode Generated Questions",
                company = "LeetCode",
                description = "AI-generated LeetCode questions",
                location = "Remote",
                url = null,
                salary = null,
                jobType = null,
                experienceLevel = null,
                requirements = emptyList(),
                skills = emptyList(),
                createdAt = java.time.Instant.now().toString(),
                updatedAt = java.time.Instant.now().toString()
            )
        )
    }
    
    fun loadQuestions(
        jobId: String,
        type: QuestionType? = null
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            questionRepository.getQuestions(jobId, type).fold(
                onSuccess = { questionsData ->
                    _questions.value = questionsData
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to load questions"
                }
            )
            
            _isLoading.value = false
        }
    }
    
    fun loadQuestionProgress(jobId: String) {
        viewModelScope.launch {
            questionRepository.getQuestionProgress(jobId).fold(
                onSuccess = { progress ->
                    _questionProgress.value = progress
                },
                onFailure = { exception ->
                    // Don't show error for progress, it's not critical
                }
            )
        }
    }
    
    // Individual Question Management
    
    fun selectBehavioralQuestion(question: BehavioralQuestion) {
        _selectedQuestion.value = question
        _selectedTechnicalQuestion.value = null
    }
    
    fun selectTechnicalQuestion(question: TechnicalQuestion) {
        _selectedTechnicalQuestion.value = question
        _selectedQuestion.value = null
    }
    
    fun clearSelectedQuestion() {
        _selectedQuestion.value = null
        _selectedTechnicalQuestion.value = null
    }
    
    fun submitAnswer(
        questionId: String,
        answer: String,
        questionType: QuestionType
    ) {
        viewModelScope.launch {
            _isSubmittingAnswer.value = true
            _error.value = null
            
            questionRepository.submitAnswer(questionId, answer, questionType).fold(
                onSuccess = { submittedAnswer ->
                    _submittedAnswer.value = submittedAnswer
                    // Update the question as completed
                    updateQuestionCompletion(questionId, answer)
                },
                onFailure = { exception ->
                    _error.value = exception.message ?: "Failed to submit answer"
                }
            )
            
            _isSubmittingAnswer.value = false
        }
    }
    
    fun updateQuestionCompletion(questionId: String, isCompleted: Boolean) {
        viewModelScope.launch {
            try {
                // Update local state immediately for UI responsiveness
                val currentQuestions = _questions.value
                if (currentQuestions != null) {
                    val updatedBehavioralQuestions = currentQuestions.behavioralQuestions.map { question ->
                        if (question.id == questionId) {
                            question.copy(
                                status = if (isCompleted) "completed" else "pending"
                            )
                        } else {
                            question
                        }
                    }
                    
                    val updatedTechnicalQuestions = currentQuestions.technicalQuestions.map { question ->
                        if (question.id == questionId) {
                            question.copy(
                                status = if (isCompleted) "completed" else "pending"
                            )
                        } else {
                            question
                        }
                    }
                    
                    _questions.value = currentQuestions.copy(
                        behavioralQuestions = updatedBehavioralQuestions,
                        technicalQuestions = updatedTechnicalQuestions
                    )
                }
                
                // Call API to persist the change
                questionRepository.toggleQuestionCompleted(questionId).fold(
                    onSuccess = {
                        // Success - local state already updated
                        // Reload progress to ensure accuracy
                        val currentQuestions = _questions.value
                        currentQuestions?.let { questions ->
                            // Extract jobId from questions data
                            val jobId = questions.jobApplication?.id
                            if (jobId != null) {
                                loadQuestionProgress(jobId)
                            }
                        }
                    },
                    onFailure = { exception ->
                        // Revert local state on API failure
                        val currentQuestions = _questions.value
                        if (currentQuestions != null) {
                            val revertedBehavioralQuestions = currentQuestions.behavioralQuestions.map { question ->
                                if (question.id == questionId) {
                                    question.copy(
                                        status = if (isCompleted) "pending" else "completed"
                                    )
                                } else {
                                    question
                                }
                            }
                            
                            val revertedTechnicalQuestions = currentQuestions.technicalQuestions.map { question ->
                                if (question.id == questionId) {
                                    question.copy(
                                        status = if (isCompleted) "pending" else "completed"
                                    )
                                } else {
                                    question
                                }
                            }
                            
                            _questions.value = currentQuestions.copy(
                                behavioralQuestions = revertedBehavioralQuestions,
                                technicalQuestions = revertedTechnicalQuestions
                            )
                        }
                        _error.value = exception.message ?: "Failed to update question completion"
                    }
                )
            } catch (e: retrofit2.HttpException) {
                _error.value = e.message ?: "Failed to update question completion"
            } catch (e: java.io.IOException) {
                _error.value = e.message ?: "Failed to update question completion"
            }
        }
    }
    
    private fun updateQuestionCompletion(questionId: String, answer: String) {
        val currentQuestions = _questions.value
        if (currentQuestions != null) {
            val updatedBehavioralQuestions = currentQuestions.behavioralQuestions.map { question ->
                if (question.id == questionId) {
                    question.copy(
                        status = "completed",
                        userAnswer = answer,
                        completedAt = java.time.Instant.now().toString()
                    )
                } else {
                    question
                }
            }
            
            val updatedTechnicalQuestions = currentQuestions.technicalQuestions.map { question ->
                if (question.id == questionId) {
                    question.copy(
                        status = "completed",
                        userSolution = answer,
                        completedAt = java.time.Instant.now().toString()
                    )
                } else {
                    question
                }
            }
            
            _questions.value = currentQuestions.copy(
                behavioralQuestions = updatedBehavioralQuestions,
                technicalQuestions = updatedTechnicalQuestions
            )
        }
    }
    
    // Utility Functions
    
    fun clearError() {
        _error.value = null
    }
    
    fun clearSubmittedAnswer() {
        _submittedAnswer.value = null
    }
    
    fun getDifficultyColor(difficulty: QuestionDifficulty): Int {
        return when (difficulty) {
            QuestionDifficulty.EASY -> com.cpen321.usermanagement.R.color.success
            QuestionDifficulty.MEDIUM -> com.cpen321.usermanagement.R.color.warning
            QuestionDifficulty.HARD -> com.cpen321.usermanagement.R.color.error
        }
    }
}
