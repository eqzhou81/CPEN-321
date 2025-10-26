package com.cpen321.usermanagement.ui.navigation

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed class NavigationEvent {
    object NavigateToAuth : NavigationEvent()
    object NavigateToMain : NavigationEvent()

    object NavigateToProfile : NavigationEvent()

    data class NavigateToAuthWithMessage(val message: String) : NavigationEvent()
    data class NavigateToMainWithMessage(val message: String) : NavigationEvent()
    object NavigateBack : NavigationEvent()
    object ClearBackStack : NavigationEvent()
    object NoNavigation : NavigationEvent()

    object NavigateToDiscussions : NavigationEvent()

}

data class NavigationState(
    val currentRoute: String = GlobalNavRoutes.LOADING,
    val isAuthenticated: Boolean = false,
    val needsProfileCompletion: Boolean = false,
    val isLoading: Boolean = true,
    val isNavigating: Boolean = false
)

@Singleton
class NavigationStateManager @Inject constructor() {

    private val _navigationEvent = MutableStateFlow<NavigationEvent>(NavigationEvent.NoNavigation)
    val navigationEvent: StateFlow<NavigationEvent> = _navigationEvent.asStateFlow()

    private val _navigationState = MutableStateFlow(NavigationState())

    /**
     * Updates the authentication state and triggers appropriate navigation
     */
    fun updateAuthenticationState(
        isAuthenticated: Boolean,
        needsProfileCompletion: Boolean,
        isLoading: Boolean = false,
        currentRoute: String = _navigationState.value.currentRoute
    ) {
        val newState = _navigationState.value.copy(
            isAuthenticated = isAuthenticated,
            needsProfileCompletion = needsProfileCompletion,
            isLoading = isLoading,
            currentRoute = currentRoute
        )
        _navigationState.value = newState

        // Trigger navigation based on state
        if (!isLoading) {
            handleAuthenticationNavigation(currentRoute, isAuthenticated, needsProfileCompletion)
        }
    }

    /**
     * Handle navigation decisions based on authentication state
     */
    private fun handleAuthenticationNavigation(
        currentRoute: String,
        isAuthenticated: Boolean,
        needsProfileCompletion: Boolean
    ) {
        when {
            // From loading screen after auth check
            currentRoute == GlobalNavRoutes.LOADING -> {
                if (isAuthenticated) {

                        navigateToMain()

                } else {
                    navigateToAuth()
                }
            }
            // From auth screen after successful login
            currentRoute.startsWith(GlobalNavRoutes.AUTH) && isAuthenticated -> {

                navigateToMain()

            }
        }
    }

    /**
     * Navigate to auth screen
     */
    fun navigateToAuth() {
        _navigationEvent.value = NavigationEvent.NavigateToAuth
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.AUTH)
    }

    /**
     * Navigate to auth screen with success message
     */
    fun navigateToAuthWithMessage(message: String) {
        _navigationEvent.value = NavigationEvent.NavigateToAuthWithMessage(message)
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.AUTH)
    }

    /**
     * Navigate to main screen
     */
    fun navigateToMain() {
        _navigationEvent.value = NavigationEvent.NavigateToMain
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.MAIN)
    }

    /**
     * Navigate to main screen with success message
     */
    fun navigateToMainWithMessage(message: String) {
        _navigationEvent.value = NavigationEvent.NavigateToMainWithMessage(message)
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.MAIN)
    }



    /**
     * Navigate to profile screen
     */
    fun navigateToProfile() {
        _navigationEvent.value = NavigationEvent.NavigateToProfile
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.PROFILE)
    }







    /**
     * Navigate back
     */
    fun navigateBack() {
        _navigationEvent.value = NavigationEvent.NavigateBack
    }

    /**
     * Handle account deletion
     */
    fun handleAccountDeletion() {
        _navigationState.value = _navigationState.value.copy(isNavigating = true)

        updateAuthenticationState(
            isAuthenticated = false,
            needsProfileCompletion = false,
            isLoading = false
        )
        navigateToAuthWithMessage("Account deleted successfully!")
    }





    /**
     * Reset navigation events after handling
     */
    fun clearNavigationEvent() {
        _navigationEvent.value = NavigationEvent.NoNavigation
        // Clear navigating flag when navigation is complete
        _navigationState.value = _navigationState.value.copy(isNavigating = false)
    }

    fun handleAccountSignOut() {
        _navigationState.value = _navigationState.value.copy(isNavigating = true)

        updateAuthenticationState(
            isAuthenticated = false,
            needsProfileCompletion = false,
            isLoading = false
        )
        navigateToAuthWithMessage("Signed Out Successfully!")
    }

    fun navigateToDiscussions() {
        _navigationEvent.value = NavigationEvent.NavigateToDiscussions
        _navigationState.value = _navigationState.value.copy(currentRoute = GlobalNavRoutes.DISCUSSIONS)
    }


}
