package com.cpen321.usermanagement.data.repository

import android.content.Context
import android.util.Log
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.UserInterface
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.utils.JsonUtils.parseErrorMessage
import dagger.hilt.android.qualifiers.ApplicationContext
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val userInterface: UserInterface,
    private val tokenManager: TokenManager
) : ProfileRepository {

    companion object {
        private const val TAG = "ProfileRepositoryImpl"
    }

    /**
     * Fetches the currently authenticated user's profile
     */
    override suspend fun getProfile(): Result<User> {
        return try {
            val response = userInterface.getProfile()

            if (response.isSuccessful && response.body()?.data?.user != null) {
                val user = response.body()!!.data.user
                Log.d("ProfileRepository", "✅ Loaded user: ${user.name} (${user.id})")
                Result.success(user)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Unknown error"
                Log.e("ProfileRepository", "❌ Failed to get profile: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e("ProfileRepository", "⏱ Network timeout while getting profile", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e("ProfileRepository", "🌐 Network connection failed while getting profile", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e("ProfileRepository", "💾 IO error while getting profile", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e("ProfileRepository", "HTTP error while getting profile: ${e.code()}", e)
            Result.failure(e)
        } catch (e: IllegalStateException) {
            Log.e("ProfileRepository", "Unexpected error while getting profile", e)
            Result.failure(e)
        } catch (e: NullPointerException) {
            Log.e("ProfileRepository", "Unexpected error while getting profile", e)
            Result.failure(e)
        }
    }

}
