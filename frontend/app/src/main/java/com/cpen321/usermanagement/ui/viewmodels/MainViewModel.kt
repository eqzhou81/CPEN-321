package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionRequest
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionResponse
import com.cpen321.usermanagement.data.repository.SessionRepository
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonSyntaxException
import dagger.hilt.android.lifecycle.HiltViewModel
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
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
    
    fun clearErrorMessage() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
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
                handleSessionResponse(response)
            } catch (e: IOException) {
                handleSessionCreationError("Network error: ${e.message}")
            } catch (e: HttpException) {
                handleSessionCreationError("Network error: ${e.message}")
            }
        }
    }
    
    private fun handleSessionResponse(response: Response<ApiResponse<CreateSessionResponse>>) {
        when {
            response.isSuccessful && response.body()?.data?.session?.id != null -> {
                handleSuccessfulSessionResponse(response)
            }
            response.code() == 409 -> {
                handleExistingSessionResponse(response)
            }
            else -> {
                handleSessionCreationError(
                    response.body()?.message ?: "Failed to create session"
                )
            }
        }
    }
    
    private fun handleSuccessfulSessionResponse(response: Response<ApiResponse<CreateSessionResponse>>) {
        val sessionId = response.body()?.data?.session?.id
        if (sessionId != null) {
            _sessionCreated.value = sessionId
            _uiState.value = _uiState.value.copy(isCreatingSession = false)
        }
    }
    
    private fun handleExistingSessionResponse(response: Response<ApiResponse<CreateSessionResponse>>) {
        Log.d("MainViewModel", "409 response received - session already exists")
        val responseBody = response.body()
        val existingSessionId = responseBody?.data?.session?.id
        
        if (existingSessionId != null) {
            _sessionCreated.value = existingSessionId
            _uiState.value = _uiState.value.copy(isCreatingSession = false)
            Log.d("MainViewModel", "Resuming existing session: $existingSessionId")
        } else {
            parseSessionIdFromErrorBody(response)
        }
    }
    
    private fun parseSessionIdFromErrorBody(response: Response<ApiResponse<CreateSessionResponse>>) {
        try {
            val errorBodyString = response.errorBody()?.string()
            Log.d("MainViewModel", "Trying to parse session ID from error body")
            val gson = Gson()
            val jsonObject = gson.fromJson(errorBodyString, JsonObject::class.java)
            val dataObject = jsonObject.getAsJsonObject("data")
            val sessionObject = dataObject.getAsJsonObject("session")
            val sessionId = sessionObject.get("id").asString
            _sessionCreated.value = sessionId
            _uiState.value = _uiState.value.copy(isCreatingSession = false)
            Log.d("MainViewModel", "Successfully parsed session ID: $sessionId")
        } catch (e: IllegalStateException) {
            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
            handleSessionCreationError("An active session exists but could not be retrieved")
        } catch (e: JsonSyntaxException) {
            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
            handleSessionCreationError("An active session exists but could not be retrieved")
        }
    }
    
    private fun handleSessionCreationError(message: String) {
        _uiState.value = _uiState.value.copy(
            isCreatingSession = false,
            errorMessage = message
        )
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
                handleSessionResponse(response)
            } catch (e: IOException) {
                handleSessionCreationError("Network error: ${e.message}")
            } catch (e: HttpException) {
                handleSessionCreationError("Network error: ${e.message}")
            }
        }
    }
    
    fun clearSessionCreated() {
        _sessionCreated.value = null
    }
}
