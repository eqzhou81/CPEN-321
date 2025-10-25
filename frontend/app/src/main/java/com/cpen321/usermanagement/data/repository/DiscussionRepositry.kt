package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.model.CreateDiscussionResponse
import com.cpen321.usermanagement.data.model.PostMessageResponse
import com.cpen321.usermanagement.data.remote.api.CreateDiscussionRequest
import com.cpen321.usermanagement.data.remote.api.DiscussionApi
import com.cpen321.usermanagement.data.remote.api.DiscussionDetailResponse
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.remote.api.PostMessageRequest
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import javax.inject.Inject
import javax.inject.Singleton
import retrofit2.Response

@Singleton
data class DiscussionRepository @Inject constructor(
    private val discussionApi: DiscussionApi
) {
    companion object {
        private const val TAG = "DiscussionRepository"
    }

    suspend fun getAllDiscussions(
        search: String? = null,
        sortBy: String = "recent",
        page: Int = 1,
        limit: Int = 20
    ): Result<List<DiscussionListResponse>> {
        return try {
            Log.d(TAG, "Making getAllDiscussions API call")
            val response = discussionApi.getAllDiscussions(search, sortBy, page, limit)
            Log.d(TAG, "getAllDiscussions response code: ${response.code()}")
            handleResponse(response, "Failed to fetch discussions")
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching discussions", e)
            Result.failure(e)
        }
    }

    suspend fun getDiscussionById(id: String): Result<DiscussionDetailResponse> {
        return try {
            val response = discussionApi.getDiscussionById(id)
            handleResponse(response, "Failed to fetch discussion details")
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching discussion details", e)
            Result.failure(e)
        }
    }

    suspend fun createDiscussion(topic: String, description: String? = null): Result<CreateDiscussionResponse> {
        return try {
            Log.d(TAG, "Making createDiscussion API call")
            val response = discussionApi.createDiscussion(CreateDiscussionRequest(topic, description))
            Log.d(TAG, "createDiscussion response code: ${response.code()}")
            handleRawResponse(response, "Failed to create discussion")
        } catch (e: Exception) {
            Log.e(TAG, "Error creating discussion", e)
            Result.failure(e)
        }
    }

    suspend fun postMessage(discussionId: String, content: String): Result<PostMessageResponse> {
        return try {
            val response = discussionApi.postMessage(discussionId, PostMessageRequest(content))
            handleRawResponse(response, "Failed to post message")
        } catch (e: Exception) {
            Log.e(TAG, "Error posting message", e)
            Result.failure(e)
        }
    }

    // For wrapped responses
    private fun <T> handleResponse(
        response: Response<ApiResponse<T>>,
        errorMessage: String
    ): Result<T> {
        return if (response.isSuccessful && response.body()?.data != null) {
            Result.success(response.body()!!.data!!)
        } else {
            val msg = response.errorBody()?.string() ?: errorMessage
            Log.e(TAG, "$errorMessage: $msg")
            Result.failure(Exception(msg))
        }
    }

    // For flat responses
    private fun <T> handleRawResponse(
        response: Response<T>,
        errorMessage: String
    ): Result<T> {
        return if (response.isSuccessful && response.body() != null) {
            Result.success(response.body()!!)
        } else {
            val msg = response.errorBody()?.string() ?: errorMessage
            Log.e(TAG, "$errorMessage: $msg")
            Result.failure(Exception(msg))
        }
    }
}


