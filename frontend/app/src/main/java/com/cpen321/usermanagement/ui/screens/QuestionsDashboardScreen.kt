package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.ui.viewmodels.QuestionViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

/**
 * Questions Dashboard Screen
 * Beautiful mobile-optimized interface for managing interview questions
 * Follows Lovable design system with UBC colors
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuestionsDashboardScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    onNavigateToBehavioralQuestions: (String) -> Unit,
    onNavigateToTechnicalQuestions: (String) -> Unit,
    onNavigateToMockInterview: ((String) -> Unit)? = null,
    viewModel: QuestionViewModel = hiltViewModel(),
    mainViewModel: MainViewModel = hiltViewModel()
) {
    val questions by viewModel.questions.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    val questionProgress by viewModel.questionProgress.collectAsStateWithLifecycle()
    
    // MainViewModel state for session creation
    val sessionCreated by mainViewModel.sessionCreated.collectAsStateWithLifecycle()
    val mainUiState by mainViewModel.uiState.collectAsStateWithLifecycle()
    
    var showGenerateDialog by remember { mutableStateOf(false) }
    
    // Load questions when screen is displayed
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId)
        viewModel.loadQuestionProgress(jobId)
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
            .padding(horizontal = 16.dp, vertical = 8.dp)
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
                Column {
                    Text(
                        text = "Interview Questions",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                    questions?.jobApplication?.let { job ->
                        Text(
                            text = "${job.title} at ${job.company}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = colorResource(R.color.text_secondary)
                            )
                        )
                    }
                }
            }
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Start Mock Interview Button
                Button(
                    onClick = { 
                        mainViewModel.createMockInterviewSession(jobId)
                    },
                    enabled = !mainUiState.isCreatingSession,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorResource(R.color.primary),
                        contentColor = colorResource(R.color.white)
                    ),
                    modifier = Modifier.height(40.dp)
                ) {
                    if (mainUiState.isCreatingSession) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = colorResource(R.color.white),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(
                            Icons.Default.PlayArrow,
                            contentDescription = "Start Mock Interview",
                            modifier = Modifier.size(16.dp),
                            tint = colorResource(R.color.white)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (mainUiState.isCreatingSession) "Creating..." else "Mock Interview",
                        style = MaterialTheme.typography.labelMedium,
                        color = colorResource(R.color.white)
                    )
                }
                
                Button(
                    onClick = { showGenerateDialog = true },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorResource(R.color.secondary),
                        contentColor = colorResource(R.color.white)
                    ),
                    modifier = Modifier.height(40.dp)
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = "Generate Questions",
                        modifier = Modifier.size(16.dp),
                        tint = colorResource(R.color.white)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Generate",
                        style = MaterialTheme.typography.labelMedium,
                        color = colorResource(R.color.white)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Progress Overview Card
        questionProgress?.let { progress ->
            ProgressOverviewCard(progress = progress, questions = questions)
            Spacer(modifier = Modifier.height(12.dp))
        }
        
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
                    Icon(
                        Icons.Default.Error,
                        contentDescription = null,
                        tint = colorResource(R.color.error)
                    )
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
        if (isLoading && questions == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(
                        color = colorResource(R.color.primary)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Loading questions...",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            }
        }
        // Empty State
        else if (questions == null || (questions?.behavioralQuestions?.isEmpty() == true && questions?.technicalQuestions?.isEmpty() == true)) {
            EmptyQuestionsState(
                onGenerateQuestions = { showGenerateDialog = true }
            )
        }
        // Questions Content
        else {
            val questionsData = questions ?: return
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Behavioral Questions Section
                if (questionsData.behavioralQuestions?.isNotEmpty() == true) {
                    item {
                        QuestionTypeSection(
                            title = "Behavioral Questions",
                            icon = Icons.Default.Psychology,
                            questions = questionsData.behavioralQuestions ?: emptyList(),
                            completedCount = questionsData.behavioralQuestions?.count { it.isCompleted } ?: 0,
                            totalCount = questionsData.behavioralQuestions?.size ?: 0,
                            onNavigateToQuestions = { onNavigateToBehavioralQuestions(jobId) },
                            onQuestionClick = { question ->
                                viewModel.selectBehavioralQuestion(question as BehavioralQuestion)
                                onNavigateToBehavioralQuestions(jobId)
                            }
                        )
                    }
                }
                
                // Technical Questions Section
                if (questionsData.technicalQuestions?.isNotEmpty() == true) {
                    item {
                        QuestionTypeSection(
                            title = "Technical Questions",
                            icon = Icons.Default.Code,
                            questions = questionsData.technicalQuestions ?: emptyList(),
                            completedCount = questionsData.technicalQuestions?.count { it.isCompleted } ?: 0,
                            totalCount = questionsData.technicalQuestions?.size ?: 0,
                            onNavigateToQuestions = { onNavigateToTechnicalQuestions(jobId) },
                            onQuestionClick = { question ->
                                viewModel.selectTechnicalQuestion(question as TechnicalQuestion)
                                onNavigateToTechnicalQuestions(jobId)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // Generate Questions Dialog
    if (showGenerateDialog) {
        GenerateQuestionsDialog(
            jobId = jobId,
            onDismiss = { showGenerateDialog = false },
            onGenerateQuestions = { questionTypes ->
                viewModel.generateQuestions(jobId, questionTypes)
                showGenerateDialog = false
            },
            onGenerateFromDescription = { jobDescription ->
                viewModel.generateQuestionsFromDescription(jobDescription, jobId)
                showGenerateDialog = false
            }
        )
    }
}

@Composable
private fun ProgressOverviewCard(progress: QuestionProgress, questions: QuestionsData?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Overall Progress",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Medium,
                        color = colorResource(R.color.text_primary)
                    )
                )
                Text(
                    text = "${progress.completionPercentage.toInt()}%",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.primary)
                    )
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Progress Bar
            LinearProgressIndicator(
                progress = { (progress.completionPercentage / 100f).toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = colorResource(R.color.primary),
                trackColor = colorResource(R.color.border)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Progress Stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ProgressStatItem(
                    label = "Total",
                    value = "${(questions?.behavioralQuestions?.size ?: 0) + (questions?.technicalQuestions?.size ?: 0)}",
                    icon = Icons.Default.Quiz
                )
                ProgressStatItem(
                    label = "Completed",
                    value = progress.completedQuestions.toString(),
                    icon = Icons.Default.CheckCircle
                )
                ProgressStatItem(
                    label = "Behavioral",
                    value = "${progress.behavioralCompleted}/${questions?.behavioralQuestions?.size ?: 0}",
                    icon = Icons.Default.Psychology
                )
                ProgressStatItem(
                    label = "Technical",
                    value = "${progress.technicalCompleted}/${questions?.technicalQuestions?.size ?: 0}",
                    icon = Icons.Default.Code
                )
            }
        }
    }
}

@Composable
private fun ProgressStatItem(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = colorResource(R.color.text_secondary),
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold,
                color = colorResource(R.color.text_primary)
            )
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
    }
}

@Composable
private fun QuestionTypeSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    questions: List<Any>,
    completedCount: Int,
    totalCount: Int,
    onNavigateToQuestions: () -> Unit,
    onQuestionClick: (Any) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // Section Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = colorResource(R.color.primary),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                }
                
                // Completion Badge
                Badge(
                    containerColor = if (completedCount == totalCount) 
                        colorResource(R.color.success) 
                    else 
                        colorResource(R.color.primary).copy(alpha = 0.2f),
                    contentColor = if (completedCount == totalCount) 
                        colorResource(R.color.text_on_primary) 
                    else 
                        colorResource(R.color.primary)
                ) {
                    Text(
                        text = "$completedCount/$totalCount",
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Progress Bar
            LinearProgressIndicator(
                progress = { if (totalCount > 0) completedCount.toFloat() / totalCount else 0f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = colorResource(R.color.primary),
                trackColor = colorResource(R.color.border)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Questions Preview
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(questions.take(3)) { question ->
                    QuestionPreviewCard(
                        question = question,
                        onClick = { onQuestionClick(question) }
                    )
                }
                
                if (questions.size > 3) {
                    item {
                        MoreQuestionsCard(
                            remainingCount = questions.size - 3,
                            onClick = onNavigateToQuestions
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Action Button
            Button(
                onClick = onNavigateToQuestions,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary),
                    contentColor = colorResource(R.color.white)
                )
            ) {
                Text(
                    text = "View All Questions",
                    style = MaterialTheme.typography.labelMedium,
                    color = colorResource(R.color.white)
                )
            }
        }
    }
}

@Composable
private fun QuestionPreviewCard(
    question: Any,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(120.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.background_secondary)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val isCompleted = when (question) {
                is BehavioralQuestion -> question.isCompleted
                is TechnicalQuestion -> question.isCompleted
                else -> false
            }
            
            val difficulty = when (question) {
                is BehavioralQuestion -> question.difficulty ?: QuestionDifficulty.EASY
                is TechnicalQuestion -> question.difficulty ?: QuestionDifficulty.EASY
                else -> QuestionDifficulty.EASY
            }
            
            // Completion Status
            Icon(
                imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (isCompleted) colorResource(R.color.success) else colorResource(R.color.text_tertiary),
                modifier = Modifier.size(20.dp)
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Difficulty Badge
            Badge(
                containerColor = when (difficulty) {
                    QuestionDifficulty.EASY -> colorResource(R.color.success).copy(alpha = 0.2f)
                    QuestionDifficulty.MEDIUM -> colorResource(R.color.warning).copy(alpha = 0.2f)
                    QuestionDifficulty.HARD -> colorResource(R.color.error).copy(alpha = 0.2f)
                },
                contentColor = when (difficulty) {
                    QuestionDifficulty.EASY -> colorResource(R.color.success)
                    QuestionDifficulty.MEDIUM -> colorResource(R.color.warning)
                    QuestionDifficulty.HARD -> colorResource(R.color.error)
                }
            ) {
                Text(
                    text = difficulty.displayName,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

@Composable
private fun MoreQuestionsCard(
    remainingCount: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(120.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.primary).copy(alpha = 0.1f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.MoreHoriz,
                contentDescription = null,
                tint = colorResource(R.color.primary),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "+$remainingCount more",
                style = MaterialTheme.typography.bodySmall.copy(
                    color = colorResource(R.color.primary),
                    textAlign = TextAlign.Center
                )
            )
        }
    }
}

@Composable
private fun EmptyQuestionsState(
    onGenerateQuestions: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Quiz,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = colorResource(R.color.text_tertiary)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No questions generated yet",
            style = MaterialTheme.typography.headlineSmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        Text(
            text = "Generate behavioral and technical questions to start practicing",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_tertiary)
            ),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onGenerateQuestions,
            colors = ButtonDefaults.buttonColors(
                containerColor = colorResource(R.color.primary)
            )
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generate Questions")
        }
    }
}

@Composable
private fun GenerateQuestionsDialog(
    jobId: String,
    onDismiss: () -> Unit,
    onGenerateQuestions: (List<QuestionType>) -> Unit,
    onGenerateFromDescription: (String) -> Unit
) {
    var selectedTypes by remember { mutableStateOf(setOf<QuestionType>()) }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Generate Questions",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
        },
        text = {
            Column {
                Text(
                    text = "Select the type(s) of questions you want to generate:",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                // Behavioral Questions Option
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { 
                            selectedTypes = if (selectedTypes.contains(QuestionType.BEHAVIORAL)) {
                                selectedTypes - QuestionType.BEHAVIORAL
                            } else {
                                selectedTypes + QuestionType.BEHAVIORAL
                            }
                        },
                    colors = CardDefaults.cardColors(
                        containerColor = if (selectedTypes.contains(QuestionType.BEHAVIORAL)) 
                            colorResource(R.color.secondary).copy(alpha = 0.1f) 
                        else colorResource(R.color.surface)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = selectedTypes.contains(QuestionType.BEHAVIORAL),
                            onCheckedChange = { isChecked ->
                                selectedTypes = if (isChecked) {
                                    selectedTypes + QuestionType.BEHAVIORAL
                                } else {
                                    selectedTypes - QuestionType.BEHAVIORAL
                                }
                            }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Icon(
                            Icons.Default.Psychology,
                            contentDescription = null,
                            tint = colorResource(R.color.secondary),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Behavioral Questions",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = colorResource(R.color.text_primary)
                                )
                            )
                            Text(
                                text = "AI-generated behavioral interview questions with feedback",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = colorResource(R.color.text_secondary)
                                )
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                // Technical Questions Option
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { 
                            selectedTypes = if (selectedTypes.contains(QuestionType.TECHNICAL)) {
                                selectedTypes - QuestionType.TECHNICAL
                            } else {
                                selectedTypes + QuestionType.TECHNICAL
                            }
                        },
                    colors = CardDefaults.cardColors(
                        containerColor = if (selectedTypes.contains(QuestionType.TECHNICAL)) 
                            colorResource(R.color.primary).copy(alpha = 0.1f) 
                        else colorResource(R.color.surface)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = selectedTypes.contains(QuestionType.TECHNICAL),
                            onCheckedChange = { isChecked ->
                                selectedTypes = if (isChecked) {
                                    selectedTypes + QuestionType.TECHNICAL
                                } else {
                                    selectedTypes - QuestionType.TECHNICAL
                                }
                            }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Icon(
                            Icons.Default.Code,
                            contentDescription = null,
                            tint = colorResource(R.color.primary),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Technical Questions",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = colorResource(R.color.text_primary)
                                )
                            )
                            Text(
                                text = "LeetCode-style coding challenges",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = colorResource(R.color.text_secondary)
                                )
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { 
                    onGenerateQuestions(selectedTypes.toList())
                    onDismiss()
                },
                enabled = selectedTypes.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Text("Generate Questions")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
