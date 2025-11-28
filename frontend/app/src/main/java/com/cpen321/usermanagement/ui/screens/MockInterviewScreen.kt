package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.components.*
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import com.cpen321.usermanagement.ui.viewmodels.MockInterviewViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MockInterviewScreen(
    sessionId: String,
    onBackClick: () -> Unit,
    viewModel: MockInterviewViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(sessionId) {
        viewModel.loadSession(sessionId)
    }
    
    Scaffold(
        topBar = {
            MockInterviewTopBar(onBackClick = onBackClick)
        },
        containerColor = colorResource(R.color.background)
    ) { paddingValues ->
        MockInterviewContentState(
            uiState = uiState,
            sessionId = sessionId,
            viewModel = viewModel,
            paddingValues = paddingValues,
            onBackClick = onBackClick
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MockInterviewTopBar(onBackClick: () -> Unit) {
        TopAppBar(
            title = { 
                Text(
                "Mock Interview",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleLarge
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onBackClick) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack, 
                    contentDescription = "Back",
                    tint = colorResource(R.color.text_primary)
                )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
            containerColor = colorResource(R.color.surface),
            titleContentColor = colorResource(R.color.text_primary)
        )
    )
}

@Composable
private fun MockInterviewContentState(
    uiState: MockInterviewViewModel.UiState,
    sessionId: String,
    viewModel: MockInterviewViewModel,
    paddingValues: PaddingValues,
    onBackClick: () -> Unit
) {
        when (val state = uiState) {
            is MockInterviewViewModel.UiState.Loading -> {
            LoadingState(paddingValues = paddingValues)
        }
        is MockInterviewViewModel.UiState.Error -> {
            ErrorState(
                errorMessage = state.message,
                sessionId = sessionId,
                viewModel = viewModel,
                paddingValues = paddingValues
            )
        }
        is MockInterviewViewModel.UiState.Success -> {
            MockInterviewContent(
                state = state,
                viewModel = viewModel,
                paddingValues = paddingValues,
                onBackClick = onBackClick
            )
        }
    }
}

@Composable
private fun LoadingState(paddingValues: PaddingValues) {
    val spacing = LocalSpacing.current
    
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(spacing.medium)
        ) {
            CircularProgressIndicator(
                modifier = Modifier.size(spacing.extraLarge2),
                color = colorResource(R.color.primary)
            )
            Text(
                "Loading interview session...",
                style = MaterialTheme.typography.bodyMedium,
                color = colorResource(R.color.text_secondary)
            )
        }
    }
}

@Composable
private fun ErrorState(
    errorMessage: String,
    sessionId: String,
    viewModel: MockInterviewViewModel,
    paddingValues: PaddingValues
) {
    val spacing = LocalSpacing.current
    
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(spacing.large),
            modifier = Modifier.padding(spacing.large)
        ) {
            ErrorIcon()
            ErrorTitle()
            ErrorMessage(errorMessage = errorMessage)
            RetryButton(
                onRetry = { viewModel.loadSession(sessionId) }
            )
        }
    }
}

@Composable
private fun ErrorIcon() {
    val spacing = LocalSpacing.current
    
    Icon(
        Icons.Default.Error,
        contentDescription = null,
        modifier = Modifier.size(spacing.extraLarge3),
        tint = colorResource(R.color.error)
    )
}

@Composable
private fun ErrorTitle() {
    Text(
        "Error Loading Session",
        style = MaterialTheme.typography.titleLarge.copy(
            fontWeight = FontWeight.Bold
        ),
        color = colorResource(R.color.text_primary)
    )
}

@Composable
private fun ErrorMessage(errorMessage: String) {
    Text(
        errorMessage,
        style = MaterialTheme.typography.bodyMedium,
        color = colorResource(R.color.text_secondary),
        textAlign = TextAlign.Center
    )
}

@Composable
private fun RetryButton(onRetry: () -> Unit) {
    val spacing = LocalSpacing.current
    
    Button(
        onClick = onRetry,
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary)
        )
    ) {
        Icon(Icons.Default.Refresh, contentDescription = null)
        Spacer(modifier = Modifier.width(spacing.small))
        Text("Retry")
    }
}

