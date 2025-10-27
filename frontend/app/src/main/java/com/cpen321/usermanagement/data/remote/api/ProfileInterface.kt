package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.data.remote.dto.ApiResponse
import com.cpen321.usermanagement.data.remote.dto.*

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface UserInterface {

    @GET("user/profile")
    suspend fun getProfile(): Response<GetProfileResponse>

    @POST("user/profile")
    suspend fun updateProfile(
        @Body request: UpdateProfileRequest
    ): Response<UpdateProfileResponse>

    @HTTP(method = "DELETE", path = "user/profile", hasBody = true)
    suspend fun deleteAccount(
        @Body request: DeleteProfileRequest
    ): Response<DeleteProfileResponse>
}

interface ImageInterface{}



