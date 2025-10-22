package com.cpen321.usermanagement.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.CreateJobApplicationRequest

/**
 * Add Job Dialog Component
 * Allows users to add job applications by pasting text or URL
 * Follows Lovable design system
 */
@Composable
fun AddJobDialog(
    onDismiss: () -> Unit,
    onAddJob: (CreateJobApplicationRequest) -> Unit,
    onScrapeJob: (String) -> Unit
) {
    var pasteMode by remember { mutableStateOf(PasteMode.TEXT) }
    var jobText by remember { mutableStateOf("") }
    var jobLink by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = colorResource(R.color.surface)
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp)
            ) {
                // Header
                Text(
                    text = "Add Job Application",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
                Text(
                    text = "Paste a job posting text or link to add it to your portfolio",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    ),
                    modifier = Modifier.padding(top = 4.dp)
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Mode Selection
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectableGroup()
                ) {
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .selectable(
                                selected = pasteMode == PasteMode.TEXT,
                                onClick = { pasteMode = PasteMode.TEXT }
                            )
                            .background(
                                if (pasteMode == PasteMode.TEXT) 
                                    colorResource(R.color.primary) 
                                else 
                                    Color.Transparent,
                                RoundedCornerShape(8.dp)
                            )
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Paste Text",
                            color = if (pasteMode == PasteMode.TEXT) 
                                colorResource(R.color.text_on_primary) 
                            else 
                                colorResource(R.color.text_secondary),
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = if (pasteMode == PasteMode.TEXT) FontWeight.Medium else FontWeight.Normal
                            )
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Row(
                        modifier = Modifier
                            .weight(1f)
                            .selectable(
                                selected = pasteMode == PasteMode.LINK,
                                onClick = { pasteMode = PasteMode.LINK }
                            )
                            .background(
                                if (pasteMode == PasteMode.LINK) 
                                    colorResource(R.color.primary) 
                                else 
                                    Color.Transparent,
                                RoundedCornerShape(8.dp)
                            )
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Paste Link",
                            color = if (pasteMode == PasteMode.LINK) 
                                colorResource(R.color.text_on_primary) 
                            else 
                                colorResource(R.color.text_secondary),
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = if (pasteMode == PasteMode.LINK) FontWeight.Medium else FontWeight.Normal
                            )
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Input Fields
                when (pasteMode) {
                    PasteMode.TEXT -> {
                        Text(
                            text = "Job Posting Text",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                                color = colorResource(R.color.text_primary)
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = jobText,
                            onValueChange = { jobText = it },
                            placeholder = {
                                Text(
                                    "Paste the job posting details here...",
                                    color = colorResource(R.color.text_tertiary)
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = colorResource(R.color.primary),
                                unfocusedBorderColor = colorResource(R.color.border),
                                focusedTextColor = colorResource(R.color.text_primary),
                                unfocusedTextColor = colorResource(R.color.text_primary)
                            ),
                            maxLines = 8
                        )
                    }
                    PasteMode.LINK -> {
                        Text(
                            text = "Job Posting URL",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Medium,
                                color = colorResource(R.color.text_primary)
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = jobLink,
                            onValueChange = { jobLink = it },
                            placeholder = {
                                Text(
                                    "https://...",
                                    color = colorResource(R.color.text_tertiary)
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = colorResource(R.color.primary),
                                unfocusedBorderColor = colorResource(R.color.border),
                                focusedTextColor = colorResource(R.color.text_primary),
                                unfocusedTextColor = colorResource(R.color.text_primary)
                            ),
                            leadingIcon = {
                                Icon(
                                    Icons.Default.Search,
                                    contentDescription = null,
                                    tint = colorResource(R.color.text_secondary)
                                )
                            }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Action Buttons
                Row(
                        modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = colorResource(R.color.text_secondary)
                        )
                    ) {
                        Text("Cancel")
                    }
                    
            Button(
                onClick = {
                            isLoading = true
                            if (pasteMode == PasteMode.TEXT && jobText.isNotBlank()) {
                                val request = parseJobText(jobText)
                                onAddJob(request)
                            } else if (pasteMode == PasteMode.LINK && jobLink.isNotBlank()) {
                                onScrapeJob(jobLink)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !isLoading && (
                            (pasteMode == PasteMode.TEXT && jobText.isNotBlank()) ||
                            (pasteMode == PasteMode.LINK && jobLink.isNotBlank())
                        ),
                colors = ButtonDefaults.buttonColors(
                            containerColor = colorResource(R.color.primary)
                        )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                                color = colorResource(R.color.text_on_primary),
                                strokeWidth = 2.dp
                    )
                } else {
                            Text("Add to Portfolio")
                        }
                    }
                }
            }
        }
    }
}

private enum class PasteMode {
    TEXT, LINK
}

private fun parseJobText(text: String): CreateJobApplicationRequest {
    val lines = text.split('\n').filter { it.trim().isNotBlank() }
    
    // Try to find title and company using common patterns
    var title = "New Position"
    var company = "Company Name"
    
    // Look for common patterns
    for (i in 0 until minOf(lines.size, 10)) {
        val line = lines[i].trim()
        
        // Look for job title patterns
        if (line.length > 5 && line.length < 100 && 
            (line.contains("Engineer") || line.contains("Developer") || 
             line.contains("Manager") || line.contains("Analyst") ||
             line.contains("Designer") || line.contains("Specialist") ||
             line.contains("Coordinator") || line.contains("Director"))) {
            title = line
            continue
        }
        
        // Look for company patterns
        if (line.length > 2 && line.length < 50 && 
            !line.contains("@") && !line.contains("http") &&
            !line.contains("Salary") && !line.contains("Location") &&
            !line.contains("Requirements") && !line.contains("Responsibilities")) {
            company = line
            break
        }
    }
    
    // If we didn't find a good title, use the first line
    if (title == "New Position" && lines.isNotEmpty()) {
        title = lines[0]
    }
    
    return CreateJobApplicationRequest(
        title = title,
        company = company,
        description = text
    )
}