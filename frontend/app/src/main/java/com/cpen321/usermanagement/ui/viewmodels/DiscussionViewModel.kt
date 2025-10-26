package com.cpen321.usermanagement.ui.viewmodels

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.api.DiscussionDetailResponse
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.remote.api.MessageResponse
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.data.repository.DiscussionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.socket.client.IO
import io.socket.client.Socket

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
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

    fun connectToSocket(discussionId: String) {
        try {
            socket = IO.socket("http://10.0.2.2:3000") // use your backend IP
            socket?.connect()

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketIO", "Connected to server")
                socket?.emit("joinDiscussion", discussionId)
            }

            socket?.on("messageReceived") { args ->
                if (args.isNotEmpty()) {
                    try {
                        val data = args[0] as JSONObject
                        val message = MessageResponse(
                            id = data.optString("id", data.optString("_id", "")), // handles either id/_id
                            userId = data.getString("userId"),
                            userName = data.getString("userName"),
                            content = data.getString("content"),
                            createdAt = data.getString("createdAt"),
                            updatedAt = data.getString("updatedAt")
                        )

                        viewModelScope.launch {
                            // only add if not already there
                            val exists = _messages.value.any { it.id == message.id }
                            if (!exists) {
                                _messages.value = _messages.value + message
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("SocketIO", "Error parsing message: ${e.message}")
                    }
                }
            }

        } catch (e: Exception) {
            Log.e("SocketIO", "Error connecting: ${e.message}")
        }
    }


    private val _uiState = MutableStateFlow(DiscussionUiState())
    val uiState: StateFlow<DiscussionUiState> = _uiState

    private val _discussions = MutableLiveData<List<DiscussionListResponse>>()
    val discussions: LiveData<List<DiscussionListResponse>> = _discussions

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    /**
     * Fetch all discussions from the backend
     */
    fun loadDiscussions() {
        viewModelScope.launch {
            Log.d("DiscussionViewModel", "🔹 Loading discussions...")
            val result = repository.getAllDiscussions()
            result
                .onSuccess { discussionsList ->
                    Log.d("DiscussionViewModel", "✅ Got discussions: ${discussionsList.size}")
                    discussionsList.forEach { Log.d("DiscussionViewModel", "Topic: ${it.topic}") }

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
        }


    }

    /**
     * Create a new discussion
     */
    fun createDiscussion(topic: String, description: String?) {
        viewModelScope.launch {
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

                result
                    .onSuccess { response ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            successMessage = response.message // from CreateDiscussionResponse
                        )
                        loadDiscussions() // refresh after creation
                    }
                    .onFailure { e ->
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = e.localizedMessage ?: "Failed to create discussion"
                        )
                    }
            } catch (e: Exception) {
                Log.e("DiscussionViewModel", "Error in createDiscussion", e)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to create discussion"
                )
            }
        }
    }

    fun loadDiscussionById(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getDiscussionById(id)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        selectedDiscussion = it
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
                }
        }
    }

//    fun postMessage(discussionId: String, content: String) {
//        viewModelScope.launch {
//            repository.postMessage(discussionId, content)
//                .onSuccess {
//                    // Refresh discussion after posting
//                    loadDiscussionById(discussionId)
//                }
//                .onFailure {
//                    _uiState.value = _uiState.value.copy(error = it.message)
//                }
//        }
//    }

    //for real time updates



    fun sendMessage(discussionId: String, content: String, userName: String, userId: String) {
        // 1️⃣ Send to backend to persist
        viewModelScope.launch {
            repository.postMessage(discussionId, content)
        }

        // 2️⃣ Send via socket for real-time broadcast
        val messageData = JSONObject().apply {
            put("discussionId", discussionId)
            put("userId", userId)
            put("userName", userName)
            put("content", content)
            put("createdAt", System.currentTimeMillis().toString())
        }
        socket?.emit("newMessage", discussionId, messageData)
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




}

