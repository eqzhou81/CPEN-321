package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
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
        TopAppBar(
            title = { 
                Text(
                        "Mock Interview Session",
                    fontWeight = FontWeight.Bold
                ) 
            },
            navigationIcon = {
                IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Color(0xFF1A1A1A)
                )
            )
        },
        containerColor = colorResource(R.color.background)
    ) { paddingValues ->
        when (val state = uiState) {
            is MockInterviewViewModel.UiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            is MockInterviewViewModel.UiState.Error -> {
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
                        Text(
                            "Error: ${state.message}",
                            color = Color.Red,
                            textAlign = TextAlign.Center
                        )
                        Button(onClick = { viewModel.loadSession(sessionId) }) {
                            Text("Retry")
                        }
                    }
                }
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
}

@Composable
private fun MockInterviewContent(
    state: MockInterviewViewModel.UiState.Success,
    viewModel: MockInterviewViewModel,
    paddingValues: PaddingValues,
    onBackClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            "Answer the question below to practice your interview skills",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        
        ProgressCard(
            completedQuestions = state.session.answeredQuestions,
            totalQuestions = state.session.totalQuestions
        )
        
        state.currentQuestion?.let { question ->
            QuestionCard(
                questionNumber = state.session.currentQuestionIndex + 1,
                totalQuestions = state.session.totalQuestions,
                questionText = question.title
            )
        }
        
        state.feedback?.let { feedback ->
            FeedbackCard(feedback = feedback)
        }
        
        if (state.feedback == null) {
            AnswerInputCard(
                answer = state.answer,
                onAnswerChange = viewModel::updateAnswer
            )
            
            ActionButtonsRow(
                onPrevious = viewModel::previousQuestion,
                onSaveSession = viewModel::saveSession,
                onSubmitAnswer = viewModel::submitAnswer,
                canGoPrevious = state.session.currentQuestionIndex > 0,
                hasAnswer = state.answer.isNotBlank(),
                isSubmitting = state.isSubmitting
            )
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Previous Button
                OutlinedButton(
                    onClick = viewModel::previousQuestion,
                    enabled = state.session.currentQuestionIndex > 0,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color(0xFF666666)
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCCCCCC)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Previous", fontSize = 14.sp)
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                // Save Session Button
                OutlinedButton(
                    onClick = viewModel::saveSession,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color(0xFF666666)
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCCCCCC)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Session", fontSize = 14.sp)
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                // Next Question Button
                Button(
                    onClick = viewModel::nextQuestion,
                    enabled = state.feedback != null && !state.feedback.isLastQuestion,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF1E3A8A),
                        disabledContainerColor = Color(0xFFCCCCCC)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Next Question", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
        
        STARMethodTip()
        
        OutlinedButton(
            onClick = onBackClick,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = Color(0xFF666666)
            )
        ) {
            Text("End Session")
        }
    }
}

@Composable
private fun ProgressCard(
    completedQuestions: Int,
    totalQuestions: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                "Session Progress: $completedQuestions/$totalQuestions questions complete",
                fontSize = 14.sp,
                color = Color(0xFF666666)
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            LinearProgressIndicator(
                progress = { if (totalQuestions > 0) completedQuestions.toFloat() / totalQuestions else 0f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp)),
                color = Color(0xFFFFC107),
                trackColor = Color(0xFFFFE082)
            )
        }
    }
}

@Composable
private fun QuestionCard(
    questionNumber: Int,
    totalQuestions: Int,
    questionText: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                "Question $questionNumber of $totalQuestions",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1A1A1A)
            )
            
            Spacer(modifier = Modifier.height(20.dp))
            
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Color(0xFFE3F2FD),
                        RoundedCornerShape(8.dp)
                    )
                    .padding(20.dp)
            ) {
                Text(
                    "\"$questionText\"",
                    fontSize = 16.sp,
                    fontStyle = FontStyle.Italic,
                    color = Color(0xFF1565C0),
                    lineHeight = 24.sp
                )
            }
        }
    }
}

@Composable
private fun AnswerInputCard(
    answer: String,
    onAnswerChange: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                "Your Answer",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1A1A1A)
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = answer,
                onValueChange = onAnswerChange,
                placeholder = { 
                    Text(
                        "Type your answer here...",
                        color = Color(0xFF999999)
                    ) 
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF1976D2),
                    unfocusedBorderColor = Color(0xFFCCCCCC),
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp),
                textStyle = androidx.compose.ui.text.TextStyle(
                    fontSize = 15.sp,
                    color = Color(0xFF1A1A1A)
                )
            )
        }
    }
}

@Composable
private fun FeedbackCard(feedback: com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // AI Feedback Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = colorResource(R.color.success),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "AI Feedback",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
            }
            
            // Strengths Section
            if (feedback.strengths.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = colorResource(R.color.success).copy(alpha = 0.1f)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = colorResource(R.color.success),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Strengths",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = colorResource(R.color.success)
                                )
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        feedback.strengths.forEach { strength ->
                            Text(
                                "• $strength",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = colorResource(R.color.success)
                                ),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
            
            // Areas for Improvement Section
            if (feedback.improvements.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = colorResource(R.color.warning).copy(alpha = 0.1f)
                    ),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = colorResource(R.color.warning),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Areas for Improvement",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = colorResource(R.color.warning)
                                )
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        feedback.improvements.forEach { improvement ->
                            Text(
                                "• $improvement",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = colorResource(R.color.warning)
                                ),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionButtonsRow(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    onSubmitAnswer: () -> Unit,
    canGoPrevious: Boolean,
    hasAnswer: Boolean,
    isSubmitting: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Previous Button
        OutlinedButton(
            onClick = onPrevious,
            enabled = canGoPrevious,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.Transparent,
                contentColor = Color(0xFF666666)
            ),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCCCCCC)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Previous", fontSize = 14.sp)
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        // Save Session Button
        OutlinedButton(
            onClick = onSaveSession,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.Transparent,
                contentColor = Color(0xFF666666)
            ),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFCCCCCC)),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(
                Icons.Default.Star,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save Session", fontSize = 14.sp)
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        // Submit Answer Button
        Button(
            onClick = onSubmitAnswer,
            enabled = hasAnswer && !isSubmitting,
            modifier = Modifier.weight(1f),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF5C6BC0),
                disabledContainerColor = Color(0xFFCCCCCC)
            ),
            shape = RoundedCornerShape(8.dp)
        ) {
            if (isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            } else {
                Text("Submit Answer", fontSize = 14.sp)
            }
        }
    }
}

@Composable
private fun STARMethodTip() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFFFF9E6), RoundedCornerShape(8.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            "💡",
            fontSize = 20.sp,
            modifier = Modifier.padding(end = 12.dp)
        )
        Text(
            "Tips: Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
            fontSize = 13.sp,
            color = Color(0xFF856404),
            lineHeight = 18.sp
        )
    }
}
