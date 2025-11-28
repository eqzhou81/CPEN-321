package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.lifecycle.LiveData
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.ui.viewmodels.DiscussionViewModel
import com.cpen321.usermanagement.ui.viewmodels.DiscussionUiState
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse

@Composable
private fun DiscussionScreenEffects(
    discussionViewModel: DiscussionViewModel,
    snackbarHostState: SnackbarHostState,
    uiState: DiscussionUiState
) {
    LaunchedEffect(Unit) {
        discussionViewModel.connectToSocket()
        discussionViewModel.loadDiscussions()
    }
    LaunchedEffect(uiState.error, uiState.successMessage) {
        uiState.error?.let {
            snackbarHostState.showSnackbar(it)
            discussionViewModel.clearError()
        }
        uiState.successMessage?.let {
            snackbarHostState.showSnackbar(it)
            discussionViewModel.clearSuccessMessage()
        }
    }
}

@Composable
private fun DiscussionScreenContent(
    allDiscussions: List<DiscussionListResponse>,
    isLoading: Boolean,
    onDiscussionClick: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        when {
            isLoading && allDiscussions.isEmpty() ->
                CircularProgressIndicator(Modifier.align(Alignment.Center))
            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                contentPadding = PaddingValues(bottom = 80.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(allDiscussions) { discussion ->
                    DiscussionItem(discussion, onDiscussionClick)
                }
            }
        }
    }
}

@Composable
private fun CreateDiscussionDialog(
    showDialog: Boolean,
    topic: String,
    description: String,
    onTopicChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onCreate: () -> Unit
) {
    if (showDialog) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Create Discussion") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = topic,
                        onValueChange = onTopicChange,
                        modifier = Modifier.testTag("discussion_topic_input"),
                        label = { Text("Topic") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = onDescriptionChange,
                        modifier = Modifier.testTag("discussion_description_input"),
                        label = { Text("Description (optional)") }
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = onCreate,
                    modifier = Modifier.testTag("create_discussion_button")
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscussionScreen(
    onDiscussionClick: (String) -> Unit,
    onClose: () -> Unit,
    discussionViewModel: DiscussionViewModel = hiltViewModel()
) {
    val uiState by discussionViewModel.uiState.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var topic by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }
    val allDiscussions = uiState.discussions

    DiscussionScreenEffects(
        discussionViewModel = discussionViewModel,
        snackbarHostState = snackbarHostState,
        uiState = uiState
    )

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Community Discussions", modifier = Modifier.testTag("discussions_title")) },
                actions = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                modifier = Modifier.testTag("new_discussion_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = "New Discussion")
            }
        }
    ) { padding ->
        DiscussionScreenContent(
            allDiscussions = allDiscussions,
            isLoading = uiState.isLoading,
            onDiscussionClick = onDiscussionClick
        )
    }

    CreateDiscussionDialog(
        showDialog = showDialog,
        topic = topic,
        description = description,
        onTopicChange = { topic = it },
        onDescriptionChange = { description = it },
        onDismiss = { showDialog = false },
        onCreate = {
            discussionViewModel.createDiscussion(topic, description)
            topic = ""
            description = ""
            showDialog = false
        }
    )
}

@Composable
fun DiscussionItem(
    discussion: DiscussionListResponse,
    onClick: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick(discussion.id) },
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Chat,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = discussion.topic,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Spacer(Modifier.height(8.dp))
            Text(
                text = discussion.description ?: "",
                style = MaterialTheme.typography.bodyMedium.copy(color = Color.Gray)
            )

            Spacer(Modifier.height(8.dp))
            Text(
                text = "By ${discussion.creatorName} • ${discussion.messageCount} messages",
                style = MaterialTheme.typography.labelSmall.copy(color = Color.Gray)
            )
        }
    }
}
