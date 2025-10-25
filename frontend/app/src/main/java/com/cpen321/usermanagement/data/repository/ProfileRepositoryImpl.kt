package com.cpen321.usermanagement.data.repository

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Rect
import android.health.connect.datatypes.ExerciseRoute
import android.health.connect.datatypes.ExerciseRoute.Location
import android.net.Uri

import kotlinx.coroutines.tasks.await
import android.util.Log
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.ImageInterface
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.UserInterface
import com.cpen321.usermanagement.data.remote.dto.UpdateProfileRequest
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import com.cpen321.usermanagement.utils.MediaUtils.uriToFile
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority


import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine

import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import com.cpen321.usermanagement.data.model.MyLocation
import com.google.android.libraries.places.api.Places

import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.model.RectangularBounds
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import kotlin.String
import kotlin.collections.List
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt


@Singleton
class ProfileRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val userInterface: UserInterface,
    private val tokenManager: TokenManager,
    private val imageInterface: ImageInterface
) : ProfileRepository {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    companion object {
        private const val TAG = "ProfileRepositoryImpl"
    }

    override suspend fun getProfile(): Result<User> {
        return try {
            val response = userInterface.getProfile() // Auth header is handled by interceptor
            if (response.isSuccessful && response.body() != null) {
                // Backend returns user data directly, not wrapped in ApiResponse
                val profileData = response.body()!!
                val user = User(
                    id = profileData.id,
                    email = profileData.email,
                    name = profileData.name,
                    savedJobs = profileData.savedJobs,
                    profilePicture = profileData.profilePicture ?: "",

                    createdAt = profileData.createdAt,
                    updatedAt = profileData.updatedAt
                )
                Result.success(user)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage =
                    parseErrorMessage(errorBodyString, "Failed to fetch user information.")
                Log.e(TAG, "Failed to get profile: $errorMessage")
                tokenManager.clearToken()
                RetrofitClient.setAuthToken(null)
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while getting profile", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while getting profile", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting profile", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while getting profile: ${e.code()}", e)
            Result.failure(e)
        }
    }

//    override suspend fun updateProfile(name: String, bio: String): Result<User> {
//        return try {
//            val updateRequest = UpdateProfileRequest(name = name)
//            val response = userInterface.updateProfile( updateRequest) // Auth header is handled by interceptor
//            if (response.isSuccessful && response.body()?.profile != null) {
//                val profileData = response.body()!!.profile
//                val user = User(
//                    id = profileData.id,
//                    email = profileData.email,
//                    name = profileData.name,
//                    savedJobs = profileData.savedJobs,
//                    profilePicture = profileData.profilePicture ?: "",
//
//                    createdAt = profileData.createdAt,
//                    updatedAt = profileData.updatedAt
//                )
//                Result.success(user)
//            } else {
//                val errorBodyString = response.errorBody()?.string()
//                val errorMessage = parseErrorMessage(errorBodyString, "Failed to update profile.")
//                Log.e(TAG, "Failed to update profile: $errorMessage")
//                Result.failure(Exception(errorMessage))
//            }
//        } catch (e: java.net.SocketTimeoutException) {
//            Log.e(TAG, "Network timeout while updating profile", e)
//            Result.failure(e)
//        } catch (e: java.net.UnknownHostException) {
//            Log.e(TAG, "Network connection failed while updating profile", e)
//            Result.failure(e)
//        } catch (e: java.io.IOException) {
//            Log.e(TAG, "IO error while updating profile", e)
//            Result.failure(e)
//        } catch (e: retrofit2.HttpException) {
//            Log.e(TAG, "HTTP error while updating profile: ${e.code()}", e)
//            Result.failure(e)
//        }
//    }


//
//
//











}
