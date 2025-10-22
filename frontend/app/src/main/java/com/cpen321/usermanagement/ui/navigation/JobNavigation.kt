package com.cpen321.usermanagement.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.cpen321.usermanagement.ui.screens.JobDashboardScreen
import com.cpen321.usermanagement.ui.screens.JobDetailsScreen
import com.cpen321.usermanagement.ui.screens.SimilarJobsScreen
import com.cpen321.usermanagement.ui.screens.QuestionsDashboardScreen
import com.cpen321.usermanagement.ui.screens.BehavioralQuestionsScreen
import com.cpen321.usermanagement.ui.screens.TechnicalQuestionsScreen

object JobNavRoutes  {
    const val JOB_DASHBOARD = "job_dashboard"
    const val JOB_DETAILS = "job_details/{jobId}"
    const val SIMILAR_JOBS = "similar_jobs/{jobId}"
    const val QUESTIONS_DASHBOARD = "questions_dashboard/{jobId}"
    const val BEHAVIORAL_QUESTIONS = "behavioral_questions/{jobId}"
    const val TECHNICAL_QUESTIONS = "technical_questions/{jobId}"
}

@Composable
fun JobAppNavigation(
    navController: NavHostController = rememberNavController()
) {
    val context = LocalContext.current
    NavHost(
        navController = navController,
        startDestination = JobNavRoutes .JOB_DASHBOARD
    ) {
        composable(JobNavRoutes .JOB_DASHBOARD) {
            JobDashboardScreen(
                onNavigateToJobDetails = { jobId ->
                    navController.navigate("job_details/$jobId")
                },
                onNavigateToQuestions = { jobId ->
                    navController.navigate("questions_dashboard/$jobId")
                }
            )
        }
        
        composable(JobNavRoutes .JOB_DETAILS) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            JobDetailsScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestions = { 
                    navController.navigate("questions_dashboard/$jobId")
                },
                onNavigateToSimilarJobs = { 
                    navController.navigate("similar_jobs/$jobId")
                }
            )
        }
        
        composable(JobNavRoutes .SIMILAR_JOBS) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            SimilarJobsScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() },
                onOpenJobLink = { url ->
                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                    context.startActivity(intent)
                }
            )
        }
        
        composable(JobNavRoutes .QUESTIONS_DASHBOARD) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            QuestionsDashboardScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToBehavioralQuestions = { 
                    navController.navigate("behavioral_questions/$jobId")
                },
                onNavigateToTechnicalQuestions = { 
                    navController.navigate("technical_questions/$jobId")
                }
            )
        }
        
        composable(JobNavRoutes .BEHAVIORAL_QUESTIONS) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            BehavioralQuestionsScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestion = { questionId ->
                    // TODO: Navigate to individual question screen
                }
            )
        }
        
        composable(JobNavRoutes .TECHNICAL_QUESTIONS) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
            TechnicalQuestionsScreen(
                jobId = jobId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToQuestion = { questionId ->
                    // TODO: Navigate to individual question screen
                }
            )
        }
    }
}