@Composable
private fun MockInterviewContent(
    state: MockInterviewViewModel.UiState.Success,
    viewModel: MockInterviewViewModel,
    paddingValues: PaddingValues,
    onBackClick: () -> Unit
) {
    val spacing = LocalSpacing.current
    val isSessionComplete = calculateSessionComplete(state)
    val scrollState = rememberScrollState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(scrollState)
            .padding(horizontal = spacing.large, vertical = spacing.medium),
        verticalArrangement = Arrangement.spacedBy(spacing.large)
    ) {
        SessionCompletionSection(
            isSessionComplete = isSessionComplete,
            feedback = state.feedback
        )
        
        MainContentSection(state = state)
        
        AnswerAndButtonsSection(
            state = state,
            viewModel = viewModel,
            isSessionComplete = isSessionComplete
        )

        TipsAndEndSessionSection(
            hasFeedback = state.feedback != null,
            viewModel = viewModel,
            onBackClick = onBackClick
        )
    }
}

private fun calculateSessionComplete(state: MockInterviewViewModel.UiState.Success): Boolean {
    return state.session.answeredQuestions >= state.session.totalQuestions
}

@Composable
private fun SessionCompletionSection(
    isSessionComplete: Boolean,
    feedback: com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback?
) {
    val spacing = LocalSpacing.current
    
    if (isSessionComplete && feedback?.sessionCompleted == true) {
        SessionCompleteCard()
        Spacer(modifier = Modifier.height(spacing.small))
    }
}

@Composable
private fun MainContentSection(
    state: MockInterviewViewModel.UiState.Success
) {
    EnhancedProgressCard(
            completedQuestions = state.session.answeredQuestions,
        totalQuestions = state.session.totalQuestions,
        currentIndex = state.session.currentQuestionIndex
        )
        
        state.currentQuestion?.let { question ->
        EnhancedQuestionCard(
                questionNumber = state.session.currentQuestionIndex + 1,
                totalQuestions = state.session.totalQuestions,
                questionText = question.title
            )
        }
        
        state.feedback?.let { feedback ->
        EnhancedFeedbackCard(feedback = feedback)
    }
}

@Composable
private fun AnswerAndButtonsSection(
    state: MockInterviewViewModel.UiState.Success,
    viewModel: MockInterviewViewModel,
    isSessionComplete: Boolean
) {
    if (state.feedback == null && !isSessionComplete) {
        EnhancedAnswerInputCard(
                answer = state.answer,
            onAnswerChange = viewModel::updateAnswer,
            characterCount = state.answer.length
            )
            
        EnhancedActionButtonsRow(
                onPrevious = viewModel::previousQuestion,
                onSaveSession = viewModel::saveSession,
                onSubmitAnswer = viewModel::submitAnswer,
                canGoPrevious = state.session.currentQuestionIndex > 0,
                hasAnswer = state.answer.isNotBlank(),
                isSubmitting = state.isSubmitting,
                isSaving = state.isSaving
            )
    } else if (state.feedback != null && !isSessionComplete) {
        FeedbackNavigationButtons(
            onPrevious = viewModel::previousQuestion,
            onSaveSession = viewModel::saveSession,
            onNext = viewModel::nextQuestion,
            canGoPrevious = state.session.currentQuestionIndex > 0,
            canGoNext = !state.feedback.isLastQuestion,
            isSaving = state.isSaving
        )
    }
}

@Composable
private fun TipsAndEndSessionSection(
    hasFeedback: Boolean,
    viewModel: MockInterviewViewModel,
    onBackClick: () -> Unit
) {
    val spacing = LocalSpacing.current
    
    if (!hasFeedback) {
        EnhancedTipsCard()
    }
    
    EndSessionButton(
        onEndSession = { viewModel.endSession(onComplete = onBackClick) },
        spacing = spacing
    )
}

@Composable
private fun EndSessionButton(
    onEndSession: () -> Unit,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing
) {
        OutlinedButton(
        onClick = onEndSession,
        modifier = Modifier
            .fillMaxWidth()
            .height(spacing.extraLarge2),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colorResource(R.color.error)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp, 
            colorResource(R.color.error).copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Icon(
            Icons.Default.ExitToApp,
            contentDescription = "End Session",
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(spacing.small))
        Text(
            "End Session",
            style = MaterialTheme.typography.labelLarge
        )
    }
}

