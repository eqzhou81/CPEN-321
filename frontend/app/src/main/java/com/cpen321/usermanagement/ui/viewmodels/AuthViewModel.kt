package com.cpen321.usermanagement.ui.viewmodels

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.dto.AuthData
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.data.repository.AuthRepository
import com.cpen321.usermanagement.ui.navigation.GlobalNavRoutes
import com.cpen321.usermanagement.ui.navigation.NavRoutes
import com.cpen321.usermanagement.ui.navigation.NavigationStateManager
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException
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
    private val authRepository: AuthRepository,
    private val navigationStateManager: NavigationStateManager
) : ViewModel() {

    companion object {
        private const val TAG = "AuthViewModel"
    }

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        if (!_uiState.value.shouldSkipAuthCheck) {
            checkAuthenticationStatus()
        }
    }

    private fun checkAuthenticationStatus() {
        viewModelScope.launch(kotlinx.coroutines.Dispatchers.IO) {
            try {
                _uiState.value = _uiState.value.copy(isCheckingAuth = true)
                updateNavigationState(isLoading = true)

                val isAuthenticated = authRepository.isUserAuthenticated()
                val user = if (isAuthenticated) {
                    try {
                        authRepository.getCurrentUser()
                    } catch (e: IOException) {
                        Log.e(TAG, "Error getting current user", e)
                        null
                    } catch (e: retrofit2.HttpException) {
                        Log.e(TAG, "Error getting current user", e)
                        null
                    }
                } else null

                _uiState.value = _uiState.value.copy(
                    isAuthenticated = isAuthenticated,
                    user = user,
                    isCheckingAuth = false
                )

                updateNavigationState(
                    isAuthenticated = isAuthenticated,
                    isLoading = false
                )
            } catch (e: java.net.SocketTimeoutException) {
                handleAuthError("Network timeout. Please check your connection.", e)
            } catch (e: java.net.UnknownHostException) {
                handleAuthError("No internet connection. Please check your network.", e)
            } catch (e: java.io.IOException) {
                handleAuthError("Connection error. Please try again.", e)
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected error in checkAuthenticationStatus", e)
                handleAuthError("An unexpected error occurred. Please try again.", e)
            }
        }
    }

    suspend private fun updateNavigationState(
        isAuthenticated: Boolean = false,
        needsProfileCompletion: Boolean = false,
        isLoading: Boolean = false
    ) {
        // Set token in RetrofitClient when user is authenticated
        if (isAuthenticated) {
            val token = authRepository.getStoredToken()
            if (token != null) {
                RetrofitClient.setAuthToken(token)
                Log.d("AuthViewModel", "✅ Token set in RetrofitClient during navigation: ${token.take(15)}...")
            }
        }

        navigationStateManager.updateAuthenticationState(
            isAuthenticated = isAuthenticated,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = isLoading,
            currentRoute = GlobalNavRoutes.LOADING
        )
    }

    suspend private fun handleAuthError(errorMessage: String, exception: Exception) {
        Log.e(TAG, "Authentication check failed: $errorMessage", exception)
        _uiState.value = _uiState.value.copy(
            isCheckingAuth = false,
            isAuthenticated = false,
            errorMessage = errorMessage
        )
        updateNavigationState()
    }

    suspend fun signInWithGoogle(context: Context): Result<GoogleIdTokenCredential> {
        return authRepository.signInWithGoogle(context)
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


                    _uiState.value = _uiState.value.copy(
                        isSigningIn = false,
                        isSigningUp = false,
                        isAuthenticated = true,
                        user = authData.user,
                        errorMessage = null
                    )

                    // Set token in RetrofitClient immediately after successful auth
                    val token = authRepository.getStoredToken()
                    if (token != null) {
                        RetrofitClient.setAuthToken(token)
                        Log.d("AuthViewModel", "✅ Token set in RetrofitClient after sign in: ${token.take(15)}...")
                    }

                    // Trigger navigation through NavigationStateManager
                    navigationStateManager.updateAuthenticationState(
                        isAuthenticated = true,
                        needsProfileCompletion = false,
                        isLoading = false,
                        currentRoute = GlobalNavRoutes.AUTH
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
