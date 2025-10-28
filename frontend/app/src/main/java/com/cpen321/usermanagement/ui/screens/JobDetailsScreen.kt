package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.viewmodels.JobViewModel

/**
 * Job Details Screen
 * Displays detailed information about a specific job application
 * Follows Lovable design system
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobDetailsScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    onNavigateToQuestions: (String) -> Unit,
    onNavigateToSimilarJobs: (String) -> Unit,
    viewModel: JobViewModel = hiltViewModel()
) {
    val selectedJob by viewModel.selectedJob.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    
    // Load job details when screen is displayed
    LaunchedEffect(jobId) {
        viewModel.getJobApplication(jobId)
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
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
                    text = "Job Details",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
            }
            
            Row {
                IconButton(
                    onClick = { onNavigateToSimilarJobs(jobId) }
                ) {
                    Icon(
                        Icons.Default.Search,
                        contentDescription = "Find Similar Jobs",
                        tint = colorResource(R.color.primary),
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Loading State
        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = colorResource(R.color.primary)
                )
            }
        }
        // Error State
        else if (error != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = colorResource(R.color.error).copy(alpha = 0.1f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Error,
                        contentDescription = null,
                        tint = colorResource(R.color.error),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Failed to load job details",
                        style = MaterialTheme.typography.titleMedium.copy(
                            color = colorResource(R.color.error)
                        )
                    )
                    Text(
                        text = error ?: "Unknown error",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.getJobApplication(jobId) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colorResource(R.color.primary)
                        )
                    ) {
                        Text("Retry")
                    }
                }
            }
        }
        // Job Details Content
        else if (selectedJob != null) {
            val job = selectedJob!!
            
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Job Header Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = colorResource(R.color.surface)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Text(
                            text = job.title,
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = colorResource(R.color.text_primary)
                            )
                        )
                        Text(
                            text = job.company,
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = colorResource(R.color.text_secondary)
                            )
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Job Metadata
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            job.location?.let { location ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.LocationOn,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp),
                                        tint = colorResource(R.color.text_tertiary)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = location,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = colorResource(R.color.text_tertiary)
                                        )
                                    )
                                }
                            }
                            
                            job.salary?.let { salary ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.AttachMoney,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp),
                                        tint = colorResource(R.color.text_tertiary)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = salary,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = colorResource(R.color.text_tertiary)
                                        )
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Badges
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            job.jobType?.let { jobType ->
                                Badge(
                                    containerColor = colorResource(R.color.secondary).copy(alpha = 0.2f),
                                    contentColor = colorResource(R.color.secondary_foreground)
                                ) {
                                    Text(
                                        text = jobType.value.replace("-", " ").uppercase(),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                            
                            job.experienceLevel?.let { level ->
                                Badge(
                                    containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                                    contentColor = colorResource(R.color.primary_foreground)
                                ) {
                                    Text(
                                        text = level.value.uppercase(),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                        }
                    }
                }
                
                // Job Description Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = colorResource(R.color.surface)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Text(
                            text = "Job Description",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Medium,
                                color = colorResource(R.color.text_primary)
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = job.description,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = colorResource(R.color.text_secondary)
                            )
                        )
                    }
                }
                
                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { onNavigateToQuestions(jobId) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colorResource(R.color.primary)
                        )
                    ) {
                        Text("Generate Questions")
                    }
                    
                    OutlinedButton(
                        onClick = { onNavigateToSimilarJobs(jobId) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Find Similar Jobs")
                    }
                }
            }
        }
        // Empty State
        else {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = colorResource(R.color.surface)
                )
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.WorkOutline,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = colorResource(R.color.text_tertiary)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Job not found",
                        style = MaterialTheme.typography.headlineSmall.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                    Text(
                        text = "The job application could not be loaded",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_tertiary)
                        )
                    )
                }
            }
        }
    }
}