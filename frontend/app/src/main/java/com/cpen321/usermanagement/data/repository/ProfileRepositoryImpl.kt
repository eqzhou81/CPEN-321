package com.cpen321.usermanagement.data.repository

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Rect
import android.health.connect.datatypes.ExerciseRoute
import android.health.connect.datatypes.ExerciseRoute.Location
import android.net.Uri

import kotlinx.coroutines.tasks.await
import android.util.Log

import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.HobbyInterface
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
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt


@Singleton
class ProfileRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val userInterface: UserInterface,
    private val hobbyInterface: HobbyInterface,
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
            val response = userInterface.getProfile("") // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.user)
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

    override suspend fun updateProfile(name: String, bio: String): Result<User> {
        return try {
            val updateRequest = UpdateProfileRequest(name = name, bio = bio)
            val response = userInterface.updateProfile("", updateRequest) // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.user)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to update profile.")
                Log.e(TAG, "Failed to update profile: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while updating profile", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while updating profile", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while updating profile", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while updating profile: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun updateUserHobbies(hobbies: List<String>): Result<User> {
        return try {
            val updateRequest = UpdateProfileRequest(hobbies = hobbies)
            val response = userInterface.updateProfile("", updateRequest) // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.user)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to update hobbies.")

                Log.e(TAG, "Failed to update hobbies: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while updating hobbies", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while updating hobbies", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while updating hobbies", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while updating hobbies: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun getAvailableHobbies(): Result<List<String>> {
        return try {
            val response = hobbyInterface.getAvailableHobbies("") // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!.hobbies)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = parseErrorMessage(errorBodyString, "Failed to fetch hobbies.")
                Log.e(TAG, "Failed to get available hobbies: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while getting available hobbies", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while getting available hobbies", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting available hobbies", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while getting available hobbies: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun uploadProfilePic(profileUri : Uri) : Result<String>{
        return try {

            val file = uriToFile(context, profileUri)

            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData(
                name = "media",
                filename = file.name,
                body = requestFile
            )

            val response = imageInterface.uploadPicture("", body)

            if (response.isSuccessful) {
                val uploadedUrl = response.body()?.data?.image ?: ""
                val updateRequest = UpdateProfileRequest(profilePicture=uploadedUrl)

                val response = userInterface.updateProfile("", updateRequest)
                Result.success(uploadedUrl)
            } else {
                Result.failure(Exception("Upload failed: ${response.code()}"))
            }

        } catch (e: Exception) {
            Result.failure(e)
        }

    }

    @SuppressLint("MissingPermission")
    override suspend fun getCurrentLocation(): Result<MyLocation>{
        return try {
            val location = suspendCancellableCoroutine<android.location.Location> { cont ->
                fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    null
                ).addOnSuccessListener { loc ->
                    if (loc != null) cont.resume(loc) {}
                    else cont.resumeWith(Result.failure(Exception("Location is null")))
                }.addOnFailureListener { e ->
                    cont.resumeWith(Result.failure(e))
                }
            }

            Result.success(MyLocation(location.latitude, location.longitude))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }



    override suspend fun getNearbyPlaces(
        location: MyLocation,
        hobbies: Set<String>
    ): Result<List<Place>> {
        return try {
            val placesClient = Places.createClient(context)
            val placeFields = listOf(Place.Field.ID, Place.Field.NAME, Place.Field.LAT_LNG)
            val nearbyPlaces = mutableListOf<Place>() // Renamed to reflect actual nearby places

            val searchQueries = hobbies.map { hobby ->
                when (hobby.lowercase()) {
                    "reading", "writing" -> "bookstore"
                    "singing" -> "karaoke places" // More specific than "karaoke places"
                    "cooking" -> "cooking class" // More specific than "culinary school"
                    "travel", "blogging", "photography" -> "tourist attractions" // More specific than "Tourist spots"
                    "coding" -> "Mcloed Building UBC"
                    "surfing" -> "beach"
                    "painting", "drawing" -> "art places"
                    "skiing" -> "Ice Skating"
                    else -> hobby // Use the hobby itself, let Google figure it out
                }
            }.toSet()

            Log.d("ProfileRepository", "Searching for queries: $searchQueries")

            val latLng = com.google.android.gms.maps.model.LatLng(location.latitude, location.longitude)
            Log.d("LocationDebug", "My current location: latitude=${latLng.latitude}, longitude=${latLng.longitude}")

            // Define maximum distance (e.g., 10km)
            val maxDistanceMeters = 10000

            for (query in searchQueries) {
                Log.d("LocationDebug", "Searching for: '$query'")

                val request = FindAutocompletePredictionsRequest.builder()
                    .setQuery(query)
                    .setLocationBias(
                        RectangularBounds.newInstance(
                            com.google.android.gms.maps.model.LatLng(latLng.latitude - 0.05, latLng.longitude - 0.05),
                            com.google.android.gms.maps.model.LatLng(latLng.latitude + 0.05, latLng.longitude + 0.05)
                        )
                    )
                    .setOrigin(latLng) // Add origin for better ranking
                    .build()

                val response = placesClient.findAutocompletePredictions(request).await()
                Log.d("ProfileRepository", "Found ${response.autocompletePredictions.size} predictions for query '$query'")

                // Fetch full place details and check distance
                for (prediction in response.autocompletePredictions) {
                    try {
                        val placeRequest = FetchPlaceRequest.builder(prediction.placeId, placeFields).build()
                        val placeResponse = placesClient.fetchPlace(placeRequest).await()
                        val place = placeResponse.place

                        // Check if place has coordinates
                        if (place.latLng != null) {
                            val distance = calculateDistance(
                                latLng.latitude, latLng.longitude,
                                place.latLng.latitude, place.latLng.longitude
                            )

                            Log.d("LocationDebug", "Place: ${place.name}, Distance: ${distance.toInt()}m, LatLng: ${place.latLng}")

                            // Only add places within the maximum distance
                            if (distance <= maxDistanceMeters) {
                                nearbyPlaces.add(place)
                                Log.d("LocationDebug", "✅ ADDED: ${place.name} (${distance.toInt()}m away)")
                            } else {
                                Log.d("LocationDebug", "❌ TOO FAR: ${place.name} (${distance.toInt()}m away)")
                            }
                        } else {
                            Log.d("LocationDebug", "⚠️ NO COORDINATES: ${place.name}")
                        }
                    } catch (e: Exception) {
                        Log.e("ProfileRepository", "Error fetching place details for ${prediction.placeId}", e)
                    }
                }
            }

            val uniquePlaces = nearbyPlaces.distinctBy { it.id }
            Log.d("ProfileRepository", "Found ${uniquePlaces.size} unique places within ${maxDistanceMeters/1000}km.")
            Log.d("ProfileRepository", "Nearby places: ${uniquePlaces.map { it.name }}")

            Result.success(uniquePlaces)
        } catch (e: Exception) {
            Log.e("ProfileRepository", "Error fetching nearby places", e)
            Result.failure(e)
        }
    }

    // Add this distance calculation function
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371000.0 // meters

        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return earthRadius * c
    }





}
