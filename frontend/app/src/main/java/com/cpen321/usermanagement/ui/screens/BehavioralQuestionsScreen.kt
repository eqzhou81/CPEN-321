package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.ui.viewmodels.QuestionViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

/**
 * Behavioral Questions Screen - Minimal Working Version
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BehavioralQuestionsScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    onNavigateToQuestion: (String) -> Unit,
    onNavigateToMockInterview: ((String) -> Unit)? = null,
    viewModel: QuestionViewModel = hiltViewModel(),
    mainViewModel: MainViewModel = hiltViewModel()
) {
    val questions by viewModel.questions.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    
    // MainViewModel state for session creation
    val sessionCreated by mainViewModel.sessionCreated.collectAsStateWithLifecycle()
    val mainUiState by mainViewModel.uiState.collectAsStateWithLifecycle()
    
    val behavioralQuestions = questions?.behavioralQuestions ?: emptyList()
    
    LaunchedEffect(jobId) {
        // Load behavioral questions for this job
        viewModel.loadQuestions(jobId, QuestionType.BEHAVIORAL)
    }
    
    // Handle session creation and navigation
    LaunchedEffect(sessionCreated) {
        sessionCreated?.let { sessionId ->
            onNavigateToMockInterview?.invoke(sessionId)
            mainViewModel.clearSessionCreated()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = colorResource(R.color.text_primary)
                    )
                }
                Text(
                    text = "Behavioral Questions",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
            }
            
            val completedCount = behavioralQuestions.count { it.isCompleted }
            Badge(
                containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                contentColor = colorResource(R.color.primary)
            ) {
                Text("$completedCount/${behavioralQuestions.size}")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Error Message
        error?.let { errorMessage ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = colorResource(R.color.error).copy(alpha = 0.1f)
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = colorResource(R.color.error))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = errorMessage,
                        color = colorResource(R.color.error),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("Dismiss")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        // Loading State
        if (isLoading && behavioralQuestions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = colorResource(R.color.primary))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Loading behavioral questions...",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            }
        }
        // Empty State
        else if (behavioralQuestions.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Help,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = colorResource(R.color.text_tertiary)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No behavioral questions yet",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            }
        }
        // Questions List
        else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(behavioralQuestions) { question ->
                    BehavioralQuestionCard(
                        question = question,
                        onClick = { 
                            // Create mock interview session for this specific question
                            // Pass the question ID to create a focused session
                            mainViewModel.createMockInterviewSessionForQuestion(jobId, question.id)
                        },
                        onToggleCompletion = { 
                            viewModel.updateQuestionCompletion(question.id, !question.isCompleted)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun BehavioralQuestionCard(
    question: BehavioralQuestion,
    onClick: () -> Unit,
    onToggleCompletion: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (question.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                        contentDescription = if (question.isCompleted) "Mark as incomplete" else "Mark as complete",
                        tint = if (question.isCompleted) colorResource(R.color.success) else colorResource(R.color.text_tertiary),
                        modifier = Modifier
                            .size(24.dp)
                            .clickable { onToggleCompletion() }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Badge(
                        containerColor = when (question.difficulty) {
                            QuestionDifficulty.EASY -> colorResource(R.color.success).copy(alpha = 0.2f)
                            QuestionDifficulty.MEDIUM -> colorResource(R.color.warning).copy(alpha = 0.2f)
                            QuestionDifficulty.HARD -> colorResource(R.color.error).copy(alpha = 0.2f)
                            null -> colorResource(R.color.warning).copy(alpha = 0.2f)
                        },
                        contentColor = when (question.difficulty) {
                            QuestionDifficulty.EASY -> colorResource(R.color.success)
                            QuestionDifficulty.MEDIUM -> colorResource(R.color.warning)
                            QuestionDifficulty.HARD -> colorResource(R.color.error)
                            null -> colorResource(R.color.warning)
                        }
                    ) {
                        Text(question.difficulty?.displayName ?: "MEDIUM")
                    }
                }
                
                Badge(
                    containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                    contentColor = colorResource(R.color.primary)
                ) {
                    Text(question.category.replace("-", " ").uppercase())
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Question Text
            Text(
                text = question.question,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = colorResource(R.color.text_primary),
                    fontWeight = FontWeight.Medium
                ),
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Footer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (question.isCompleted) "Completed" else "Not completed",
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = if (question.isCompleted) colorResource(R.color.success) else colorResource(R.color.text_tertiary)
                    )
                )
                
                Button(
                    onClick = onClick,
                    colors = ButtonDefaults.buttonColors(containerColor = colorResource(R.color.primary))
                ) {
                    Text("Practice")
                }
            }
        }
    }
}