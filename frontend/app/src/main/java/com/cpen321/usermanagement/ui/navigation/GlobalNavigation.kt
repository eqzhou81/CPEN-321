package com.cpen321.usermanagement.ui.navigation

import android.net.Uri
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.ui.screens.*
import com.cpen321.usermanagement.ui.viewmodels.*

object GlobalNavRoutes {
    const val LOADING = "loading"
    const val AUTH = "auth"
    const val MAIN = "main"
    const val PROFILE = "profile"
    const val DISCUSSIONS = "discussions"

    const val DiSCUSSION_DETAILS = "discussion_details"

}

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController()
) {
    val navigationViewModel: NavigationViewModel = hiltViewModel()
    val navigationStateManager = navigationViewModel.navigationStateManager
    val navigationEvent by navigationStateManager.navigationEvent.collectAsState()

    // Initialize all necessary view models for each feature
    val authViewModel: AuthViewModel = hiltViewModel()
    val profileViewModel: ProfileViewModel = hiltViewModel()
    val mainViewModel: MainViewModel = hiltViewModel()
    val discussionViewModel: DiscussionViewModel = hiltViewModel()

    // Listen for navigation events and handle them
    LaunchedEffect(navigationEvent) {
        handleNavigationEvent(
            navigationEvent,
            navController,
            navigationStateManager,
            authViewModel,
            mainViewModel

        )
    }

    AppNavHost(
        navController = navController,
        authViewModel = authViewModel,
        profileViewModel = profileViewModel,
        mainViewModel = mainViewModel,
        discussionViewModel = discussionViewModel,
        navigationStateManager = navigationStateManager
    )
}

private fun handleNavigationEvent(
    navigationEvent: NavigationEvent,
    navController: NavHostController,
    navigationStateManager: NavigationStateManager,
    authViewModel: AuthViewModel,
    mainViewModel: MainViewModel
) {
    when (navigationEvent) {
        is NavigationEvent.NavigateToAuth -> {
            navController.navigate(GlobalNavRoutes.AUTH) {
                popUpTo(0) { inclusive = true }
            }
        }

        is NavigationEvent.NavigateToAuthWithMessage -> {
            authViewModel.setSuccessMessage(navigationEvent.message)
            navController.navigate(GlobalNavRoutes.AUTH) {
                popUpTo(0) { inclusive = true }
            }
        }

        is NavigationEvent.NavigateToMain -> {
            navController.navigate(GlobalNavRoutes.MAIN) {
                popUpTo(0) { inclusive = true }
            }
        }

        is NavigationEvent.NavigateToMainWithMessage -> {
            mainViewModel.setSuccessMessage(navigationEvent.message)
            navController.navigate(GlobalNavRoutes.MAIN) {
                popUpTo(0) { inclusive = true }
            }
        }


        is NavigationEvent.NavigateToProfile -> {
            navController.navigate(GlobalNavRoutes.PROFILE)
        }


        is NavigationEvent.NavigateToDiscussions -> {
            Log.d("AppNavigation", "Navigating to Discussions screen")
            navController.navigate(GlobalNavRoutes.DISCUSSIONS)
        }

        is NavigationEvent.NavigateToDiscussionDetails -> {
            Log.d("AppNavigation", "Navigating to Discussion Details: ${navigationEvent.discussionId}")
            val route = "${GlobalNavRoutes.DiSCUSSION_DETAILS}/${navigationEvent.discussionId}/${navigationEvent.currentUserId}/${Uri.encode(navigationEvent.currentUserName)}"
            navController.navigate(route)
        }

        is NavigationEvent.NavigateBack -> {
            navController.popBackStack()
        }

        is NavigationEvent.ClearBackStack -> {
            navController.popBackStack(navController.graph.startDestinationId, false)
        }

        is NavigationEvent.NoNavigation -> {
            mainViewModel.clearSuccessMessage()
        }
    }

    // Always clear the event after handling
    navigationStateManager.clearNavigationEvent()
}

@Composable
private fun AppNavHost(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    profileViewModel: ProfileViewModel,
    mainViewModel: MainViewModel,
    discussionViewModel: DiscussionViewModel,
    navigationStateManager: NavigationStateManager
) {
    NavHost(
        navController = navController,
        startDestination = GlobalNavRoutes.AUTH // 👈 for testing; switch to LOADING for production
    ) {
        composable(GlobalNavRoutes.LOADING) {
            LoadingScreen(message = stringResource(R.string.checking_authentication))
        }

        composable(GlobalNavRoutes.AUTH) {
            AuthScreen(authViewModel = authViewModel, profileViewModel = profileViewModel)
        }



        composable(GlobalNavRoutes.MAIN) {
            MainAppScreen(
                authViewModel = authViewModel,
                navigationStateManager = navigationStateManager
            )
        }

        composable(GlobalNavRoutes.PROFILE) {
            ProfileScreen(
                authViewModel = authViewModel,
                profileViewModel = profileViewModel,
                actions = ProfileScreenActions(
                    onBackClick = { navigationStateManager.navigateBack() },
                    onSignOut = { navigationStateManager.handleAccountSignOut() },
                    onAccountDeleted = { navigationStateManager.handleAccountDeletion() }

                )
            )
        }







        // ✅ Discussion screen route
        composable(GlobalNavRoutes.DISCUSSIONS) {
            val uiState by authViewModel.uiState.collectAsState()
            val user = uiState.user
            DiscussionScreen(
                onDiscussionClick = { discussionId ->
                    navController.navigate(
                        "${GlobalNavRoutes.DiSCUSSION_DETAILS}/$discussionId/${user?.id}/${Uri.encode(user?.name ?: "")}"
                    )
                },
                onClose = { navigationStateManager.navigateBack() },
                discussionViewModel = discussionViewModel


            )
        }

        composable(
            route = "${GlobalNavRoutes.DiSCUSSION_DETAILS}/{discussionId}/{currentUserId}/{currentUserName}"
        ) { backStackEntry ->
            val discussionId = backStackEntry.arguments?.getString("discussionId")
            val currentUserId = backStackEntry.arguments?.getString("currentUserId") ?: ""
            val currentUserName = backStackEntry.arguments?.getString("currentUserName") ?: ""

            discussionId?.let { id ->
                DiscussionDetailScreen(
                    discussionId = id,
                    currentUserId = currentUserId,
                    currentUserName = currentUserName,
                    onBack = { navController.popBackStack() }
                )
            }
        }

    }
}
