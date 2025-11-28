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
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.SimilarJob
import com.cpen321.usermanagement.ui.viewmodels.JobViewModel

/**
 * Similar Jobs Screen
 * Displays similar job opportunities based on selected job application
 * Follows Lovable design system
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimilarJobsScreen(
    jobId: String,
    onNavigateBack: () -> Unit,
    onOpenJobLink: (String) -> Unit,
    viewModel: JobViewModel = hiltViewModel()
) {
    val similarJobs by viewModel.similarJobs.collectAsStateWithLifecycle()
    val isLoadingSimilarJobs by viewModel.isLoadingSimilarJobs.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    val selectedJob by viewModel.selectedJob.collectAsStateWithLifecycle()
    
    var radius by remember { mutableStateOf(25) }
    var includeRemote by remember { mutableStateOf(true) }
    
    // Load similar jobs when screen is displayed
    LaunchedEffect(jobId) {
        viewModel.searchSimilarJobs(
            jobId = jobId,
            radius = radius,
            includeRemote = includeRemote
        )
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
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
                Column {
                    Text(
                        text = "Similar Jobs",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                    selectedJob?.let { job ->
                        Text(
                            text = "Based on: ${job.title} at ${job.company}",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = colorResource(R.color.text_secondary)
                            )
                        )
                    }
                }
            }
            
            IconButton(
                onClick = {
                    viewModel.searchSimilarJobs(
                        jobId = jobId,
                        radius = radius,
                        includeRemote = includeRemote
                    )
                }
            ) {
                Icon(
                    Icons.Default.Refresh,
                    contentDescription = "Refresh",
                    tint = colorResource(R.color.text_secondary)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Search Filters
        SearchFiltersSection(
            radius = radius,
            onRadiusChange = { radius = it },
            includeRemote = includeRemote,
            onIncludeRemoteChange = { includeRemote = it },
            onApplyFilters = {
                viewModel.searchSimilarJobs(
                    jobId = jobId,
                    radius = radius,
                    includeRemote = includeRemote
                )
            }
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Error Message
        error?.let { errorMessage ->
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
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("Dismiss")
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }
        
        // Loading State
        if (isLoadingSimilarJobs) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(
                        color = colorResource(R.color.primary)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Searching for similar jobs...",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            }
        }
        // Empty State
        else if (similarJobs.isEmpty()) {
            EmptySimilarJobsState()
        }
        // Similar Jobs List
        else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(similarJobs) { job ->
                    SimilarJobCard(
                        job = job,
                        onOpenLink = { onOpenJobLink(job.url) }
                    )
                }
            }
        }
    }
}

@Composable
private fun RadiusFilterSection(
    radius: Int,
    onRadiusChange: (Int) -> Unit
) {
    Text(
        text = "Search Radius: ${radius}km",
        style = MaterialTheme.typography.bodyMedium.copy(
            color = colorResource(R.color.text_secondary)
        )
    )
    Slider(
        value = radius.toFloat(),
        onValueChange = { onRadiusChange(it.toInt()) },
        valueRange = 5f..100f,
        steps = 18,
        colors = SliderDefaults.colors(
            thumbColor = colorResource(R.color.primary),
            activeTrackColor = colorResource(R.color.primary),
            inactiveTrackColor = colorResource(R.color.border)
        )
    )
}

@Composable
private fun RemoteJobsFilterSection(
    includeRemote: Boolean,
    onIncludeRemoteChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Include Remote Jobs",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        Switch(
            checked = includeRemote,
            onCheckedChange = onIncludeRemoteChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = colorResource(R.color.primary),
                checkedTrackColor = colorResource(R.color.primary).copy(alpha = 0.5f),
                uncheckedThumbColor = colorResource(R.color.text_tertiary),
                uncheckedTrackColor = colorResource(R.color.border)
            )
        )
    }
}

@Composable
private fun SearchFiltersSection(
    radius: Int,
    onRadiusChange: (Int) -> Unit,
    includeRemote: Boolean,
    onIncludeRemoteChange: (Boolean) -> Unit,
    onApplyFilters: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Search Filters",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Medium,
                    color = colorResource(R.color.text_primary)
                )
            )
            Spacer(modifier = Modifier.height(12.dp))
            RadiusFilterSection(radius = radius, onRadiusChange = onRadiusChange)
            Spacer(modifier = Modifier.height(8.dp))
            RemoteJobsFilterSection(
                includeRemote = includeRemote,
                onIncludeRemoteChange = onIncludeRemoteChange
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onApplyFilters,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorResource(R.color.primary)
                )
            ) {
                Text("Apply Filters")
            }
        }
    }
}

@Composable
private fun EmptySimilarJobsState() {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.SearchOff,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = colorResource(R.color.text_tertiary)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No similar jobs found",
            style = MaterialTheme.typography.headlineSmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        Text(
            text = "Try adjusting your search filters",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_tertiary)
            )
        )
    }
}

@Composable
private fun SimilarJobCard(
    job: SimilarJob,
    onOpenLink: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
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
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = job.company,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                Row {
                    IconButton(onClick = onOpenLink) {
                        Icon(
                            Icons.Default.OpenInNew,
                            contentDescription = "Open Job Link",
                            tint = colorResource(R.color.primary)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Description
            Text(
                text = job.description,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = colorResource(R.color.text_secondary)
                ),
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Metadata
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Location
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = colorResource(R.color.text_tertiary)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = job.location,
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = colorResource(R.color.text_tertiary)
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                // Distance
                job.distance?.let { distance ->
                    Text(
                        text = "${distance.toInt()}km away",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = colorResource(R.color.text_tertiary)
                        )
                    )
                }
                
                // Salary
                job.salary?.let { salary ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.AttachMoney,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
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
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Badges
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Job Type
                job.jobType?.let { jobType ->
                    Badge(
                        containerColor = getJobTypeColor(jobType).copy(alpha = 0.2f),
                        contentColor = getJobTypeColor(jobType)
                    ) {
                        Text(
                            text = jobType.replace("-", " ").uppercase(),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
                
                // Experience Level
                job.experienceLevel?.let { level ->
                    Badge(
                        containerColor = colorResource(R.color.primary).copy(alpha = 0.2f),
                        contentColor = colorResource(R.color.primary)
                    ) {
                        Text(
                            text = level.uppercase(),
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
                
                // Remote Badge
                if (job.isRemote == true) {
                    Badge(
                        containerColor = colorResource(R.color.job_type_remote).copy(alpha = 0.2f),
                        contentColor = colorResource(R.color.job_type_remote)
                    ) {
                        Text(
                            text = "REMOTE",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
                
                // Source Badge
                Badge(
                    containerColor = colorResource(R.color.secondary).copy(alpha = 0.2f),
                    contentColor = colorResource(R.color.secondary_foreground)
                ) {
                    Text(
                        text = job.source.uppercase(),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@Composable
private fun getJobTypeColor(jobType: String): Color {
    return when (jobType.lowercase()) {
        "full-time" -> colorResource(R.color.job_type_full_time)
        "part-time" -> colorResource(R.color.job_type_part_time)
        "contract" -> colorResource(R.color.job_type_contract)
        "internship" -> colorResource(R.color.job_type_internship)
        "remote" -> colorResource(R.color.job_type_remote)
        else -> colorResource(R.color.text_secondary)
    }
}
