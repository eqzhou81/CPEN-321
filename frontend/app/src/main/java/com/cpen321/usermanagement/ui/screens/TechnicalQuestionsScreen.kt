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
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext

/**
 * Technical Questions Screen - Minimal Working Version
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TechnicalQuestionsScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    onNavigateToQuestion: (String) -> Unit,
    viewModel: QuestionViewModel = hiltViewModel()
) {
    val questions by viewModel.questions.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    
    val technicalQuestions = questions?.technicalQuestions ?: emptyList()
    val context = LocalContext.current
    
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId, QuestionType.TECHNICAL)
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .padding(16.dp)
    ) {
        TechnicalQuestionsHeader(
            onNavigateBack = onNavigateBack,
            completedCount = technicalQuestions.count { it.isCompleted },
            totalCount = technicalQuestions.size
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        error?.let { errorMessage ->
            ErrorMessageCard(errorMessage = errorMessage, onDismiss = { viewModel.clearError() })
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        TechnicalQuestionsContent(
            isLoading = isLoading,
            technicalQuestions = technicalQuestions,
            context = context,
            onNavigateToQuestion = onNavigateToQuestion,
            onToggleCompletion = { questionId, isCompleted ->
                viewModel.updateQuestionCompletion(questionId, isCompleted)
            }
        )
    }
}

@Composable
private fun TechnicalQuestionsHeader(
    onNavigateBack: () -> Unit,
    completedCount: Int,
    totalCount: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onNavigateBack) {
                Icon(
                    Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = colorResource(R.color.text_primary)
                )
            }
            Text(
                text = "Technical Questions",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
        }
        
        Badge(
            containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
            contentColor = colorResource(R.color.primary)
        ) {
            Text("$completedCount/$totalCount")
        }
    }
}

@Composable
private fun ErrorMessageCard(errorMessage: String, onDismiss: () -> Unit) {
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
            TextButton(onClick = onDismiss) {
                Text("Dismiss")
            }
        }
    }
}

@Composable
private fun TechnicalQuestionsContent(
    isLoading: Boolean,
    technicalQuestions: List<TechnicalQuestion>,
    context: android.content.Context,
    onNavigateToQuestion: (String) -> Unit,
    onToggleCompletion: (String, Boolean) -> Unit
) {
    when {
        isLoading && technicalQuestions.isEmpty() -> {
            LoadingState()
        }
        technicalQuestions.isEmpty() -> {
            EmptyState()
        }
        else -> {
            QuestionsList(
                technicalQuestions = technicalQuestions,
                context = context,
                onNavigateToQuestion = onNavigateToQuestion,
                onToggleCompletion = onToggleCompletion
            )
        }
    }
}

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = colorResource(R.color.primary))
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Loading technical questions...",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = colorResource(R.color.text_secondary)
                )
            )
        }
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                Icons.Default.Build,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = colorResource(R.color.text_tertiary)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "No technical questions yet",
                style = MaterialTheme.typography.headlineSmall.copy(
                    color = colorResource(R.color.text_secondary)
                )
            )
        }
    }
}

@Composable
private fun QuestionsList(
    technicalQuestions: List<TechnicalQuestion>,
    context: android.content.Context,
    onNavigateToQuestion: (String) -> Unit,
    onToggleCompletion: (String, Boolean) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(technicalQuestions) { question ->
            TechnicalQuestionCard(
                question = question,
                onClick = { 
                    question.externalUrl?.let { url ->
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        context.startActivity(intent)
                    } ?: onNavigateToQuestion(question.id)
                },
                onToggleCompletion = { 
                    onToggleCompletion(question.id, !question.isCompleted)
                }
            )
        }
    }
}

@Composable
private fun TechnicalQuestionCard(
    question: TechnicalQuestion,
    onClick: () -> Unit,
    onToggleCompletion: () -> Unit
) {
    val context = LocalContext.current
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
                
                question.language?.let { language ->
                    Badge(
                        containerColor = colorResource(R.color.secondary).copy(alpha = 0.2f),
                        contentColor = colorResource(R.color.secondary_foreground)
                    ) {
                        Text(language.uppercase())
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Question Title
            Text(
                text = question.title,
                style = MaterialTheme.typography.titleMedium.copy(
                    color = colorResource(R.color.text_primary),
                    fontWeight = FontWeight.Bold
                ),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Question Description
            Text(
                text = question.description,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = colorResource(R.color.text_secondary)
                ),
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Category
            Badge(
                containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                contentColor = colorResource(R.color.primary)
            ) {
                Text(question.category.replace("-", " ").uppercase())
            }
            
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
                    onClick = { 
                        question.externalUrl?.let { url ->
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            context.startActivity(intent)
                        } ?: onClick()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colorResource(R.color.primary))
                ) {
                    Text("Solve on LeetCode")
                }
            }
        }
    }
}