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
import com.cpen321.usermanagement.data.remote.dto.QuestionsData
import com.cpen321.usermanagement.data.remote.dto.QuestionProgress
import com.cpen321.usermanagement.ui.viewmodels.QuestionViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainViewModel
import com.cpen321.usermanagement.ui.viewmodels.MainUiState

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
    val state = QuestionsDashboardState(viewModel, mainViewModel)
    var hasAttemptedGeneration by remember { mutableStateOf(false) }
    var shouldReload by remember { mutableStateOf(false) }
    var showGenerateDialog by remember { mutableStateOf(false) }
    
    QuestionsDashboardEffects(
        jobId = jobId,
        state = QuestionsDashboardEffectsState(
            sessionCreated = state.sessionCreated,
            questions = state.questions,
            isLoading = state.isLoading,
            hasAttemptedGeneration = hasAttemptedGeneration,
            shouldReload = shouldReload
        ),
        onNavigateToMockInterview = onNavigateToMockInterview,
        viewModel = viewModel,
        mainViewModel = mainViewModel,
        callbacks = QuestionsDashboardEffectsCallbacks(
            onHasAttemptedGenerationChanged = { hasAttemptedGeneration = it },
            onShouldReloadChanged = { shouldReload = it }
        )
    )
    
    val handlers = createQuestionsDashboardHandlers(
        jobId = jobId,
        viewModel = viewModel,
        onShouldReloadChanged = { shouldReload = it },
        onShowGenerateDialogChanged = { showGenerateDialog = it },
        onHasAttemptedGenerationChanged = { hasAttemptedGeneration = it }
    )
    
    QuestionsDashboardLayout(
        state = QuestionsDashboardLayoutState(
            error = state.error,
            sessionError = state.mainUiState.errorMessage,
            isLoading = state.isLoading,
            shouldReload = shouldReload,
            questions = state.questions,
            mainUiState = state.mainUiState,
            showGenerateDialog = showGenerateDialog
        ),
        jobId = jobId,
        viewModel = viewModel,
        mainViewModel = mainViewModel,
        callbacks = QuestionsDashboardLayoutCallbacks(
            onNavigateBack = onNavigateBack,
            onNavigateToTechnicalQuestions = { onNavigateToTechnicalQuestions(jobId) },
            onCreateMockInterview = { mainViewModel.createMockInterviewSession(jobId) },
            onShowGenerateDialog = { showGenerateDialog = true },
            onDismissGenerateDialog = { showGenerateDialog = false },
            onGenerateQuestions = handlers.generateQuestions,
            onRetry = handlers.retry
        )
    )
}

@Composable
private fun QuestionsDashboardState(
    viewModel: QuestionViewModel,
    mainViewModel: MainViewModel
) = QuestionsDashboardStateData(
    questions = viewModel.questions.collectAsStateWithLifecycle().value,
    questionProgress = viewModel.questionProgress.collectAsStateWithLifecycle().value,
    isLoading = viewModel.isLoading.collectAsStateWithLifecycle().value,
    error = viewModel.error.collectAsStateWithLifecycle().value,
    sessionCreated = mainViewModel.sessionCreated.collectAsStateWithLifecycle().value,
    mainUiState = mainViewModel.uiState.collectAsStateWithLifecycle().value
)

private data class QuestionsDashboardStateData(
    val questions: QuestionsData?,
    val questionProgress: QuestionProgress?,
    val isLoading: Boolean,
    val error: String?,
    val sessionCreated: String?,
    val mainUiState: MainUiState
)

private data class QuestionsDashboardHandlers(
    val generateQuestions: (List<String>) -> Unit,
    val retry: () -> Unit
)

