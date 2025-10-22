package com.cpen321.usermanagement.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.repository.DiscussionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DiscussionUiState(
    val isLoading: Boolean = false,
    val discussions: List<DiscussionListResponse> = emptyList(),
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class DiscussionViewModel @Inject constructor(
    private val repository: DiscussionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DiscussionUiState())
    val uiState: StateFlow<DiscussionUiState> = _uiState

    /**
     * Fetch all discussions from the backend
     */
    fun loadDiscussions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, successMessage = null)

            try {
                val response = repository.getAllDiscussions()

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            discussions = body.data ?: emptyList()
                        )
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = body?.message ?: "Unknown server error"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load discussions: ${response.code()}"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.localizedMessage ?: "Failed to load discussions"
                )
            }
        }
    }

    /**
     * Create a new discussion
     */
    fun createDiscussion(topic: String, description: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, successMessage = null)

            try {
                val response = repository.createDiscussion(topic, description)

                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            successMessage = body.message
                        )
                        loadDiscussions() // refresh after creation
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = body?.message ?: "Failed to create discussion"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to create discussion: ${response.code()}"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.localizedMessage ?: "Failed to create discussion"
                )
            }
        }
    }
}
