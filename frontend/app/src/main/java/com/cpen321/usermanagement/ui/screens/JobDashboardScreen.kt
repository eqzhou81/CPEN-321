package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.*
import com.cpen321.usermanagement.ui.components.AddJobDialog
import com.cpen321.usermanagement.ui.viewmodels.JobViewModel
import java.text.SimpleDateFormat
import java.util.*

/**
 * Job Dashboard Screen
 * Main screen for managing job applications with Lovable design system
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobDashboardScreen(
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToQuestions: (String) -> Unit,
    viewModel: JobViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val jobApplications by viewModel.jobApplications.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    val jobStatistics by viewModel.jobStatistics.collectAsStateWithLifecycle()
    var showAddJobDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        viewModel.clearError()
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .padding(16.dp)
    ) {
        JobDashboardHeader(onAddJobClick = { showAddJobDialog = true })
        Spacer(modifier = Modifier.height(24.dp))
        JobDashboardContent(
            state = JobDashboardContentState(
                jobStatistics = jobStatistics,
                error = error,
                isLoading = isLoading,
                jobApplications = jobApplications,
                context = context,
                viewModel = viewModel
            ),
            callbacks = JobDashboardContentCallbacks(
                onNavigateToJobDetails = onNavigateToJobDetails,
                onNavigateToQuestions = onNavigateToQuestions,
                onAddJobClick = { showAddJobDialog = true }
            )
        )
    }
    
    if (showAddJobDialog) {
        AddJobDialog(
            onDismiss = { showAddJobDialog = false },
            onAddJob = { request ->
                viewModel.createJobApplication(request)
                showAddJobDialog = false
            },
            onScrapeJob = { url ->
                viewModel.createJobFromScrapedData(url)
                showAddJobDialog = false
            }
        )
    }
}

@Composable
private fun JobDashboardHeader(onAddJobClick: () -> Unit) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "My Job Applications",
                modifier = Modifier.testTag("job_applications_title"),
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
                Text(
                    text = "Track your applications and practice interview questions",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    )
                )
            }
            FloatingActionButton(
            onClick = onAddJobClick,
            modifier = Modifier.testTag("add_job_button"),
                containerColor = colorResource(R.color.primary),
                contentColor = colorResource(R.color.text_on_primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Job Application")
        }
    }
}

private data class JobDashboardContentState(
    val jobStatistics: JobStatistics?,
    val error: String?,
    val isLoading: Boolean,
    val jobApplications: List<JobApplication>,
    val context: android.content.Context,
    val viewModel: JobViewModel
)

private data class JobDashboardContentCallbacks(
    val onNavigateToJobDetails: (String) -> Unit,
    val onNavigateToQuestions: (String) -> Unit,
    val onAddJobClick: () -> Unit
)

@Composable
private fun JobDashboardContent(
    state: JobDashboardContentState,
    callbacks: JobDashboardContentCallbacks
) {
        state.jobStatistics?.let { stats ->
            StatisticsSection(stats = stats)
            Spacer(modifier = Modifier.height(24.dp))
        }
        
        state.error?.let { errorMessage ->
        ErrorMessageCard(errorMessage = errorMessage, onDismiss = { state.viewModel.clearError() })
        Spacer(modifier = Modifier.height(16.dp))
    }
    
    when {
        state.isLoading && state.jobApplications.isEmpty() -> LoadingState()
        state.jobApplications.isEmpty() -> EmptyState(onAddJob = callbacks.onAddJobClick)
        else -> JobApplicationsList(
            jobApplications = state.jobApplications,
            context = state.context,
            onNavigateToJobDetails = callbacks.onNavigateToJobDetails,
            onNavigateToQuestions = callbacks.onNavigateToQuestions,
            onDeleteJob = { state.viewModel.deleteJobApplication(it) }
        )
    }
}

@Composable
private fun ErrorMessageCard(errorMessage: String, onDismiss: () -> Unit) {
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
                        Icons.Default.Error,
                        contentDescription = null,
                        tint = colorResource(R.color.error)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = errorMessage,
                        color = colorResource(R.color.error),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.weight(1f))
            TextButton(onClick = onDismiss) {
                        Text("Dismiss")
                    }
                }
            }
        }
        
@Composable
private fun LoadingState() {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
        CircularProgressIndicator(color = colorResource(R.color.primary))
    }
}

@Composable
private fun JobApplicationsList(
    jobApplications: List<JobApplication>,
    context: android.content.Context,
    onNavigateToJobDetails: (String) -> Unit,
    onNavigateToQuestions: (String) -> Unit,
    onDeleteJob: (String) -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(jobApplications) { job ->
                    JobApplicationCard(
                        job = job,
                        onJobClick = { onNavigateToJobDetails(job.id) },
                        onGenerateQuestions = { onNavigateToQuestions(job.id) },
                onDeleteJob = { onDeleteJob(job.id) },
                        onViewDetails = { onNavigateToJobDetails(job.id) },
                        onOpenJobLink = { url -> 
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                            context.startActivity(intent)
                        }
                    )
        }
    }
}

@Composable
private fun StatisticsSection(stats: JobStatisticsData) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Total Applications
        StatCard(
            title = "Total Applications",
            value = stats.totalApplications.toString(),
            icon = Icons.Default.Work,
            modifier = Modifier.weight(1f)
        )
        
        // Total Companies
        StatCard(
            title = "Companies",
            value = stats.totalCompanies.toString(),
            icon = Icons.Default.Business,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = colorResource(R.color.primary),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = colorResource(R.color.text_secondary)
                )
            )
        }
    }
}

@Composable
private fun EmptyState(
    onAddJob: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.WorkOutline,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = colorResource(R.color.text_tertiary)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No job applications yet",
            style = MaterialTheme.typography.headlineSmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        Text(
            text = "Add your first job application to get started",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_tertiary)
            )
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onAddJob,
            colors = ButtonDefaults.buttonColors(
                containerColor = colorResource(R.color.primary)
            )
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Add Job Application")
        }
    }
}

@Composable
private fun JobApplicationCard(
    job: JobApplication,
    onJobClick: () -> Unit,
    onGenerateQuestions: () -> Unit,
    onDeleteJob: () -> Unit,
    onViewDetails: () -> Unit,
    onOpenJobLink: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onJobClick() },
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = job.title,
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = job.company,
                        style = MaterialTheme.typography.bodyLarge.copy(
                            color = colorResource(R.color.text_secondary)
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                Row {
                    IconButton(onClick = onViewDetails) {
                        Icon(
                            Icons.Default.Visibility,
                            contentDescription = "View Details",
                            tint = colorResource(R.color.text_secondary)
                        )
                    }
                    if (job.url != null) {
                        IconButton(
                            onClick = { onOpenJobLink(job.url) }
                        ) {
                            Icon(
                                Icons.Default.OpenInNew,
                                contentDescription = "Open Job Link",
                                tint = colorResource(R.color.text_secondary)
                            )
                        }
                    }
                    IconButton(onClick = onDeleteJob) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Delete Job",
                            tint = colorResource(R.color.error)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Description
            Text(
                text = job.description,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = colorResource(R.color.text_secondary)
                ),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Metadata
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Date
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.DateRange,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = colorResource(R.color.text_tertiary)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = formatDate(job.createdAt),
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = colorResource(R.color.text_tertiary)
                        )
                    )
                }
                
                // Location
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
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = colorResource(R.color.text_tertiary)
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                
                // Salary
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
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = colorResource(R.color.text_tertiary)
                            ),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
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
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onGenerateQuestions,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("generate_questions_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorResource(R.color.primary)
                    )
                ) {
                    Text("Generate Questions")
                }
                
                OutlinedButton(
                    onClick = onViewDetails,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("View Details")
                }
            }
        }
    }
}

private fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: java.text.ParseException) {
        "Unknown date"
    } catch (e: IllegalArgumentException) {
        "Unknown date"
    } catch (e: Throwable) {
        "Unknown date"
    }
}