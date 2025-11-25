package com.cpen321.usermanagement.data.repository

import android.util.Log
import com.cpen321.usermanagement.data.remote.dto.CreateDiscussionResponse
import com.cpen321.usermanagement.data.remote.dto.PostMessageResponse
import com.cpen321.usermanagement.data.remote.api.CreateDiscussionRequest
import com.cpen321.usermanagement.data.remote.api.DiscussionApi
import com.cpen321.usermanagement.data.remote.api.DiscussionDetailResponse
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.data.remote.api.PostMessageRequest
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import org.json.JSONObject
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
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "Error fetching discussions", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
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

    private fun parseErrorMessage(errorBody: String?): String {
        return try {
            if (errorBody.isNullOrBlank()) return "Unknown error"
            val json = JSONObject(errorBody)
            json.optString("message", "Unknown error")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse error body", e)
            "Unknown error"
        }
    }

    /**
     * ✅ Create new discussion
     */
     suspend fun createDiscussion(topic: String, description: String): Result<Unit> {
        return try {
            val response = discussionApi.createDiscussion(
                CreateDiscussionRequest(topic, description)
            )

            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                val errorMsg = parseErrorMessage(response.errorBody()?.string())
                Log.e(TAG, "❌ Failed to create discussion: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Exception in createDiscussion", e)
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


