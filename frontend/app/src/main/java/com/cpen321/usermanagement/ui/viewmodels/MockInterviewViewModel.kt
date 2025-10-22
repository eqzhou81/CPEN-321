package com.cpen321.usermanagement.ui.viewmodels

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
import javax.inject.Inject

@HiltViewModel
class MockInterviewViewModel @Inject constructor(
    private val sessionRepository: SessionRepository
) : ViewModel() {
    
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
            val isSubmitting: Boolean = false
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
            } catch (e: Exception) {
                _uiState.value = UiState.Error("Network error: ${e.message}")
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
                    
                    val currentQuestionId = if (currentState.session.currentQuestionIndex < currentState.session.questionIds.size) {
                        currentState.session.questionIds[currentState.session.currentQuestionIndex].id
                    } else {
                        currentState.currentQuestion?.id ?: ""
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
                        _uiState.value = UiState.Success(
                            session = responseData.session,
                            currentQuestion = currentState.currentQuestion,
                            feedback = responseData.feedback,
                            answer = "",
                            isSubmitting = false
                        )
                        
                        if (responseData.feedback.sessionCompleted) {
                        }
                    } else {
                        _uiState.value = currentState.copy(
                            isSubmitting = false
                        )
                    }
                } catch (e: Exception) {
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
                        _uiState.value = UiState.Success(
                            session = responseData.session,
                            currentQuestion = responseData.currentQuestion,
                            feedback = null,
                            answer = "",
                            isSubmitting = false
                        )
                    }
                } catch (e: Exception) {
                }
            }
        }
    }
    
    fun saveSession() {
        val currentState = _uiState.value
        if (currentState is UiState.Success) {
            viewModelScope.launch {
                try {
                    val request = UpdateStatusRequest(status = "paused")
                    
                    val response = sessionRepository.updateSessionStatus(
                        currentState.session.id,
                        request
                    )
                    
                    if (response.isSuccessful && response.body()?.data != null) {
                    }
                } catch (e: Exception) {
                }
            }
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
                            _uiState.value = UiState.Success(
                                session = responseData.session,
                                currentQuestion = responseData.currentQuestion,
                                feedback = null,
                                answer = "",
                                isSubmitting = false
                            )
                        }
                    } catch (e: Exception) {
                    }
                }
            }
        }
    }
}
