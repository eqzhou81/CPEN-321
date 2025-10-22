package com.cpen321.usermanagement.data.remote.api


import com.cpen321.usermanagement.data.model.CreateDiscussionResponse
import com.cpen321.usermanagement.data.model.PostMessageResponse
import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import retrofit2.http.*
import retrofit2.Response

data class DiscussionListResponse(
    val id: String,
    val topic: String,
    val description: String?,
    val creatorId: String,
    val creatorName: String,
    val messageCount: Int,
    val participantCount: Int,
    val lastActivityAt: String,
    val createdAt: String
)

data class MessageResponse(
    val id: String,
    val userId: String,
    val userName: String,
    val content: String,
    val createdAt: String,
    val updatedAt: String
)

data class DiscussionDetailResponse(
    val id: String,
    val topic: String,
    val description: String?,
    val creatorId: String,
    val creatorName: String,
    val messageCount: Int,
    val participantCount: Int,
    val messages: List<MessageResponse>,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class CreateDiscussionRequest(
    val topic: String,
    val description: String? = null
)

data class PostMessageRequest(
    val content: String
)

interface DiscussionApi {

    @GET("discussions")
    suspend fun getAllDiscussions(
        @Query("search") search: String? = null,
        @Query("sortBy") sortBy: String? = "recent",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<ApiResponse<List<DiscussionListResponse>>>

    @GET("discussions/{id}")
    suspend fun getDiscussionById(
        @Path("id") id: String
    ): Response<ApiResponse<DiscussionDetailResponse>>

    @POST("discussions")
    suspend fun createDiscussion(
        @Body request: CreateDiscussionRequest
    ): Response<CreateDiscussionResponse>

    @POST("discussions/{id}/messages")
    suspend fun postMessage(
        @Path("id") id: String,
        @Body request: PostMessageRequest
    ): Response<PostMessageResponse>
}