private fun createQuestionsDashboardHandlers(
    jobId: String,
    viewModel: QuestionViewModel,
    onShouldReloadChanged: (Boolean) -> Unit,
    onShowGenerateDialogChanged: (Boolean) -> Unit,
    onHasAttemptedGenerationChanged: (Boolean) -> Unit
): QuestionsDashboardHandlers {
    return QuestionsDashboardHandlers(
        generateQuestions = { selectedTypes ->
            val types = selectedTypes.map { typeName ->
                when (typeName) {
                    "behavioral" -> com.cpen321.usermanagement.data.remote.dto.QuestionType.BEHAVIORAL
                    "technical" -> com.cpen321.usermanagement.data.remote.dto.QuestionType.TECHNICAL
                    else -> com.cpen321.usermanagement.data.remote.dto.QuestionType.BEHAVIORAL
                }
            }
            viewModel.generateQuestions(jobId, types)
            onShouldReloadChanged(true)
            onShowGenerateDialogChanged(false)
        },
        retry = {
            onHasAttemptedGenerationChanged(false)
            onShouldReloadChanged(false)
            viewModel.generateQuestions(jobId)
            onShouldReloadChanged(true)
        }
    )
}

private data class QuestionsDashboardEffectsState(
    val sessionCreated: String?,
    val questions: QuestionsData?,
    val isLoading: Boolean,
    val hasAttemptedGeneration: Boolean,
    val shouldReload: Boolean
)

private data class QuestionsDashboardEffectsCallbacks(
    val onHasAttemptedGenerationChanged: (Boolean) -> Unit,
    val onShouldReloadChanged: (Boolean) -> Unit
)

@Composable
private fun QuestionsDashboardEffects(
    jobId: String,
    state: QuestionsDashboardEffectsState,
    onNavigateToMockInterview: ((String) -> Unit)?,
    viewModel: QuestionViewModel,
    mainViewModel: MainViewModel,
    callbacks: QuestionsDashboardEffectsCallbacks
) {
    LaunchedEffect(state.sessionCreated) {
        state.sessionCreated?.let { sessionId ->
            onNavigateToMockInterview?.invoke(sessionId)
            mainViewModel.clearSessionCreated()
        }
    }
    
    LaunchedEffect(jobId) {
        viewModel.loadQuestions(jobId)
        viewModel.loadQuestionProgress(jobId)
    }

    LaunchedEffect(state.questions, state.isLoading) {
        val shouldAutoGenerate = !state.isLoading &&
            state.questions != null &&
            state.questions!!.totalQuestions == 0 &&
            !state.hasAttemptedGeneration

        if (shouldAutoGenerate) {
            callbacks.onHasAttemptedGenerationChanged(true)
            viewModel.generateQuestions(jobId)
            callbacks.onShouldReloadChanged(true)
        }
    }

    LaunchedEffect(state.shouldReload, state.isLoading) {
        if (state.shouldReload && !state.isLoading) {
            kotlinx.coroutines.delay(1000)
            viewModel.loadQuestions(jobId)
            viewModel.loadQuestionProgress(jobId)
            callbacks.onShouldReloadChanged(false)
        }
    }
}

private data class QuestionsDashboardLayoutState(
    val error: String?,
    val sessionError: String?,
    val isLoading: Boolean,
    val shouldReload: Boolean,
    val questions: QuestionsData?,
    val mainUiState: MainUiState,
    val showGenerateDialog: Boolean
)

private data class QuestionsDashboardLayoutCallbacks(
    val onNavigateBack: () -> Unit,
    val onNavigateToTechnicalQuestions: () -> Unit,
    val onCreateMockInterview: () -> Unit,
    val onShowGenerateDialog: () -> Unit,
    val onDismissGenerateDialog: () -> Unit,
    val onGenerateQuestions: (List<String>) -> Unit,
    val onRetry: () -> Unit
)

private data class QuestionsDashboardContentState(
    val isLoading: Boolean,
    val shouldReload: Boolean,
    val questions: QuestionsData?,
    val mainUiState: MainUiState,
    val jobId: String,
    val showGenerateDialog: Boolean
)

