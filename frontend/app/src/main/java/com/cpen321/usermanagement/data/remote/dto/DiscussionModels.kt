package com.cpen321.usermanagement.data.remote.dto


import com.google.gson.annotations.SerializedName

data class Discussion(
    @SerializedName("id") val id: String,
    @SerializedName("topic") val topic: String,
    @SerializedName("description") val description: String?,
    @SerializedName("creatorId") val creatorId: String,
    @SerializedName("creatorName") val creatorName: String,
    @SerializedName("messageCount") val messageCount: Int,
    @SerializedName("participantCount") val participantCount: Int,
    @SerializedName("lastActivityAt") val lastActivityAt: String,
    @SerializedName("createdAt") val createdAt: String
)

data class DiscussionDetail(
    @SerializedName("id") val id: String,
    @SerializedName("topic") val topic: String,
    @SerializedName("description") val description: String?,
    @SerializedName("creatorId") val creatorId: String,
    @SerializedName("creatorName") val creatorName: String,
    @SerializedName("messageCount") val messageCount: Int,
    @SerializedName("participantCount") val participantCount: Int,
    @SerializedName("messages") val messages: List<Message>,
    @SerializedName("isActive") val isActive: Boolean,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String
)

data class Message(
    @SerializedName("id") val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("userName") val userName: String,
    @SerializedName("content") val content: String,
    @SerializedName("createdAt") val createdAt: String,
    @SerializedName("updatedAt") val updatedAt: String
)

// API Responses
data class DiscussionsResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: List<Discussion>,
    @SerializedName("pagination") val pagination: Pagination
)

data class DiscussionDetailResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: DiscussionDetail
)

data class CreateDiscussionResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("discussionId") val discussionId: String,
    @SerializedName("message") val message: String
)

data class PostMessageResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: Message
)

data class Pagination(
    @SerializedName("page") val page: Int,
    @SerializedName("limit") val limit: Int,
    @SerializedName("total") val total: Int,
    @SerializedName("totalPages") val totalPages: Int
)

// Request bodies
data class CreateDiscussionRequest(
    @SerializedName("topic") val topic: String,
    @SerializedName("description") val description: String?
)

data class PostMessageRequest(
    @SerializedName("content") val content: String
)