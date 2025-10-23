package com.cpen321.usermanagement.data.repository

import android.content.Context
import android.util.Log
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.AuthInterface
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.UserInterface
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.GoogleLoginRequest
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.utils.JsonUtils
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val authInterface: AuthInterface,
    private val userInterface: UserInterface,
    private val tokenManager: TokenManager
) : AuthRepository {

    companion object {
        private const val TAG = "AuthRepositoryImpl"
    }

    private val googleSignInClient: GoogleSignInClient by lazy {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(BuildConfig.GOOGLE_WEB_CLIENT_ID) // Use Web Client ID for ID token
            .requestEmail()
            .requestProfile()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    override suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        return try {
            val signInIntent = googleSignInClient.signInIntent
            // Note: This method will be called from the Activity, not here
            // We'll handle the result in the Activity and pass it to the ViewModel
            Result.failure(Exception("This method should be called from Activity"))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initiate Google Sign-In", e)
            Result.failure(e)
        }
    }

    override fun getGoogleSignInIntent(): android.content.Intent {
        return googleSignInClient.signInIntent
    }

    override fun handleGoogleSignInResult(data: android.content.Intent): Result<GoogleIdTokenCredential> {
        return try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            val account = task.getResult(ApiException::class.java)
            
            val idToken = account.idToken
            if (idToken != null) {
                // Create a proper GoogleIdTokenCredential using the builder
                val credential = GoogleIdTokenCredential.Builder()
                    .setIdToken(idToken)
                    .setId(account.id ?: "")
                    .setDisplayName(account.displayName ?: "")
                    .setFamilyName(account.familyName ?: "")
                    .setGivenName(account.givenName ?: "")
                    .setProfilePictureUri(account.photoUrl)
                    .build()
                Result.success(credential)
            } else {
                Log.e(TAG, "No ID token received from Google Sign-In")
                Result.failure(Exception("No ID token received"))
            }
        } catch (e: ApiException) {
            Log.e(TAG, "Google Sign-In failed", e)
            Result.failure(e)
        }
    }


    override suspend fun googleSignIn(tokenId: String): Result<AuthData> {
        val googleLoginReq = GoogleLoginRequest(tokenId)
        return try {
            val response = authInterface.googleSignIn(googleLoginReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val authData = response.body()!!.data!!
                tokenManager.saveToken(authData.token)
                RetrofitClient.setAuthToken(authData.token)
                Result.success(authData)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to sign in with Google."
                )
                Log.e(TAG, "Google sign in failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during Google sign in", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during Google sign in", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during Google sign in", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during Google sign in: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun googleSignUp(tokenId: String): Result<AuthData> {
        val googleLoginReq = GoogleLoginRequest(tokenId)
        return try {
            val response = authInterface.googleSignUp(googleLoginReq)
            if (response.isSuccessful && response.body()?.data != null) {
                val authData = response.body()!!.data!!
                tokenManager.saveToken(authData.token)
                RetrofitClient.setAuthToken(authData.token)
                Result.success(authData)
            } else {
                val errorBodyString = response.errorBody()?.string()
                val errorMessage = JsonUtils.parseErrorMessage(
                    errorBodyString,
                    response.body()?.message ?: "Failed to sign up with Google."
                )
                Log.e(TAG, "Google sign up failed: $errorMessage")
                Result.failure(Exception(errorMessage))
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout during Google sign up", e)
            Result.failure(e)
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed during Google sign up", e)
            Result.failure(e)
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error during Google sign up", e)
            Result.failure(e)
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error during Google sign up: ${e.code()}", e)
            Result.failure(e)
        }
    }

    override suspend fun clearToken(): Result<Unit> {
        tokenManager.clearToken()
        RetrofitClient.setAuthToken(null)
        return Result.success(Unit)
    }

    override suspend fun doesTokenExist(): Boolean {
        // TEMPORARY BYPASS: Return true for testing features
        if (BuildConfig.AUTH_BYPASS_ENABLED) {
            Log.d(TAG, "Authentication bypass enabled - token exists")
            return true
        }
        return tokenManager.getToken().first() != null
    }

    override suspend fun getStoredToken(): String? {
        // TEMPORARY BYPASS: Return test token for development
        if (BuildConfig.AUTH_BYPASS_ENABLED) {
            Log.d(TAG, "Authentication bypass enabled - returning test token")
            return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
        }
        return tokenManager.getTokenSync()
    }

    override suspend fun getCurrentUser(): User? {
        // TEMPORARY BYPASS: Check BuildConfig flag for testing features
        if (BuildConfig.AUTH_BYPASS_ENABLED) {
            Log.d(TAG, "Authentication bypass enabled - returning mock user")
            return User(
                _id = "68f81f1397c6ff152b749c16", // Use real user ID from token
                email = "test@example.com",
                name = "Test User",
                bio = "Mock user for testing",
                profilePicture = "",
                hobbies = emptyList(),
                createdAt = "2024-01-01T00:00:00Z",
                updatedAt = "2024-01-01T00:00:00Z"
            )
        }
        
        // Original authentication logic
        return try {
            val response = userInterface.getProfile("") // Auth header is handled by interceptor
            if (response.isSuccessful && response.body()?.data != null) {
                response.body()!!.data!!.user
            } else {
                Log.e(
                    TAG,
                    "Failed to get current user: ${response.body()?.message ?: "Unknown error"}"
                )
                null
            }
        } catch (e: java.net.SocketTimeoutException) {
            Log.e(TAG, "Network timeout while getting current user", e)
            null
        } catch (e: java.net.UnknownHostException) {
            Log.e(TAG, "Network connection failed while getting current user", e)
            null
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting current user", e)
            null
        } catch (e: retrofit2.HttpException) {
            Log.e(TAG, "HTTP error while getting current user: ${e.code()}", e)
            null
        }
    }

    override suspend fun isUserAuthenticated(): Boolean {
        // TEMPORARY BYPASS: Check BuildConfig flag for testing features
        if (BuildConfig.AUTH_BYPASS_ENABLED) {
            Log.d(TAG, "Authentication bypass enabled - returning true")
            // Set the test token in RetrofitClient for API calls
            val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
            RetrofitClient.setAuthToken(testToken)
            return true
        }
        
        // Original authentication logic
        val isLoggedIn = doesTokenExist()
        if (isLoggedIn) {
            val token = getStoredToken()
            token?.let { RetrofitClient.setAuthToken(it) }
            // Verify token is still valid by trying to get user profile
            return getCurrentUser() != null
        }
        return false
    }

    override suspend fun deleteProfile(): Result<Unit>{
        val token = getStoredToken()
        if (token.isNullOrEmpty()) {
            return Result.failure(Exception("Token not found")) // Handle case where token is missing
        }

        RetrofitClient.setAuthToken(token)

        return try {
            // Send the authenticated DELETE request to the server
            val response = userInterface.deleteAccount()

            if (response.isSuccessful) {
                Result.success(Unit) // Indicate success
            } else {
                // Handle server-side errors (e.g., 401 Unauthorized, 404 Not Found)
                val errorBody = response.errorBody()?.string() ?: "Unknown error"
                Result.failure(Exception("Server error: $errorBody"))
            }
        } catch (e: Exception) {
            // Handle network exceptions (e.g., no internet connection)
            Result.failure(e)
        }

    }

}
