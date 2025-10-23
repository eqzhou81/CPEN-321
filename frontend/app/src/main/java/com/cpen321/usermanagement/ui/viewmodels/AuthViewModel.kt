package com.cpen321.usermanagement.ui.viewmodels

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

data class AuthUiState(
    // Loading states
    val isSigningIn: Boolean = false,
    val isSigningUp: Boolean = false,
    val isCheckingAuth: Boolean = true,

    // Auth states
    val isAuthenticated: Boolean = false,
    val user: User? = null,

    // Message states
    val errorMessage: String? = null,
    val successMessage: String? = null,

    // Control flags
    val shouldSkipAuthCheck: Boolean = false,
    val isSigningOut: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    companion object {
        private const val TAG = "AuthViewModel"
    }

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        if (!_uiState.value.shouldSkipAuthCheck) {
            // TEMPORARY: Skip authentication check entirely for testing
            if (com.cpen321.usermanagement.BuildConfig.AUTH_BYPASS_ENABLED) {
                // Set the test token in RetrofitClient for API calls
                val testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjgxZjEzOTdjNmZmMTUyYjc0OWMxNiIsImlhdCI6MTc2MTA5MTM3NSwiZXhwIjoxNzYxNjk2MTc1fQ.frWWbcYy-2vnaEPJwycxsAxgLrqpVDg-OzPcLbPz90A"
                com.cpen321.usermanagement.data.remote.api.RetrofitClient.setAuthToken(testToken)
                
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = true,
                    user = com.cpen321.usermanagement.data.remote.dto.User(
                        _id = "68f81f1397c6ff152b749c16", // Use real user ID from token
                        email = "test@example.com",
                        name = "Test User",
                        bio = "Mock user for testing",
                        profilePicture = "",
                        hobbies = emptyList(),
                        createdAt = "2024-01-01T00:00:00Z",
                        updatedAt = "2024-01-01T00:00:00Z"
                    ),
                    isCheckingAuth = false
                )
            } else {
                checkAuthenticationStatus()
            }
        }
    }

    private fun checkAuthenticationStatus() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isCheckingAuth = true)

                // Add timeout to prevent hanging
                val isAuthenticated = withTimeout(5000) {
                    authRepository.isUserAuthenticated()
                }
                val user = if (isAuthenticated) {
                    withTimeout(5000) {
                        authRepository.getCurrentUser()
                    }
                } else null

                _uiState.value = _uiState.value.copy(
                    isAuthenticated = isAuthenticated,
                    user = user,
                    isCheckingAuth = false
                )
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                Log.e(TAG, "Authentication check timed out", e)
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isCheckingAuth = false,
                    errorMessage = "Authentication check timed out"
                )
            } catch (e: java.net.SocketTimeoutException) {
                handleAuthError("Network timeout. Please check your connection.", e)
            } catch (e: java.net.UnknownHostException) {
                handleAuthError("No internet connection. Please check your network.", e)
            } catch (e: java.io.IOException) {
                handleAuthError("Connection error. Please try again.", e)
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error during authentication check", e)
                _uiState.value = _uiState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isCheckingAuth = false,
                    errorMessage = "Authentication failed: ${e.message}"
                )
            }
        }
    }


    private fun handleAuthError(errorMessage: String, exception: Exception) {
        Log.e(TAG, "Authentication check failed: $errorMessage", exception)
        _uiState.value = _uiState.value.copy(
            isCheckingAuth = false,
            isAuthenticated = false,
            errorMessage = errorMessage
        )
    }

    suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        return authRepository.signInWithGoogle(context)
    }

    fun getGoogleSignInIntent(): android.content.Intent {
        return authRepository.getGoogleSignInIntent()
    }

    fun handleGoogleSignInResult(data: android.content.Intent) {
        authRepository.handleGoogleSignInResult(data)
            .onSuccess { credential ->
                handleGoogleSignInResult(credential)
            }
            .onFailure { error ->
                Log.e(TAG, "Google Sign-In failed", error)
                _uiState.value = _uiState.value.copy(
                    isSigningIn = false,
                    isSigningUp = false,
                    errorMessage = error.message
                )
            }
    }

    private fun handleGoogleAuthResult(
        credential: GoogleIdTokenCredential,
        isSignUp: Boolean,
        authOperation: suspend (String) -> Result<AuthData>
    ) {
        viewModelScope.launch {
            // Update loading state based on operation type
            _uiState.value = _uiState.value.copy(
                isSigningIn = !isSignUp,
                isSigningUp = isSignUp
            )

            authOperation(credential.idToken)
                .onSuccess { authData ->
                    val needsProfileCompletion =
                        authData.user.bio == null || authData.user.bio.isBlank()

                    _uiState.value = _uiState.value.copy(
                        isSigningIn = false,
                        isSigningUp = false,
                        isAuthenticated = true,
                        user = authData.user,
                        errorMessage = null
                    )
                }
                .onFailure { error ->
                    val operationType = if (isSignUp) "sign up" else "sign in"
                    Log.e(TAG, "Google $operationType failed", error)
                    _uiState.value = _uiState.value.copy(
                        isSigningIn = false,
                        isSigningUp = false,
                        errorMessage = error.message
                    )
                }
        }
    }

    fun handleGoogleSignInResult(credential: GoogleIdTokenCredential) {
        handleGoogleAuthResult(credential, isSignUp = false) { idToken ->
            authRepository.googleSignIn(idToken)
        }
    }

    fun handleGoogleSignUpResult(credential: GoogleIdTokenCredential) {
        handleGoogleAuthResult(credential, isSignUp = true) { idToken ->
            authRepository.googleSignUp(idToken)
        }
    }

    fun handleAccountDeletion() {
        viewModelScope.launch {
            val result = authRepository.deleteProfile()

            if(result.isSuccess){
                authRepository.clearToken()
                _uiState.value = AuthUiState(
                    isAuthenticated = false,
                    isCheckingAuth = false,
                    shouldSkipAuthCheck = false // Skip auth check after manual sign out
                )
            }else{
                _uiState.value = AuthUiState(
                    errorMessage = "Account deletion failed. Please try again."
                )
            }

        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun setSuccessMessage(message: String) {
        _uiState.value = _uiState.value.copy(successMessage = message)
    }

    fun clearSuccessMessage() {
        _uiState.value = _uiState.value.copy(successMessage = null)
    }

    fun handleSignout() {

        viewModelScope.launch {
            authRepository.clearToken()
            _uiState.value = AuthUiState(
                isSigningOut = true,
                isAuthenticated = false,
                isCheckingAuth = false,
                shouldSkipAuthCheck = true
            )
        }

    }

}
