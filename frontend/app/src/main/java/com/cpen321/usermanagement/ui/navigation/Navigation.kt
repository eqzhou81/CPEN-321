package com.cpen321.usermanagement.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.ui.screens.JobDashboardScreen
import com.cpen321.usermanagement.ui.screens.JobDetailsScreen
import com.cpen321.usermanagement.ui.screens.SimilarJobsScreen
import com.cpen321.usermanagement.ui.screens.QuestionsDashboardScreen
import com.cpen321.usermanagement.ui.screens.TechnicalQuestionsScreen
import com.cpen321.usermanagement.ui.screens.BehavioralQuestionsScreen
import com.cpen321.usermanagement.ui.screens.MockInterviewScreen
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

object NavRoutes {
    const val JOB_DASHBOARD = "job_dashboard"
    const val JOB_DETAILS = "job_details/{jobId}"
    const val SIMILAR_JOBS = "similar_jobs/{jobId}"
    const val QUESTIONS_DASHBOARD = "questions_dashboard/{jobId}"
    const val TECHNICAL_QUESTIONS = "technical_questions/{jobId}"
    const val BEHAVIORAL_QUESTIONS = "behavioral_questions/{jobId}"
    const val MOCK_INTERVIEW = "mock_interview/{sessionId}"

    fun jobDetailsPath(jobId: String) = "job_details/$jobId"
    fun similarJobsPath(jobId: String) = "similar_jobs/$jobId"
    fun questionsDashboardPath(jobId: String) = "questions_dashboard/$jobId"
    fun technicalQuestionsPath(jobId: String) = "technical_questions/$jobId"
    fun behavioralQuestionsPath(jobId: String) = "behavioral_questions/$jobId"
    fun mockInterviewPath(sessionId: String) = "mock_interview/$sessionId"
}

@Composable
fun Navigation(
    navController: NavHostController = rememberNavController()
) {
    NavHost(navController = navController, startDestination = NavRoutes.JOB_DASHBOARD) {
        jobDashboardRoute(navController)
        jobDetailsRoute(navController)
        similarJobsRoute(navController)
        questionsDashboardRoute(navController)
        technicalQuestionsRoute(navController)
        behavioralQuestionsRoute(navController)
        mockInterviewRoute(navController)
    }
}

private fun androidx.navigation.NavGraphBuilder.jobDashboardRoute(navController: NavHostController) {
    composable(NavRoutes.JOB_DASHBOARD) {
        JobDashboardScreen(
            onNavigateToJobDetails = { jobId ->
                navController.navigate(NavRoutes.jobDetailsPath(jobId))
            },
            onNavigateToQuestions = { jobId ->
                navController.navigate(NavRoutes.questionsDashboardPath(jobId))
            }
        )
    }
}

private fun androidx.navigation.NavGraphBuilder.jobDetailsRoute(navController: NavHostController) {
    composable(NavRoutes.JOB_DETAILS) { backStackEntry ->
        val jobId = backStackEntry.arguments?.getString("jobId")
        if (jobId != null) {
            JobDetailsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestions = { navController.navigate(NavRoutes.questionsDashboardPath(jobId)) },
                onNavigateToSimilarJobs = { navController.navigate(NavRoutes.similarJobsPath(jobId)) },
                jobId = jobId
            )
        }
    }
}

private fun androidx.navigation.NavGraphBuilder.similarJobsRoute(navController: NavHostController) {
    composable(NavRoutes.SIMILAR_JOBS) { backStackEntry ->
        val jobId = backStackEntry.arguments?.getString("jobId")
        if (jobId != null) {
            SimilarJobsScreen(
                onNavigateBack = { navController.popBackStack() },
                onOpenJobLink = { },
                jobId = jobId
            )
        }
    }
}

private fun androidx.navigation.NavGraphBuilder.questionsDashboardRoute(navController: NavHostController) {
    composable(NavRoutes.QUESTIONS_DASHBOARD) { backStackEntry ->
        val jobId = backStackEntry.arguments?.getString("jobId")
        if (jobId != null) {
            val mainViewModel: MainViewModel = hiltViewModel()
            QuestionsDashboardScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToBehavioralQuestions = { navController.navigate(NavRoutes.behavioralQuestionsPath(jobId)) },
                onNavigateToTechnicalQuestions = { navController.navigate(NavRoutes.technicalQuestionsPath(jobId)) },
                onNavigateToMockInterview = { sessionId ->
                    navController.navigate(NavRoutes.mockInterviewPath(sessionId))
                },
                jobId = jobId,
                mainViewModel = mainViewModel
            )
        }
    }
}

private fun androidx.navigation.NavGraphBuilder.technicalQuestionsRoute(navController: NavHostController) {
    composable(NavRoutes.TECHNICAL_QUESTIONS) { backStackEntry ->
        val jobId = backStackEntry.arguments?.getString("jobId")
        if (jobId != null) {
            TechnicalQuestionsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestion = { },
                jobId = jobId
            )
        }
    }
}

private fun androidx.navigation.NavGraphBuilder.behavioralQuestionsRoute(navController: NavHostController) {
    composable(NavRoutes.BEHAVIORAL_QUESTIONS) { backStackEntry ->
        val jobId = backStackEntry.arguments?.getString("jobId")
        if (jobId != null) {
            val mainViewModel: MainViewModel = hiltViewModel()
            BehavioralQuestionsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestion = { },
                onNavigateToMockInterview = { sessionId ->
                    navController.navigate(NavRoutes.mockInterviewPath(sessionId))
                },
                jobId = jobId,
                mainViewModel = mainViewModel
            )
        }
    }
}

private fun androidx.navigation.NavGraphBuilder.mockInterviewRoute(navController: NavHostController) {
    composable(NavRoutes.MOCK_INTERVIEW) { backStackEntry ->
        val sessionId = backStackEntry.arguments?.getString("sessionId") ?: "default-session"
        MockInterviewScreen(
            sessionId = sessionId,
            onBackClick = { navController.popBackStack() }
        )
    }
}