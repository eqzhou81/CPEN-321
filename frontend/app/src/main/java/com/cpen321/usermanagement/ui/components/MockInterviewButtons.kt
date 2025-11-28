package com.cpen321.usermanagement.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.unit.dp
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.theme.LocalSpacing

@Composable
fun SubmitAnswerButton(
    onSubmitAnswer: () -> Unit,
    hasAnswer: Boolean,
    isSubmitting: Boolean
) {
    val spacing = LocalSpacing.current
    
    Button(
        onClick = onSubmitAnswer,
        enabled = hasAnswer && !isSubmitting,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary),
            disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        contentPadding = PaddingValues(vertical = spacing.medium)
    ) {
        if (isSubmitting) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(spacing.medium))
            Text("Submitting...", style = MaterialTheme.typography.labelLarge)
        } else {
            Icon(Icons.Default.Send, contentDescription = null)
            Spacer(modifier = Modifier.width(spacing.small))
            Text("Submit Answer", style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun ActionSecondaryButtons(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoPrevious: Boolean,
    isSaving: Boolean = false
) {
    val spacing = LocalSpacing.current
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        PreviousButton(
            onPrevious = onPrevious,
            canGoPrevious = canGoPrevious,
            modifier = Modifier.weight(1f),
            spacing = spacing
        )
        SaveButton(
            onSaveSession = onSaveSession,
            modifier = Modifier.weight(1f),
            spacing = spacing,
            isSaving = isSaving
        )
    }
}

@Composable
private fun PreviousButton(
    onPrevious: () -> Unit,
    canGoPrevious: Boolean,
    modifier: Modifier = Modifier,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing
    ) {
        OutlinedButton(
            onClick = onPrevious,
            enabled = canGoPrevious,
        modifier = modifier,
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = colorResource(R.color.text_primary)
            ),
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
            contentDescription = "Previous",
                modifier = Modifier.size(18.dp)
            )
        Spacer(modifier = Modifier.width(spacing.extraSmall))
            Text("Previous", style = MaterialTheme.typography.labelMedium)
        }
}

@Composable
private fun SaveButton(
    onSaveSession: () -> Unit,
    modifier: Modifier = Modifier,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing,
    isSaving: Boolean = false
) {
        OutlinedButton(
            onClick = onSaveSession,
            modifier = modifier,
            enabled = !isSaving,
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = colorResource(R.color.text_primary)
            ),
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
        ) {
            if (isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = colorResource(R.color.text_primary),
                    strokeWidth = 2.dp
                )
            } else {
                Icon(
                    Icons.Default.Bookmark,
                    contentDescription = "Save Session",
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(spacing.extraSmall))
            Text("Save", style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
fun EnhancedActionButtonsRow(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    onSubmitAnswer: () -> Unit,
    canGoPrevious: Boolean,
    hasAnswer: Boolean,
    isSubmitting: Boolean = false,
    isSaving: Boolean = false
) {
    val spacing = LocalSpacing.current
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        SubmitAnswerButton(
            onSubmitAnswer = onSubmitAnswer,
            hasAnswer = hasAnswer,
            isSubmitting = isSubmitting
        )
        ActionSecondaryButtons(
            onPrevious = onPrevious,
            onSaveSession = onSaveSession,
            canGoPrevious = canGoPrevious,
            isSaving = isSaving
        )
    }
}

@Composable
fun NextQuestionButton(
    onNext: () -> Unit,
    canGoNext: Boolean
) {
    val spacing = LocalSpacing.current
    
    Button(
        onClick = onNext,
        enabled = canGoNext,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary),
            disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        contentPadding = PaddingValues(vertical = spacing.medium)
    ) {
        Text("Next Question", style = MaterialTheme.typography.labelLarge)
        Spacer(modifier = Modifier.width(spacing.small))
        Icon(
            Icons.AutoMirrored.Filled.ArrowForward,
            contentDescription = "Next Question",
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun FeedbackSecondaryButtons(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoPrevious: Boolean,
    isSaving: Boolean = false
) {
    val spacing = LocalSpacing.current
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        PreviousButton(
            onPrevious = onPrevious,
            canGoPrevious = canGoPrevious,
            modifier = Modifier.weight(1f),
            spacing = spacing
        )
        SaveButton(
            onSaveSession = onSaveSession,
            modifier = Modifier.weight(1f),
            spacing = spacing,
            isSaving = isSaving
        )
    }
}

@Composable
fun FeedbackNavigationButtons(
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoNext: Boolean,
    canGoPrevious: Boolean,
    isSaving: Boolean = false
) {
    val spacing = LocalSpacing.current
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        NextQuestionButton(
            onNext = onNext,
            canGoNext = canGoNext
        )
        FeedbackSecondaryButtons(
            onPrevious = onPrevious,
            onSaveSession = onSaveSession,
            canGoPrevious = canGoPrevious,
            isSaving = isSaving
        )
    }
}

