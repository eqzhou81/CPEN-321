package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.GetProfileResponse
import com.cpen321.usermanagement.data.remote.dto.UpdateProfileRequest
import com.cpen321.usermanagement.data.remote.dto.UpdateProfileResponse
import com.cpen321.usermanagement.data.remote.dto.DeleteProfileRequest
import com.cpen321.usermanagement.data.remote.dto.DeleteProfileResponse

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UserInterface {

    /**
     * GET /api/user/profile
     * Returns the authenticated user's profile.
     */
    @GET("user/profile")
    suspend fun getProfile(): Response<GetProfileResponse>

    /**
     * POST /api/user/profile
     * Updates user's profile (only name currently).
     */
    @POST("user/profile")
    suspend fun updateProfile(
        @Body request: UpdateProfileRequest
    ): Response<UpdateProfileResponse>

    /**
     * DELETE /api/user/profile
     * Deletes the authenticated user's profile.
     * Note: uses @HTTP to allow a body with DELETE.
     */
    @HTTP(method = "DELETE", path = "user/profile", hasBody = true)
    suspend fun deleteAccount(
//        @Body request: DeleteProfileRequest
    ): Response<DeleteProfileResponse>
}
interface ImageInterface{}



