package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.SessionModels.Session
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
class SessionListViewModel @Inject constructor(
    private val sessionRepository: SessionRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    sealed class UiState {
        object Loading : UiState()
        data class Success(val sessions: List<Session>) : UiState()
        data class Error(val message: String) : UiState()
    }
    
    fun loadSessions() {
        viewModelScope.launch {
            try {
                _uiState.value = UiState.Loading
                val response = sessionRepository.getUserSessions()
                
                if (response.isSuccessful && response.body()?.data != null) {
                    val sessions = response.body()!!.data!!.sessions
                    _uiState.value = UiState.Success(sessions)
                } else {
                    _uiState.value = UiState.Error(
                        response.body()?.message ?: "Failed to load sessions"
                    )
                }
            } catch (e: IOException) {
                _uiState.value = UiState.Error("Network error: ${e.message ?: "Unknown error"}")
            } catch (e: HttpException) {
                _uiState.value = UiState.Error("Server error: ${e.message()}")
            }
        }
    }
}
