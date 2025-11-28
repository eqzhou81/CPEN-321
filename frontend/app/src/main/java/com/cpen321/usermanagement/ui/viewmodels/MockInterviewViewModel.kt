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
                    
                    if (currentQuestionId.isBlank()) {
                        _uiState.value = currentState.copy(isSubmitting = false)
                        return@launch
                    }
                    
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
                                isSubmitting = false
                            )
                        } else {
                            // Fallback to response data if reload fails
                            _uiState.value = UiState.Success(
                                session = responseData.session,
                                currentQuestion = currentState.currentQuestion,
                                feedback = responseData.feedback,
                                answer = "",
                                isSubmitting = false
                            )
                        }
                    } else {
                        _uiState.value = currentState.copy(
                            isSubmitting = false
                        )
                    }
                } catch (e: IOException) {
                    _uiState.value = currentState.copy(isSubmitting = false)
                } catch (e: HttpException) {
                    _uiState.value = currentState.copy(isSubmitting = false)
                }
            }
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
                            isSubmitting = false
                        )
                        currentAnswer = preservedAnswer
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to navigate to previous question", e)
                }
            }
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
                    val updatedState = (_uiState.value as? UiState.Success)?.copy(
                        isSaving = false,
                        saveMessage = "Session saved successfully"
                    )
                    _uiState.value = updatedState ?: _uiState.value
                    
                    // Clear message after 3 seconds
                    kotlinx.coroutines.delay(3000)
                    _uiState.value = (updatedState?.copy(saveMessage = null)) ?: _uiState.value
                } catch (e: IOException) {
                    Log.e(TAG, "Failed to save session", e)
                    _uiState.value = (_uiState.value as? UiState.Success)?.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message}"
                    ) ?: _uiState.value
                } catch (e: HttpException) {
                    Log.e(TAG, "Failed to save session", e)
                    _uiState.value = (_uiState.value as? UiState.Success)?.copy(
                        isSaving = false,
                        saveMessage = "Failed to save session: ${e.message()}"
                    ) ?: _uiState.value
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
                                isSubmitting = false
                            )
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to navigate to next question", e)
                        // Keep current state - navigation failure shouldn't disrupt user experience
                    }
                }
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
