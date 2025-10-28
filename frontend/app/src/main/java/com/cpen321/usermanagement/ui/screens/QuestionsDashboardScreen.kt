package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.viewmodels.QuestionViewModel

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
    val questionProgress by viewModel.questionProgress.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    
    // Track if we've attempted to generate questions
    var hasAttemptedGeneration by remember { mutableStateOf(false) }
    var shouldReload by remember { mutableStateOf(false) }
    var showGenerateDialog by remember { mutableStateOf(false) }
    
    // Load questions when screen is displayed
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId)
        viewModel.loadQuestionProgress(jobId)
    }

    // Auto-generate questions if none exist
    LaunchedEffect(questions, isLoading) {
        if (!isLoading && questions != null && questions!!.totalQuestions == 0 && !hasAttemptedGeneration) {
            hasAttemptedGeneration = true
            viewModel.generateQuestions(jobId)
            shouldReload = true  // Mark that we should reload after generation
        }
    }

    // Reload questions after generation
    LaunchedEffect(shouldReload, isLoading) {
        if (shouldReload && !isLoading) {
            // Wait for backend to finish saving
            kotlinx.coroutines.delay(1000)  // Increased delay
            viewModel.loadQuestions(jobId)
            viewModel.loadQuestionProgress(jobId)
            shouldReload = false
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
                        text = "Interview Questions",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Error State
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
                        Icons.Default.Warning,
                        contentDescription = null,
                        tint = colorResource(R.color.error)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Error",
                            style = MaterialTheme.typography.titleSmall.copy(
                                color = colorResource(R.color.error),
                                fontWeight = FontWeight.Bold
                            )
                        )
                    Text(
                        text = errorMessage,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = colorResource(R.color.error)
                            )
                        )
                    }
                    TextButton(onClick = {
                        viewModel.clearError()
                        hasAttemptedGeneration = false
                        shouldReload = false
                        viewModel.generateQuestions(jobId)
                        shouldReload = true
                    }) {
                        Text("Retry")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        // Loading State
        if (isLoading || shouldReload) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(
                        color = colorResource(R.color.primary),
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Generating your interview questions...",
                        style = MaterialTheme.typography.titleMedium.copy(
                            color = colorResource(R.color.text_primary),
                            fontWeight = FontWeight.Medium
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "This may take a few moments",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            }
        }
        // Questions Available
        else if (questions != null && questions!!.totalQuestions > 0) {
            // Question Type Cards with Individual Progress
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Behavioral Questions Card
                if (questions!!.behavioralQuestions.isNotEmpty()) {
                    QuestionTypeCard(
                            title = "Behavioral Questions",
                        description = "Practice common behavioral interview questions",
                            icon = Icons.Default.Psychology,
                        questionCount = questions!!.behavioralQuestions.size,
                        completedCount = questions!!.behavioralQuestions.count { it.status == "completed" },
                        onClick = { onNavigateToBehavioralQuestions(jobId) }
                    )
                }

                // Technical Questions Card
                if (questions!!.technicalQuestions.isNotEmpty()) {
                    QuestionTypeCard(
                            title = "Technical Questions",
                        description = "Solve coding challenges on LeetCode",
                            icon = Icons.Default.Code,
                        questionCount = questions!!.technicalQuestions.size,
                        completedCount = questions!!.technicalQuestions.count { it.status == "completed" },
                        onClick = { onNavigateToTechnicalQuestions(jobId) }
                    )
                }
            }
        }
        // Empty State
        else if (!isLoading && !shouldReload) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.QuestionAnswer,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = colorResource(R.color.text_tertiary)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No questions available",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
            Button(
                        onClick = {
                            showGenerateDialog = true
                        },
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                        Text("Generate Questions")
                    }
                }
            }
        }
        
        // Generate Questions Dialog - Always Available
        GenerateQuestionsDialog(
            showDialog = showGenerateDialog,
            onDismiss = { showGenerateDialog = false },
            onGenerate = { selectedTypes ->
                val types = selectedTypes.map { typeName ->
                    when (typeName) {
                        "behavioral" -> com.cpen321.usermanagement.data.remote.dto.QuestionType.BEHAVIORAL
                        "technical" -> com.cpen321.usermanagement.data.remote.dto.QuestionType.TECHNICAL
                        else -> com.cpen321.usermanagement.data.remote.dto.QuestionType.BEHAVIORAL
                    }
                }
                viewModel.generateQuestions(jobId, types)
                shouldReload = true
                showGenerateDialog = false
            }
        )
    }
}

@Composable
private fun QuestionTypeCard(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    questionCount: Int,
    completedCount: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(20.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
        ) {
            Icon(
                    icon,
                contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = colorResource(R.color.primary)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
        Text(
                        text = title,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                        text = description,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    )
                )
                    Spacer(modifier = Modifier.height(8.dp))
                    Badge(
                        containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                        contentColor = colorResource(R.color.primary)
                    ) {
                        Text("$completedCount/$questionCount completed")
                    }
                }
            }
        Icon(
                Icons.Default.ChevronRight,
                contentDescription = "Navigate",
            tint = colorResource(R.color.text_tertiary)
            )
        }
    }
}

@Composable
private fun GenerateQuestionsDialog(
    showDialog: Boolean,
    onDismiss: () -> Unit,
    onGenerate: (List<String>) -> Unit
) {
    var behavioralSelected by remember { mutableStateOf(true) }
    var technicalSelected by remember { mutableStateOf(true) }
    
    // Reset to defaults when dialog opens
    LaunchedEffect(showDialog) {
        if (showDialog) {
            behavioralSelected = true
            technicalSelected = true
        }
    }
    
    if (showDialog) {
        AlertDialog(
        onDismissRequest = onDismiss,
        title = {
                Text("Select Question Types")
        },
        text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(
                            checked = behavioralSelected,
                            onCheckedChange = { behavioralSelected = it }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Behavioral Questions")
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Checkbox(
                            checked = technicalSelected,
                            onCheckedChange = { technicalSelected = it }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Technical Questions")
                }
            }
        },
        confirmButton = {
            Button(
                    onClick = {
                        val selectedTypes = mutableListOf<String>()
                        if (behavioralSelected) selectedTypes.add("behavioral")
                        if (technicalSelected) selectedTypes.add("technical")
                        onGenerate(selectedTypes)
                    },
                    enabled = behavioralSelected || technicalSelected
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
}