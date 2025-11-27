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

@Composable
private fun SessionCompleteCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.success).copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = colorResource(R.color.success)
            )
            Text(
                "Session Complete! 🎉",
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = colorResource(R.color.success)
            )
            Text(
                "Great job completing all questions! Review your feedback to improve.",
                style = MaterialTheme.typography.bodyMedium,
                color = colorResource(R.color.text_secondary),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun EnhancedProgressCard(
    completedQuestions: Int,
    totalQuestions: Int,
    currentIndex: Int
) {
    // Use answeredQuestions for progress calculation to match backend
    val progress = if (totalQuestions > 0) {
        completedQuestions.toFloat() / totalQuestions
    } else {
        0f
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Progress",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = colorResource(R.color.text_primary)
            )
            
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(12.dp)
                    .clip(RoundedCornerShape(6.dp)),
                color = colorResource(R.color.primary),
                trackColor = colorResource(R.color.primary).copy(alpha = 0.2f)
            )
            
            Text(
                "Question ${currentIndex + 1} of $totalQuestions",
                style = MaterialTheme.typography.bodySmall,
                color = colorResource(R.color.text_secondary)
            )
        }
    }
}

@Composable
private fun EnhancedQuestionCard(
    questionNumber: Int,
    totalQuestions: Int,
    questionText: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.QuestionAnswer,
                        contentDescription = null,
                        tint = colorResource(R.color.primary),
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        "Question $questionNumber",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        color = colorResource(R.color.text_primary)
                    )
                }
                Surface(
                    color = colorResource(R.color.primary).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        "$questionNumber/$totalQuestions",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold
                        ),
                        color = colorResource(R.color.primary)
                    )
                }
            }
            
            HorizontalDivider(color = colorResource(R.color.text_secondary).copy(alpha = 0.2f))
            
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        colorResource(R.color.primary).copy(alpha = 0.05f),
                        RoundedCornerShape(12.dp)
                    )
                    .padding(20.dp)
            ) {
                Text(
                    questionText,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        lineHeight = 24.sp
                    ),
                    color = colorResource(R.color.text_primary)
                )
            }
        }
    }
}

@Composable
private fun EnhancedAnswerInputCard(
    answer: String,
    onAnswerChange: (String) -> Unit,
    characterCount: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Your Answer",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = colorResource(R.color.text_primary)
                )
                Text(
                    "$characterCount characters",
                    style = MaterialTheme.typography.bodySmall,
                    color = colorResource(R.color.text_secondary)
                )
            }
            
            OutlinedTextField(
                value = answer,
                onValueChange = onAnswerChange,
                placeholder = { 
                    Text(
                        "Type your answer here. Be specific and use examples from your experience...",
                        color = colorResource(R.color.text_secondary).copy(alpha = 0.6f)
                    ) 
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(250.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = colorResource(R.color.primary),
                    unfocusedBorderColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f),
                    focusedContainerColor = colorResource(R.color.surface),
                    unfocusedContainerColor = colorResource(R.color.surface)
                ),
                shape = RoundedCornerShape(12.dp),
                textStyle = MaterialTheme.typography.bodyMedium.copy(
                    lineHeight = 22.sp
                ),
                maxLines = 15
            )
        }
    }
}

@Composable
private fun EnhancedFeedbackCard(feedback: com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = colorResource(R.color.primary),
                    modifier = Modifier.size(28.dp)
                )
                Text(
                    "AI Feedback",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = colorResource(R.color.text_primary)
                )
            }
            
            HorizontalDivider(color = colorResource(R.color.text_secondary).copy(alpha = 0.2f))
            
            // Strengths Section
            if (feedback.strengths.isNotEmpty()) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = colorResource(R.color.success).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = colorResource(R.color.success),
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                "Strengths",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold
                                ),
                                color = colorResource(R.color.success)
                            )
                        }
                        feedback.strengths.forEach { strength ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    "•",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colorResource(R.color.success)
                                )
                                Text(
                                    strength,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colorResource(R.color.text_primary),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
            
            // Areas for Improvement Section
            if (feedback.improvements.isNotEmpty()) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = colorResource(R.color.warning).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.Lightbulb,
                                contentDescription = null,
                                tint = colorResource(R.color.warning),
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                "Areas for Improvement",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold
                                ),
                                color = colorResource(R.color.warning)
                            )
                        }
                        feedback.improvements.forEach { improvement ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    "•",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colorResource(R.color.warning)
                                )
                                Text(
                                    improvement,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colorResource(R.color.text_primary),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun EnhancedActionButtonsRow(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    onSubmitAnswer: () -> Unit,
    canGoPrevious: Boolean,
    hasAnswer: Boolean,
    isSubmitting: Boolean = false
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Primary action: Submit Answer
        Button(
            onClick = onSubmitAnswer,
            enabled = hasAnswer && !isSubmitting,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = colorResource(R.color.primary),
                disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("Submitting...", style = MaterialTheme.typography.labelLarge)
            } else {
                Icon(Icons.Default.Send, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Submit Answer", style = MaterialTheme.typography.labelLarge)
            }
        }
        
        // Secondary actions
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onPrevious,
                enabled = canGoPrevious,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = colorResource(R.color.text_primary)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, 
                    colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Previous", style = MaterialTheme.typography.labelMedium)
            }
            
            OutlinedButton(
                onClick = onSaveSession,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = colorResource(R.color.text_primary)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, 
                    colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    Icons.Default.Bookmark,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save", style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun FeedbackNavigationButtons(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    onNext: () -> Unit,
    canGoPrevious: Boolean,
    canGoNext: Boolean
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Next Question Button (primary)
        Button(
            onClick = onNext,
            enabled = canGoNext,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = colorResource(R.color.primary),
                disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = RoundedCornerShape(12.dp),
            contentPadding = PaddingValues(vertical = 16.dp)
        ) {
            Text("Next Question", style = MaterialTheme.typography.labelLarge)
            Spacer(modifier = Modifier.width(8.dp))
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
            )
        }
        
        // Secondary buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onPrevious,
                enabled = canGoPrevious,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = colorResource(R.color.text_primary)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, 
                    colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Previous", style = MaterialTheme.typography.labelMedium)
            }
            
            OutlinedButton(
                onClick = onSaveSession,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = colorResource(R.color.text_primary)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, 
                    colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    Icons.Default.Bookmark,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save", style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun EnhancedTipsCard() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = colorResource(R.color.primary).copy(alpha = 0.05f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    Icons.Default.Lightbulb,
                    contentDescription = null,
                    tint = colorResource(R.color.primary),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    "Interview Tips",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = colorResource(R.color.text_primary)
                )
            }
            
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TipItem("Use the STAR method: Situation, Task, Action, Result")
                TipItem("Be specific with examples from your experience")
                TipItem("Keep answers concise but comprehensive (2-3 minutes)")
                TipItem("Practice speaking clearly and confidently")
            }
        }
    }
}

@Composable
private fun TipItem(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            "•",
            style = MaterialTheme.typography.bodySmall,
            color = colorResource(R.color.primary)
        )
        Text(
            text,
            style = MaterialTheme.typography.bodySmall,
            color = colorResource(R.color.text_secondary),
            modifier = Modifier.weight(1f)
        )
    }
}
