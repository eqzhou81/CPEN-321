package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.SessionModels.Session
import com.cpen321.usermanagement.data.remote.dto.SessionModels.Question
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SubmitAnswerRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.NavigateRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.UpdateStatusRequest
import com.cpen321.usermanagement.data.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

@HiltViewModel
class MockInterviewViewModel @Inject constructor(
    private val sessionRepository: SessionRepository
) : ViewModel() {
    
    companion object {
        private const val TAG = "MockInterviewViewModel"
    }
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    private var currentSessionId: String? = null
    private var currentAnswer: String = ""
    
    sealed class UiState {
        object Loading : UiState()
        data class Success(
            val session: Session,
            val currentQuestion: Question?,
            val feedback: SessionFeedback? = null,
            val answer: String = "",
            val isSubmitting: Boolean = false,
            val isSaving: Boolean = false,
            val saveMessage: String? = null
        ) : UiState()
        data class Error(val message: String) : UiState()
    }
    
    fun loadSession(sessionId: String) {
        currentSessionId = sessionId
        viewModelScope.launch {
            try {
                _uiState.value = UiState.Loading
                val response = sessionRepository.getSession(sessionId)
                
                if (response.isSuccessful && response.body()?.data != null) {
                    val sessionData = response.body()!!.data!!
                    _uiState.value = UiState.Success(
                        session = sessionData.session,
                        currentQuestion = sessionData.currentQuestion,
                        answer = currentAnswer
                    )
                } else {
                    _uiState.value = UiState.Error(
                        response.body()?.message ?: "Failed to load session"
                    )
                }
            } catch (e: IOException) {
                _uiState.value = UiState.Error("Network error: ${e.message}")
            } catch (e: retrofit2.HttpException) {
                _uiState.value = UiState.Error("Server error: ${e.message}")
            }
        }
    }
    
    fun updateAnswer(answer: String) {
        currentAnswer = answer
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            _uiState.value = currentState.copy(answer = answer)
        }
    }
    
    fun submitAnswer() {
        val currentState = _uiState.value
        if (currentState is UiState.Success && currentAnswer.isNotBlank()) {
            viewModelScope.launch {
                try {
                    _uiState.value = currentState.copy(isSubmitting = true)
                    
                    val currentQuestionId = getCurrentQuestionId(currentState)
                    
                    if (currentQuestionId.isNotBlank()) {
                        handleAnswerSubmission(
                            currentState = currentState,
                            currentQuestionId = currentQuestionId
                        )
                    } else {
                        Log.e(TAG, "Cannot submit answer: currentQuestionId is blank")
                        _uiState.value = currentState.copy(
                            isSubmitting = false,
                            saveMessage = "Error: Question ID not found"
                        )
                    }
                } catch (e: IOException) {
                    Log.e(TAG, "Failed to submit answer", e)
                    _uiState.value = currentState.copy(
                        isSubmitting = false,
                        saveMessage = "Network error: ${e.message}"
                    )
                } catch (e: HttpException) {
                    Log.e(TAG, "Failed to submit answer", e)
                    _uiState.value = currentState.copy(
                        isSubmitting = false,
                        saveMessage = "Server error: ${e.message()}"
                    )
                }
            }
        } else {
            Log.d(TAG, "Cannot submit: answer is blank or state is not Success")
        }
    }
    
    private suspend fun handleAnswerSubmission(
        currentState: UiState.Success,
        currentQuestionId: String
    ) {
                    val request = SubmitAnswerRequest(
                        sessionId = currentState.session.id,
                        questionId = currentQuestionId,
                        answer = currentAnswer
                    )
                    
                    val response = sessionRepository.submitAnswer(request)
                    
                    if (response.isSuccessful && response.body()?.data != null) {
                        val responseData = response.body()!!.data!!
            currentAnswer = ""
                        
            // Reload session to get the latest progress and current question
                        val updatedSessionResponse = sessionRepository.getSession(currentState.session.id)
            if (updatedSessionResponse.isSuccessful && updatedSessionResponse.body()?.data != null) {
                val sessionData = updatedSessionResponse.body()!!.data!!
                _uiState.value = UiState.Success(
                    session = sessionData.session,
                    currentQuestion = sessionData.currentQuestion,
                    feedback = responseData.feedback,
                    answer = "",
                    isSubmitting = false,
                    isSaving = false
                )
                        } else {
                // Fallback to response data if reload fails
                        _uiState.value = UiState.Success(
                    session = responseData.session,
                    currentQuestion = currentState.currentQuestion,
                            feedback = responseData.feedback,
                            answer = "",
                    isSubmitting = false,
                    isSaving = false
                        )
                        }
                    } else {
            val errorBody = response.errorBody()?.string() ?: response.message()
            Log.e(TAG, "Failed to submit answer: $errorBody")
                        _uiState.value = currentState.copy(
                isSubmitting = false,
                saveMessage = "Failed to submit answer: ${errorBody ?: "Unknown error"}"
            )
        }
    }
    
    fun previousQuestion() {
        val currentState = _uiState.value
        if (currentState is UiState.Success && currentState.session.currentQuestionIndex > 0) {
            viewModelScope.launch {
                try {
                    val request = NavigateRequest(
                        questionIndex = currentState.session.currentQuestionIndex - 1
                    )
                    
                    val response = sessionRepository.navigateToQuestion(
                        currentState.session.id,
                        request
                    )
                    
                    if (response.isSuccessful && response.body()?.data != null) {
                        val responseData = response.body()!!.data!!
                        // Preserve current answer if navigating to previous question
                        val preservedAnswer = if (currentState.session.currentQuestionIndex > responseData.session.currentQuestionIndex) {
                            currentAnswer
                        } else {
                            ""
                        }
                        _uiState.value = UiState.Success(
                            session = responseData.session,
                            currentQuestion = responseData.currentQuestion,
                            feedback = null,
                            answer = preservedAnswer,
                            isSubmitting = false,
                            isSaving = false,
                            saveMessage = null
                        )
                        currentAnswer = preservedAnswer
                    } else {
                        val errorBody = response.errorBody()?.string() ?: response.message()
                        Log.e(TAG, "Failed to navigate to previous question: $errorBody")
                        _uiState.value = currentState.copy(
                            saveMessage = "Failed to navigate: ${errorBody ?: "Unknown error"}"
                        )
                    }
                } catch (e: IOException) {
                    Log.e(TAG, "Network error navigating to previous question", e)
                    _uiState.value = currentState.copy(
                        saveMessage = "Network error: ${e.message ?: "Unknown error"}"
                    )
                } catch (e: HttpException) {
                    Log.e(TAG, "Server error navigating to previous question", e)
                    _uiState.value = currentState.copy(
                        saveMessage = "Server error: ${e.message() ?: "Unknown error"}"
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to navigate to previous question", e)
                    _uiState.value = currentState.copy(
                        saveMessage = "Error: ${e.message ?: "Unknown error"}"
                    )
                }
            }
        } else {
            Log.d(TAG, "Cannot go to previous question: already at first question or invalid state")
        }
    }
    
    fun saveSession() {
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            viewModelScope.launch {
                _uiState.value = currentState.copy(isSaving = true, saveMessage = null)
                try {
                    if (currentAnswer.isNotBlank()) {
                        // Save the answer first by submitting it
                        saveAnswerAndPauseSession(currentState)
                    } else {
                        // No answer to save, just pause the session
                        pauseSessionOnly(currentState)
                    }
                    
                    // Get the latest state after save
                    val latestState = _uiState.value as? UiState.Success
                    if (latestState != null) {
                        val updatedState = latestState.copy(
                            isSaving = false,
                            saveMessage = "Session saved successfully"
                        )
                        _uiState.value = updatedState
                        
                        // Clear message after 3 seconds
                        kotlinx.coroutines.delay(3000)
                        val finalState = _uiState.value as? UiState.Success
                        if (finalState != null) {
                            _uiState.value = finalState.copy(saveMessage = null)
                        }
                    }
                } catch (e: IOException) {
                    Log.e(TAG, "Failed to save session", e)
                    val latestState = _uiState.value as? UiState.Success
                    _uiState.value = latestState?.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message ?: "Network error"}"
                    ) ?: currentState.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message ?: "Network error"}"
                    )
                } catch (e: HttpException) {
                    Log.e(TAG, "Failed to save session", e)
                    val latestState = _uiState.value as? UiState.Success
                    _uiState.value = latestState?.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message() ?: "Server error"}"
                    ) ?: currentState.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message() ?: "Server error"}"
                    )
                }
            }
        }
    }
    
    private suspend fun saveAnswerAndPauseSession(currentState: UiState.Success) {
        val currentQuestionId = getCurrentQuestionId(currentState)
        if (currentQuestionId.isNotBlank()) {
            val request = SubmitAnswerRequest(
                sessionId = currentState.session.id,
                questionId = currentQuestionId,
                answer = currentAnswer
            )
            val submitResponse = sessionRepository.submitAnswer(request)
            
            if (submitResponse.isSuccessful && submitResponse.body()?.data != null) {
                pauseSessionOnly(currentState)
            } else {
                // Even if submit fails, try to pause the session
                pauseSessionOnly(currentState)
            }
        } else {
            pauseSessionOnly(currentState)
        }
    }
    
    private suspend fun pauseSessionOnly(currentState: UiState.Success) {
                    val request = UpdateStatusRequest(status = "paused")
                    val response = sessionRepository.updateSessionStatus(
                        currentState.session.id,
                        request
                    )
                    
                    if (response.isSuccessful && response.body()?.data != null) {
            reloadSessionState(currentState.session.id, currentState)
        }
    }
    
    private suspend fun reloadSessionState(sessionId: String, currentState: UiState.Success) {
        val updatedSessionResponse = sessionRepository.getSession(sessionId)
        if (updatedSessionResponse.isSuccessful && updatedSessionResponse.body()?.data != null) {
            val sessionData = updatedSessionResponse.body()!!.data!!
            val updatedSession = sessionData.session
            _uiState.value = currentState.copy(
                session = updatedSession,
                currentQuestion = sessionData.currentQuestion,
                answer = currentAnswer
            )
        }
    }
    
    private fun getCurrentQuestionId(currentState: UiState.Success): String {
        return if (currentState.session.currentQuestionIndex < currentState.session.questionIds.size) {
            currentState.session.questionIds[currentState.session.currentQuestionIndex].id
        } else {
            currentState.currentQuestion?.id ?: ""
        }
    }
    
    fun nextQuestion() {
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            val nextIndex = currentState.session.currentQuestionIndex + 1
            if (nextIndex < currentState.session.totalQuestions) {
                viewModelScope.launch {
                    try {
                        val request = NavigateRequest(questionIndex = nextIndex)
                        
                        val response = sessionRepository.navigateToQuestion(
                            currentState.session.id,
                            request
                        )
                        
                        if (response.isSuccessful && response.body()?.data != null) {
                            val responseData = response.body()!!.data!!
                            // Clear answer when moving to next question
                            currentAnswer = ""
                            _uiState.value = UiState.Success(
                                session = responseData.session,
                                currentQuestion = responseData.currentQuestion,
                                feedback = null,
                                answer = "",
                                isSubmitting = false,
                                isSaving = false,
                                saveMessage = null
                            )
                        } else {
                            val errorBody = response.errorBody()?.string() ?: response.message()
                            Log.e(TAG, "Failed to navigate to next question: $errorBody")
                            _uiState.value = currentState.copy(
                                saveMessage = "Failed to navigate: ${errorBody ?: "Unknown error"}"
                            )
                        }
                    } catch (e: IOException) {
                        Log.e(TAG, "Network error navigating to next question", e)
                        _uiState.value = currentState.copy(
                            saveMessage = "Network error: ${e.message ?: "Unknown error"}"
                        )
                    } catch (e: HttpException) {
                        Log.e(TAG, "Server error navigating to next question", e)
                        _uiState.value = currentState.copy(
                            saveMessage = "Server error: ${e.message() ?: "Unknown error"}"
                        )
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to navigate to next question", e)
                        _uiState.value = currentState.copy(
                            saveMessage = "Error: ${e.message ?: "Unknown error"}"
                        )
                    }
                }
            } else {
                Log.d(TAG, "Cannot go to next question: already at last question")
            }
        }
    }
    
    fun endSession(onComplete: () -> Unit) {
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            viewModelScope.launch {
                try {
                    val status = if (currentState.session.answeredQuestions >= currentState.session.totalQuestions) {
                        "completed"
                    } else {
                        "cancelled"
                    }
                    
                    val request = UpdateStatusRequest(status = status)
                    val response = sessionRepository.updateSessionStatus(
                        currentState.session.id,
                        request
                    )
                    
                    if (response.isSuccessful) {
                        onComplete()
                    } else {
                        // Even if update fails, navigate back
                        onComplete()
                    }
                } catch (e: IOException) {
                    Log.e(TAG, "Failed to end session", e)
                    // Navigate back even on error
                    onComplete()
                } catch (e: HttpException) {
                    Log.e(TAG, "Failed to end session", e)
                    // Navigate back even on error
                    onComplete()
                }
            }
        } else {
            onComplete()
        }
    }
}
