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

@Composable
fun SubmitAnswerButton(
    onSubmitAnswer: () -> Unit,
    hasAnswer: Boolean,
    isSubmitting: Boolean
) {
    Button(
        onClick = onSubmitAnswer,
        enabled = hasAnswer && !isSubmitting,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary),
            disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
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
}

@Composable
fun ActionSecondaryButtons(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoPrevious: Boolean
) {
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
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
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
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
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

@Composable
fun EnhancedActionButtonsRow(
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
        SubmitAnswerButton(
            onSubmitAnswer = onSubmitAnswer,
            hasAnswer = hasAnswer,
            isSubmitting = isSubmitting
        )
        ActionSecondaryButtons(
            onPrevious = onPrevious,
            onSaveSession = onSaveSession,
            canGoPrevious = canGoPrevious
        )
    }
}

@Composable
fun NextQuestionButton(
    onNext: () -> Unit,
    canGoNext: Boolean
) {
    Button(
        onClick = onNext,
        enabled = canGoNext,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary),
            disabledContainerColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
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
}

@Composable
fun FeedbackSecondaryButtons(
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoPrevious: Boolean
) {
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
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
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
            border = BorderStroke(
                1.dp, 
                colorResource(R.color.text_secondary).copy(alpha = 0.3f)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
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

@Composable
fun FeedbackNavigationButtons(
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSaveSession: () -> Unit,
    canGoNext: Boolean,
    canGoPrevious: Boolean
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        NextQuestionButton(
            onNext = onNext,
            canGoNext = canGoNext
        )
        FeedbackSecondaryButtons(
            onPrevious = onPrevious,
            onSaveSession = onSaveSession,
            canGoPrevious = canGoPrevious
        )
    }
}

