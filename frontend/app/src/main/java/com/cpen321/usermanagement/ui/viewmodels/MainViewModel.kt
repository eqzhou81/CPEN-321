package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionRequest
import com.cpen321.usermanagement.data.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val successMessage: String? = null,
    val isCreatingSession: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val sessionRepository: SessionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    private val _sessionCreated = MutableStateFlow<String?>(null)
    val sessionCreated: StateFlow<String?> = _sessionCreated.asStateFlow()

    fun setSuccessMessage(message: String) {
        _uiState.value = _uiState.value.copy(successMessage = message)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }
    
    fun createMockInterviewSession(jobId: String = "000000000000000000000000") {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isCreatingSession = true, errorMessage = null)
                
                val request = CreateSessionRequest(
                    jobId = jobId,
                    questionTypes = listOf("behavioral"),
                    questionCount = 5
                )
                
                val response = sessionRepository.createSession(request)
                
                if (response.isSuccessful && response.body()?.data != null) {
                    val sessionId = response.body()!!.data!!.session.id
                    _sessionCreated.value = sessionId
                    _uiState.value = _uiState.value.copy(isCreatingSession = false)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCreatingSession = false,
                        errorMessage = response.body()?.message ?: "Failed to create session"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isCreatingSession = false,
                    errorMessage = "Network error: ${e.message}"
                )
            }
        }
    }
    
    fun createMockInterviewSessionForQuestion(jobId: String, questionId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isCreatingSession = true, errorMessage = null)
                
                val request = CreateSessionRequest(
                    jobId = jobId,
                    questionTypes = listOf("behavioral"),
                    questionCount = 1,
                    specificQuestionId = questionId
                )
                
                val response = sessionRepository.createSession(request)
                
                if (response.isSuccessful && response.body()?.data != null) {
                    val sessionId = response.body()!!.data!!.session.id
                    _sessionCreated.value = sessionId
                    _uiState.value = _uiState.value.copy(isCreatingSession = false)
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCreatingSession = false,
                        errorMessage = response.body()?.message ?: "Failed to create session"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isCreatingSession = false,
                    errorMessage = "Network error: ${e.message}"
                )
            }
        }
    }
    
    fun clearSessionCreated() {
        _sessionCreated.value = null
    }
}
