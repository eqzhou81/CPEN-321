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
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
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
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier.padding(24.dp)
        ) {
            Icon(
                Icons.Default.Error,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = colorResource(R.color.error)
            )
            Text(
                "Error Loading Session",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = colorResource(R.color.text_primary)
            )
            Text(
                errorMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = colorResource(R.color.text_secondary),
                textAlign = TextAlign.Center
            )
            Button(
                onClick = { viewModel.loadSession(sessionId) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Retry")
            }
        }
    }
}

@Composable
private fun MockInterviewContent(
    state: MockInterviewViewModel.UiState.Success,
    viewModel: MockInterviewViewModel,
    paddingValues: PaddingValues,
    onBackClick: () -> Unit
) {
    val isSessionComplete = state.session.answeredQuestions >= state.session.totalQuestions
    val scrollState = rememberScrollState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
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
            onBackClick = onBackClick
        )
    }
}

@Composable
private fun SessionCompletionSection(
    isSessionComplete: Boolean,
    feedback: com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback?
) {
    if (isSessionComplete && feedback?.sessionCompleted == true) {
        SessionCompleteCard()
        Spacer(modifier = Modifier.height(8.dp))
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
                isSubmitting = state.isSubmitting
            )
    } else if (state.feedback != null && !isSessionComplete) {
        FeedbackNavigationButtons(
            onPrevious = viewModel::previousQuestion,
            onSaveSession = viewModel::saveSession,
            onNext = viewModel::nextQuestion,
            canGoPrevious = state.session.currentQuestionIndex > 0,
            canGoNext = !state.feedback.isLastQuestion
        )
    }
}

@Composable
private fun TipsAndEndSessionSection(
    hasFeedback: Boolean,
    onBackClick: () -> Unit
) {
    if (!hasFeedback) {
        EnhancedTipsCard()
    }
        
        OutlinedButton(
            onClick = onBackClick,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colorResource(R.color.text_secondary)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp, 
            colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        )
    ) {
        Icon(Icons.Default.ExitToApp, contentDescription = null)
        Spacer(modifier = Modifier.width(8.dp))
        Text("End Session")
    }
}

