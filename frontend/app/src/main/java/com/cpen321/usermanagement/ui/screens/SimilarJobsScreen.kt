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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SimilarJobsHeader(
    selectedJob: JobApplication?,
    onNavigateBack: () -> Unit,
    onRefresh: () -> Unit
) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
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
        IconButton(onClick = onRefresh) {
                Icon(
                    Icons.Default.Refresh,
                    contentDescription = "Refresh",
                    tint = colorResource(R.color.text_secondary)
                )
            }
        }
}

@Composable
private fun SimilarJobsErrorCard(errorMessage: String, onDismiss: () -> Unit) {
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
private fun SimilarJobsLoadingState() {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = colorResource(R.color.primary))
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
    
    LaunchedEffect(jobId) {
        viewModel.searchSimilarJobs(jobId = jobId, radius = radius, includeRemote = includeRemote)
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colorResource(R.color.background))
            .padding(16.dp)
    ) {
        SimilarJobsHeader(
            selectedJob = selectedJob,
            onNavigateBack = onNavigateBack,
            onRefresh = {
                viewModel.searchSimilarJobs(jobId = jobId, radius = radius, includeRemote = includeRemote)
            }
        )
        Spacer(modifier = Modifier.height(16.dp))
        SearchFiltersSection(
            radius = radius,
            onRadiusChange = { radius = it },
            includeRemote = includeRemote,
            onIncludeRemoteChange = { includeRemote = it },
            onApplyFilters = {
                viewModel.searchSimilarJobs(jobId = jobId, radius = radius, includeRemote = includeRemote)
            }
        )
        Spacer(modifier = Modifier.height(16.dp))
        error?.let { errorMessage ->
            SimilarJobsErrorCard(errorMessage = errorMessage, onDismiss = { viewModel.clearError() })
            Spacer(modifier = Modifier.height(16.dp))
        }
        when {
            isLoadingSimilarJobs -> SimilarJobsLoadingState()
            similarJobs.isEmpty() -> EmptySimilarJobsState()
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
private fun SimilarJobCardHeader(
    job: SimilarJob,
    onOpenLink: () -> Unit
) {
    Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
        Column(modifier = Modifier.weight(1f)) {
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
                    IconButton(onClick = onOpenLink) {
                        Icon(
                            Icons.Default.OpenInNew,
                            contentDescription = "Open Job Link",
                            tint = colorResource(R.color.primary)
                        )
                    }
                }
            }
            
@Composable
private fun SimilarJobCardMetadata(job: SimilarJob) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
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
                job.distance?.let { distance ->
                    Text(
                        text = "${distance.toInt()}km away",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = colorResource(R.color.text_tertiary)
                        )
                    )
                }
                job.salary?.let { salary ->
            Row(verticalAlignment = Alignment.CenterVertically) {
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
}

@Composable
private fun SimilarJobCardBadges(job: SimilarJob) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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

@Composable
private fun SimilarJobCard(
    job: SimilarJob,
    onOpenLink: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colorResource(R.color.surface)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            SimilarJobCardHeader(job = job, onOpenLink = onOpenLink)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = job.description,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = colorResource(R.color.text_secondary)
                ),
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(12.dp))
            SimilarJobCardMetadata(job = job)
            Spacer(modifier = Modifier.height(8.dp))
            SimilarJobCardBadges(job = job)
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
