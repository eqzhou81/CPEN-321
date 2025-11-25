package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.SessionModels.CreateSessionRequest
import com.cpen321.usermanagement.data.repository.SessionRepository
import com.google.gson.Gson
import com.google.gson.JsonObject
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
                } else if (response.code() == 409) {
                    Log.d("MainViewModel", "409 response received - session already exists")
                    val responseBody = response.body()
                    val existingSessionId = responseBody?.data?.session?.id
                    
                    if (existingSessionId != null) {
                        // Found existing session ID in response
                        _sessionCreated.value = existingSessionId
                        _uiState.value = _uiState.value.copy(isCreatingSession = false)
                        Log.d("MainViewModel", "Resuming existing session: $existingSessionId")
                    } else {
                        // Try to parse from error body
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
                        } catch (e: org.json.JSONException) {
                            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
                            _uiState.value = _uiState.value.copy(
                                isCreatingSession = false,
                                errorMessage = "An active session exists but could not be retrieved"
                            )
                        } catch (e: com.google.gson.JsonSyntaxException) {
                            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
                            _uiState.value = _uiState.value.copy(
                                isCreatingSession = false,
                                errorMessage = "An active session exists but could not be retrieved"
                            )
                        }
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCreatingSession = false,
                        errorMessage = response.body()?.message ?: "Failed to create session"
                    )
                }
            } catch (e: retrofit2.HttpException) {
                _uiState.value = _uiState.value.copy(
                    isCreatingSession = false,
                    errorMessage = "Network error: ${e.message}"
                )
            } catch (e: java.io.IOException) {
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
                } else if (response.code() == 409) {
                    Log.d("MainViewModel", "409 response received - session already exists")
                    val responseBody = response.body()
                    val existingSessionId = responseBody?.data?.session?.id
                    
                    if (existingSessionId != null) {
                        // Found existing session ID in response
                        _sessionCreated.value = existingSessionId
                        _uiState.value = _uiState.value.copy(isCreatingSession = false)
                        Log.d("MainViewModel", "Resuming existing session: $existingSessionId")
                    } else {
                        // Try to parse from error body
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
                        } catch (e: org.json.JSONException) {
                            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
                            _uiState.value = _uiState.value.copy(
                                isCreatingSession = false,
                                errorMessage = "An active session exists but could not be retrieved"
                            )
                        } catch (e: com.google.gson.JsonSyntaxException) {
                            Log.e("MainViewModel", "Failed to parse existing session ID: ${e.message}")
                            _uiState.value = _uiState.value.copy(
                                isCreatingSession = false,
                                errorMessage = "An active session exists but could not be retrieved"
                            )
                        }
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCreatingSession = false,
                        errorMessage = response.body()?.message ?: "Failed to create session"
                    )
                }
            } catch (e: retrofit2.HttpException) {
                _uiState.value = _uiState.value.copy(
                    isCreatingSession = false,
                    errorMessage = "Network error: ${e.message}"
                )
            } catch (e: java.io.IOException) {
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
