package com.cpen321.usermanagement.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun EnhancedQuestionCard(
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
            EnhancedQuestionCardHeader(questionNumber, totalQuestions)
            HorizontalDivider(color = colorResource(R.color.text_secondary).copy(alpha = 0.2f))
            EnhancedQuestionCardContent(questionText)
        }
    }
}

@Composable
private fun EnhancedQuestionCardHeader(
    questionNumber: Int,
    totalQuestions: Int
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
}

@Composable
private fun EnhancedQuestionCardContent(questionText: String) {
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

@Composable
fun EnhancedAnswerInputCard(
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
fun EnhancedFeedbackCard(feedback: com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionFeedback) {
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
            FeedbackCardHeader()
            HorizontalDivider(color = colorResource(R.color.text_secondary).copy(alpha = 0.2f))
            StrengthsSection(strengths = feedback.strengths)
            ImprovementsSection(improvements = feedback.improvements)
        }
    }
}

@Composable
private fun FeedbackCardHeader() {
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
}

@Composable
private fun StrengthsSection(strengths: List<String>) {
    if (strengths.isNotEmpty()) {
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
                strengths.forEach { strength ->
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
}

@Composable
private fun ImprovementsSection(improvements: List<String>) {
    if (improvements.isNotEmpty()) {
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
                improvements.forEach { improvement ->
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

@Composable
fun EnhancedProgressCard(
    completedQuestions: Int,
    totalQuestions: Int,
    currentIndex: Int
) {
    val spacing = LocalSpacing.current
    val progress = calculateProgress(completedQuestions, totalQuestions)
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(spacing.large),
            verticalArrangement = Arrangement.spacedBy(spacing.medium)
        ) {
            ProgressCardHeader()
            ProgressBar(progress = progress, spacing = spacing)
            ProgressCardFooter(
                completedQuestions = completedQuestions,
                totalQuestions = totalQuestions,
                currentIndex = currentIndex
            )
        }
    }
}

@Composable
private fun ProgressCardHeader() {
            Text(
                "Progress",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold
                ),
                color = colorResource(R.color.text_primary)
            )
}
            
@Composable
private fun ProgressBar(
    progress: Float,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing
) {
    LinearProgressIndicator(
        progress = { progress },
        modifier = Modifier
            .fillMaxWidth()
            .height(6.dp)
            .clip(RoundedCornerShape(6.dp)),
        color = colorResource(R.color.primary),
        trackColor = colorResource(R.color.primary).copy(alpha = 0.2f)
    )
}

@Composable
private fun ProgressCardFooter(
    completedQuestions: Int,
    totalQuestions: Int,
    currentIndex: Int
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            "$completedQuestions of $totalQuestions questions answered",
            style = MaterialTheme.typography.bodySmall,
            color = colorResource(R.color.text_secondary)
        )
            Text(
            "Question ${currentIndex + 1}",
                style = MaterialTheme.typography.bodySmall,
                color = colorResource(R.color.text_secondary)
            )
        }
}

private fun calculateProgress(completedQuestions: Int, totalQuestions: Int): Float {
    return if (totalQuestions > 0) {
        completedQuestions.toFloat() / totalQuestions
    } else {
        0f
    }
}

@Composable
fun SessionCompleteCard() {
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
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}

@Composable
fun EnhancedTipsCard() {
    val spacing = LocalSpacing.current
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = colorResource(R.color.primary).copy(alpha = 0.05f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(spacing.medium),
            verticalArrangement = Arrangement.spacedBy(spacing.medium)
        ) {
            TipsCardHeader(spacing = spacing)
            TipsList(spacing = spacing)
        }
    }
}

@Composable
private fun TipsCardHeader(spacing: com.cpen321.usermanagement.ui.theme.Spacing) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(spacing.small)
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
            }
            
@Composable
private fun TipsList(spacing: com.cpen321.usermanagement.ui.theme.Spacing) {
            Column(
        verticalArrangement = Arrangement.spacedBy(spacing.small)
            ) {
                TipItem("Use the STAR method: Situation, Task, Action, Result")
                TipItem("Be specific with examples from your experience")
                TipItem("Keep answers concise but comprehensive (2-3 minutes)")
                TipItem("Practice speaking clearly and confidently")
    }
}

@Composable
private fun TipItem(text: String) {
    val spacing = LocalSpacing.current
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(spacing.small),
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

