package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.remote.api.DiscussionDetailResponse
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.remote.api.MessageResponse
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.Discussion
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.DiscussionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONException

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONException
import org.json.JSONObject
import javax.inject.Inject

data class DiscussionUiState(
    val isLoading: Boolean = false,
    val discussions: List<DiscussionListResponse> = emptyList(),
    val selectedDiscussion: DiscussionDetailResponse? = null,
    val error: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class DiscussionViewModel @Inject constructor(
    private val repository: DiscussionRepository,
    private val authRepository: AuthRepository
) : ViewModel() {


    private var socket: Socket? = null

    private val _messages = MutableStateFlow<List<MessageResponse>>(emptyList())
    val messages: StateFlow<List<MessageResponse>> = _messages

    private val _uiState = MutableStateFlow(DiscussionUiState())
    val uiState: StateFlow<DiscussionUiState> = _uiState

    // Remove this separate LiveData and use uiState instead
    // private val _discussions = MutableLiveData<List<DiscussionListResponse>>(emptyList())
    // val discussions: LiveData<List<DiscussionListResponse>> = _discussions

    private fun setupSocketEventHandlers(discussionId: String?) {
        setupConnectionHandlers(discussionId)
        setupMessageReceivedHandler()
        setupNewDiscussionHandler()
    }
    
    private fun setupConnectionHandlers(discussionId: String?) {
        socket?.on(Socket.EVENT_CONNECT) {
            Log.d("SocketIO", "✅ Connected to server")
            discussionId?.let {
                socket?.emit("joinDiscussion", it)
                Log.d("SocketIO", "Joined discussion room $it")
            }
        }

        socket?.on(Socket.EVENT_DISCONNECT) {
            Log.d("SocketIO", "⚠️ Disconnected from server")
        }

        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e("SocketIO", "❌ Connection error: ${args.joinToString()}")
        }
    }
    
    private fun setupMessageReceivedHandler() {
        socket?.on("messageReceived") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val message = MessageResponse(
                        id = data.optString("id", data.optString("_id", "")),
                        userId = data.getString("userId"),
                        userName = data.getString("userName"),
                        content = data.getString("content"),
                        createdAt = data.getString("createdAt"),
                        updatedAt = data.getString("updatedAt")
                    )
                    viewModelScope.launch {
                        val exists = _messages.value.any { it.id == message.id }
                        if (!exists) {
                            _messages.value = _messages.value + message
                        }
                    }
                } catch (e: org.json.JSONException) {
                    Log.e("SocketIO", "❌ Error parsing message: ${e.message}")
                } catch (e: ClassCastException) {
                    Log.e("SocketIO", "❌ Error parsing message: ${e.message}")
                }
            }
        }
    }
    
    private fun setupNewDiscussionHandler() {
        socket?.on("newDiscussion") { args ->
            if (args.isNotEmpty()) {
                try {
                    val data = args[0] as JSONObject
                    val discussion = DiscussionListResponse(
                        id = data.optString("id", data.optString("_id", "")),
                        topic = data.getString("topic"),
                        description = data.optString("description", ""),
                        creatorId = data.getString("creatorId"),
                        creatorName = data.getString("creatorName"),
                        messageCount = data.optInt("messageCount", 0),
                        participantCount = data.optInt("participantCount", 0),
                        lastActivityAt = data.optString("lastActivityAt", ""),
                        createdAt = data.optString("createdAt", "")
                    )
                    viewModelScope.launch {
                        val currentList = _uiState.value.discussions
                        val exists = currentList.any { it.id == discussion.id }
                        if (!exists) {
                            val updatedList = listOf(discussion) + currentList
                            _uiState.value = _uiState.value.copy(discussions = updatedList)
                            Log.d("SocketIO", "🆕 New discussion received: ${discussion.topic}")
                        }
                    }
                } catch (e: JSONException) {
                    Log.e("SocketIO", "❌ Error parsing newDiscussion: ${e.message}")
                } catch (e: ClassCastException) {
                    Log.e("SocketIO", "❌ Error parsing newDiscussion: ${e.message}")
                }
            }
        }
    }

    fun connectToSocket(discussionId: String? = null) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                socket?.disconnect()
                socket = null
                socket = IO.socket(BuildConfig.IMAGE_BASE_URL)
                setupSocketEventHandlers(discussionId)
                socket?.connect()
            } catch (e: Exception) {
                Log.e("SocketIO", "❌ Error connecting socket: ${e.message}", e)
                viewModelScope.launch {
                    _uiState.value = _uiState.value.copy(
                        error = "Failed to connect to chat server: ${e.message}"
                    )
                }
            }
        }
    }




    /**
     * Fetch all discussions from the backend
     */
    fun loadDiscussions() {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                Log.d("DiscussionViewModel", "🔹 Loading discussions...")
                val result = repository.getAllDiscussions()
                result
                    .onSuccess { discussionsList ->
                        Log.d("DiscussionViewModel", "✅ Got discussions: ${discussionsList.size}")
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            discussions = discussionsList,
                            error = null
                        )
                    }
                    .onFailure { e ->
                        Log.e("DiscussionViewModel", "❌ Failed to load discussions", e)
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load discussions"
                        )
                    }
            } catch (e: Exception) {
                Log.e("DiscussionViewModel", "❌ Exception loading discussions", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load discussions"
                )
            }
        }
    }

    /**
     * Create a new discussion
     */
    fun createDiscussion(topic: String, description: String) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true, error = null, successMessage = null)

                // Ensure token is set before making API calls
                val token = authRepository.getStoredToken()
                if (token != null) {
                    RetrofitClient.setAuthToken(token)
                    Log.d("DiscussionViewModel", "Token set before createDiscussion: ${token.take(15)}...")
                } else {
                    Log.w("DiscussionViewModel", "No token available for createDiscussion")
                }

                val result = repository.createDiscussion(topic, description)
                result.onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, successMessage = "Discussion created!")
                    // Reload discussions to show the new one
                    loadDiscussions()
                }.onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "An unexpected error occurred",
                        discussions = _uiState.value.discussions
                    )
                }
            } catch (e: Exception) {
                Log.e("DiscussionViewModel", "Error in createDiscussion", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to create discussion",
                    discussions = _uiState.value.discussions
                )
            }
        }
    }

    fun loadDiscussionById(id: String) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                repository.getDiscussionById(id)
                    .onSuccess {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            selectedDiscussion = it
                        )
                    }
                    .onFailure { e ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.message ?: "Failed to load discussion"
                        )
                    }
            } catch (e: Exception) {
                Log.e("DiscussionViewModel", "❌ Exception loading discussion", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load discussion"
                )
            }
        }
    }






    fun sendMessage(discussionId: String, content: String, userName: String, userId: String) {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val result = repository.postMessage(discussionId, content)
                result.onSuccess {
                    // Message sent successfully - socket will handle UI update
                }.onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "An unexpected error occurred",
                        discussions = _uiState.value.discussions
                    )
                }
            } catch (e: Exception) {
                Log.e("DiscussionViewModel", "❌ Exception sending message", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to send message"
                )
            }
        }
    }




    override fun onCleared() {
        super.onCleared()
        socket?.disconnect()
        socket = null
    }

    fun clearMessages() {
        _messages.value = emptyList()
    }

    fun clearSelectedDiscussion() {
        _uiState.value = _uiState.value.copy(selectedDiscussion = null)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    private fun parseErrorMessage(errorBody: String?): String {
        return try {
            if (errorBody.isNullOrBlank()) return "Unknown error"
            val json = JSONObject(errorBody)
            json.optString("message", "Unknown error")
        } catch (e: Exception) {
            "Unknown error"
        }
    }




}