private data class QuestionsDashboardContentCallbacks(
    val onNavigateToTechnicalQuestions: () -> Unit,
    val onCreateMockInterview: () -> Unit,
    val onShowGenerateDialog: () -> Unit,
    val onDismissGenerateDialog: () -> Unit,
    val onGenerateQuestions: (List<String>) -> Unit
)

@Composable
private fun QuestionsDashboardLayout(
    state: QuestionsDashboardLayoutState,
    jobId: String,
    viewModel: QuestionViewModel,
    mainViewModel: MainViewModel,
    callbacks: QuestionsDashboardLayoutCallbacks
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .padding(16.dp)
    ) {
        QuestionsDashboardHeader(onNavigateBack = callbacks.onNavigateBack)
        Spacer(modifier = Modifier.height(24.dp))
        QuestionsDashboardErrorStates(
            error = state.error,
            sessionError = state.sessionError,
            viewModel = viewModel,
            mainViewModel = mainViewModel,
            jobId = jobId,
            onRetry = callbacks.onRetry
        )
        QuestionsDashboardContent(
            state = QuestionsDashboardContentState(
                isLoading = state.isLoading,
                shouldReload = state.shouldReload,
                questions = state.questions,
                mainUiState = state.mainUiState,
                jobId = jobId,
                showGenerateDialog = state.showGenerateDialog
            ),
            callbacks = QuestionsDashboardContentCallbacks(
                onNavigateToTechnicalQuestions = callbacks.onNavigateToTechnicalQuestions,
                onCreateMockInterview = callbacks.onCreateMockInterview,
                onShowGenerateDialog = callbacks.onShowGenerateDialog,
                onDismissGenerateDialog = callbacks.onDismissGenerateDialog,
                onGenerateQuestions = callbacks.onGenerateQuestions
            )
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
    state: QuestionsDashboardContentState,
    callbacks: QuestionsDashboardContentCallbacks
) {
    when {
        state.isLoading || state.shouldReload -> LoadingState()
        state.questions != null && state.questions.totalQuestions > 0 -> {
            if (state.mainUiState.isCreatingSession) {
                SessionCreationLoadingState()
            } else {
                QuestionsAvailableContent(
                    questions = state.questions,
                    onNavigateToTechnicalQuestions = callbacks.onNavigateToTechnicalQuestions,
                    onCreateMockInterview = callbacks.onCreateMockInterview
                )
            }
        }
        else -> EmptyState(onShowGenerateDialog = callbacks.onShowGenerateDialog)
    }
    
    GenerateQuestionsDialog(
        showDialog = state.showGenerateDialog,
        onDismiss = callbacks.onDismissGenerateDialog,
        onGenerate = callbacks.onGenerateQuestions
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
    questions: QuestionsData,
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
            completedCount = completedCount,
            modifier = Modifier.weight(1f)
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
    completedCount: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
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
private fun QuestionTypeCheckboxRow(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange)
        Spacer(modifier = Modifier.width(8.dp))
        Text(label)
    }
}

@Composable
private fun GenerateQuestionsDialogContent(
    behavioralSelected: Boolean,
    technicalSelected: Boolean,
    onBehavioralChanged: (Boolean) -> Unit,
    onTechnicalChanged: (Boolean) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        QuestionTypeCheckboxRow(
            checked = behavioralSelected,
            onCheckedChange = onBehavioralChanged,
            label = "Behavioral Questions"
        )
        QuestionTypeCheckboxRow(
            checked = technicalSelected,
            onCheckedChange = onTechnicalChanged,
            label = "Technical Questions"
        )
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
    
    LaunchedEffect(showDialog) {
        if (showDialog) {
            behavioralSelected = true
            technicalSelected = true
        }
    }
    
    if (showDialog) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Select Question Types") },
            text = {
                GenerateQuestionsDialogContent(
                    behavioralSelected = behavioralSelected,
                    technicalSelected = technicalSelected,
                    onBehavioralChanged = { behavioralSelected = it },
                    onTechnicalChanged = { technicalSelected = it }
                )
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