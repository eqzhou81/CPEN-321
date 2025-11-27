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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.viewmodels.QuestionViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel

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
    val questionProgress by viewModel.questionProgress.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    
    val sessionCreated by mainViewModel.sessionCreated.collectAsStateWithLifecycle()
    val mainUiState by mainViewModel.uiState.collectAsStateWithLifecycle()
    
    var hasAttemptedGeneration by remember { mutableStateOf(false) }
    var shouldReload by remember { mutableStateOf(false) }
    var showGenerateDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(sessionCreated) {
        sessionCreated?.let { sessionId ->
            onNavigateToMockInterview?.invoke(sessionId)
            mainViewModel.clearSessionCreated()
        }
    }
    
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId)
        viewModel.loadQuestionProgress(jobId)
    }

    LaunchedEffect(questions, isLoading) {
        val shouldAutoGenerate = !isLoading &&
            questions != null &&
            questions!!.totalQuestions == 0 &&
            !hasAttemptedGeneration

        if (shouldAutoGenerate) {
            hasAttemptedGeneration = true
            viewModel.generateQuestions(jobId)
            shouldReload = true
        }
    }

    LaunchedEffect(shouldReload, isLoading) {
        if (shouldReload && !isLoading) {
            kotlinx.coroutines.delay(1000)
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
        QuestionsDashboardHeader(onNavigateBack = onNavigateBack)
        Spacer(modifier = Modifier.height(24.dp))
        
        QuestionsDashboardErrorStates(
            error = error,
            sessionError = mainUiState.errorMessage,
            viewModel = viewModel,
            mainViewModel = mainViewModel,
            jobId = jobId,
            onRetry = {
                hasAttemptedGeneration = false
                shouldReload = false
                viewModel.generateQuestions(jobId)
                shouldReload = true
            }
        )
        
        QuestionsDashboardContent(
            isLoading = isLoading,
            shouldReload = shouldReload,
            questions = questions,
            mainUiState = mainUiState,
            jobId = jobId,
            onNavigateToTechnicalQuestions = { onNavigateToTechnicalQuestions(jobId) },
            onCreateMockInterview = { mainViewModel.createMockInterviewSession(jobId) },
            showGenerateDialog = showGenerateDialog,
            onShowGenerateDialog = { showGenerateDialog = true },
            onDismissGenerateDialog = { showGenerateDialog = false },
            onGenerateQuestions = { selectedTypes ->
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
private fun QuestionsDashboardHeader(onNavigateBack: () -> Unit) {
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
}

@Composable
private fun QuestionsDashboardErrorStates(
    error: String?,
    sessionError: String?,
    viewModel: QuestionViewModel,
    mainViewModel: MainViewModel,
    jobId: String,
    onRetry: () -> Unit
) {
    error?.let { errorMessage ->
        ErrorCard(
            title = "Error",
            message = errorMessage,
            onRetry = {
                viewModel.clearError()
                onRetry()
            }
        )
        Spacer(modifier = Modifier.height(16.dp))
    }
    
    sessionError?.let { errorMessage ->
        ErrorCard(
            title = "Session Error",
            message = errorMessage,
            onRetry = {
                mainViewModel.clearErrorMessage()
                mainViewModel.createMockInterviewSession(jobId)
            }
        )
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun ErrorCard(title: String, message: String, onRetry: () -> Unit) {
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
                    text = title,
                    style = MaterialTheme.typography.titleSmall.copy(
                        color = colorResource(R.color.error),
                        fontWeight = FontWeight.Bold
                    )
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.error)
                    )
                )
            }
            TextButton(onClick = onRetry) {
                Text("Retry")
            }
        }
    }
}

@Composable
private fun QuestionsDashboardContent(
    isLoading: Boolean,
    shouldReload: Boolean,
    questions: com.cpen321.usermanagement.data.remote.dto.QuestionsResponse?,
    mainUiState: com.cpen321.usermanagement.ui.viewmodels.MainViewModel.MainUiState,
    jobId: String,
    onNavigateToTechnicalQuestions: () -> Unit,
    onCreateMockInterview: () -> Unit,
    showGenerateDialog: Boolean,
    onShowGenerateDialog: () -> Unit,
    onDismissGenerateDialog: () -> Unit,
    onGenerateQuestions: (List<String>) -> Unit
) {
    when {
        isLoading || shouldReload -> LoadingState()
        questions != null && questions.totalQuestions > 0 -> {
            if (mainUiState.isCreatingSession) {
                SessionCreationLoadingState()
            } else {
                QuestionsAvailableContent(
                    questions = questions,
                    onNavigateToTechnicalQuestions = onNavigateToTechnicalQuestions,
                    onCreateMockInterview = onCreateMockInterview
                )
            }
        }
        else -> EmptyState(onShowGenerateDialog = onShowGenerateDialog)
    }
    
    GenerateQuestionsDialog(
        showDialog = showGenerateDialog,
        onDismiss = onDismissGenerateDialog,
        onGenerate = onGenerateQuestions
    )
}

@Composable
private fun LoadingState() {
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

@Composable
private fun SessionCreationLoadingState() {
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
                text = "Starting mock interview...",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = colorResource(R.color.text_primary),
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}

@Composable
private fun QuestionsAvailableContent(
    questions: com.cpen321.usermanagement.data.remote.dto.QuestionsResponse,
    onNavigateToTechnicalQuestions: () -> Unit,
    onCreateMockInterview: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        QuestionTypeCard(
            title = "Start Mock Interview",
            description = "Practice behavioral interview questions with AI feedback",
            icon = Icons.Default.QuestionAnswer,
            questionCount = questions.behavioralQuestions.size,
            completedCount = questions.behavioralQuestions.count { it.status == "completed" },
            onClick = onCreateMockInterview
        )

        if (questions.technicalQuestions.isNotEmpty()) {
            QuestionTypeCard(
                title = "Technical Questions",
                description = "Solve coding challenges on LeetCode",
                icon = Icons.Default.Code,
                questionCount = questions.technicalQuestions.size,
                completedCount = questions.technicalQuestions.count { it.status == "completed" },
                onClick = onNavigateToTechnicalQuestions
            )
        }
    }
}

@Composable
private fun EmptyState(onShowGenerateDialog: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
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
                onClick = onShowGenerateDialog,
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Text("Generate Questions")
            }
        }
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
        QuestionTypeCardContent(
            title = title,
            description = description,
            icon = icon,
            questionCount = questionCount,
            completedCount = completedCount
        )
    }
}

@Composable
private fun QuestionTypeCardContent(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    questionCount: Int,
    completedCount: Int
) {
    Row(
        modifier = Modifier
            .padding(20.dp)
            .fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        QuestionTypeCardInfo(
            title = title,
            description = description,
            icon = icon,
            questionCount = questionCount,
            completedCount = completedCount
        )
        Icon(
            Icons.Default.ChevronRight,
            contentDescription = "Navigate",
            tint = colorResource(R.color.text_tertiary)
        )
    }
}

@Composable
private fun QuestionTypeCardInfo(
    title: String,
    description: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    questionCount: Int,
    completedCount: Int
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
                modifier = Modifier.testTag("${title.lowercase().replace(" ", "_")}_button"),
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