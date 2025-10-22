package com.cpen321.usermanagement.data.repository



import com.cpen321.usermanagement.data.remote.*
import com.cpen321.usermanagement.data.remote.api.CreateDiscussionRequest
import com.cpen321.usermanagement.data.remote.api.DiscussionApi
import com.cpen321.usermanagement.data.remote.api.PostMessageRequest
import com.cpen321.usermanagement.data.remote.api.QuestionApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DiscussionRepository @Inject constructor(private val discussionApi: DiscussionApi) {

    suspend fun getAllDiscussions() = discussionApi.getAllDiscussions()

    suspend fun getDiscussionById(id: String) = discussionApi.getDiscussionById(id)

    suspend fun createDiscussion(topic: String, description: String?) =
        discussionApi.createDiscussion(CreateDiscussionRequest(topic, description))

    suspend fun postMessage(discussionId: String, content: String) =
        discussionApi.postMessage(discussionId, PostMessageRequest(content))
}
