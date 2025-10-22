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
    viewModel: QuestionViewModel = hiltViewModel()
) {
    val questions by viewModel.questions.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    val questionProgress by viewModel.questionProgress.collectAsStateWithLifecycle()
    
    var showGenerateDialog by remember { mutableStateOf(false) }
    
    // Load questions when screen is displayed
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId)
        viewModel.loadQuestionProgress(jobId)
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
                Column {
                    Text(
                        text = "Interview Questions",
                        style = MaterialTheme.typography.headlineMedium.copy(
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
            
            FloatingActionButton(
                onClick = { showGenerateDialog = true },
                containerColor = colorResource(R.color.primary),
                contentColor = colorResource(R.color.text_on_primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Generate Questions")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Progress Overview Card
        questionProgress?.let { progress ->
            ProgressOverviewCard(progress = progress)
            Spacer(modifier = Modifier.height(24.dp))
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
                if (questionsData.behavioralQuestions.isNotEmpty()) {
                    item {
                        QuestionTypeSection(
                            title = "Behavioral Questions",
                            icon = Icons.Default.Psychology,
                            questions = questionsData.behavioralQuestions,
                            completedCount = questionsData.behavioralQuestions.count { it.isCompleted },
                            totalCount = questionsData.behavioralQuestions.size,
                            onNavigateToQuestions = { onNavigateToBehavioralQuestions(jobId) },
                            onQuestionClick = { question ->
                                viewModel.selectBehavioralQuestion(question as BehavioralQuestion)
                                onNavigateToBehavioralQuestions(jobId)
                            }
                        )
                    }
                }
                
                // Technical Questions Section
                if (questionsData.technicalQuestions.isNotEmpty()) {
                    item {
                        QuestionTypeSection(
                            title = "Technical Questions",
                            icon = Icons.Default.Code,
                            questions = questionsData.technicalQuestions,
                            completedCount = questionsData.technicalQuestions.count { it.isCompleted },
                            totalCount = questionsData.technicalQuestions.size,
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
            onDismiss = { showGenerateDialog = false },
            onGenerateQuestions = { questionTypes ->
                viewModel.generateQuestions(jobId, questionTypes)
                showGenerateDialog = false
            }
        )
    }
}

@Composable
private fun ProgressOverviewCard(progress: QuestionProgress) {
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
                    value = progress.totalQuestions.toString(),
                    icon = Icons.Default.Quiz
                )
                ProgressStatItem(
                    label = "Completed",
                    value = progress.completedQuestions.toString(),
                    icon = Icons.Default.CheckCircle
                )
                ProgressStatItem(
                    label = "Behavioral",
                    value = "${progress.behavioralCompleted}/${progress.totalQuestions}",
                    icon = Icons.Default.Psychology
                )
                ProgressStatItem(
                    label = "Technical",
                    value = "${progress.technicalCompleted}/${progress.totalQuestions}",
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
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Text("View All Questions")
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
                is BehavioralQuestion -> question.difficulty
                is TechnicalQuestion -> question.difficulty
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
    onDismiss: () -> Unit,
    onGenerateQuestions: (List<QuestionType>) -> Unit
) {
    var selectedTypes by remember { mutableStateOf(setOf(QuestionType.BEHAVIORAL, QuestionType.TECHNICAL)) }
    
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
                    text = "Select the types of questions you want to generate:",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                QuestionType.values().forEach { type ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedTypes = if (selectedTypes.contains(type)) {
                                    selectedTypes - type
                                } else {
                                    selectedTypes + type
                                }
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = selectedTypes.contains(type),
                            onCheckedChange = { isChecked ->
                                selectedTypes = if (isChecked) {
                                    selectedTypes + type
                                } else {
                                    selectedTypes - type
                                }
                            },
                            colors = CheckboxDefaults.colors(
                                checkedColor = colorResource(R.color.primary)
                            )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = when (type) {
                                QuestionType.BEHAVIORAL -> "Behavioral Questions (OpenAI)"
                                QuestionType.TECHNICAL -> "Technical Questions (LeetCode)"
                            },
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = colorResource(R.color.text_primary)
                            )
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onGenerateQuestions(selectedTypes.toList()) },
                enabled = selectedTypes.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Text("Generate")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
