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
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse

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

    // ✅ 1️⃣ Connect to socket + load discussions once when entering the screen
    LaunchedEffect(Unit) {
        discussionViewModel.connectToSocket()   // establish socket connection globally
        discussionViewModel.loadDiscussions()   // initial fetch
    }

    // ✅ 2️⃣ Handle backend or socket error/success messages using snackbars
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

    val allDiscussions = uiState.discussions


    // ✅ 4️⃣ Scaffold with snackbar host
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when {
                uiState.isLoading && allDiscussions.isEmpty() ->
                    CircularProgressIndicator(Modifier.align(Alignment.Center))

                else -> LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // ✅ Now it displays live updates — socket pushes new discussions here
                    items(allDiscussions) { discussion ->
                        DiscussionItem(discussion, onDiscussionClick)
                    }
                }
            }
        }

        // ✅ 5️⃣ New Discussion dialog
        if (showDialog) {
            AlertDialog(
                onDismissRequest = { showDialog = false },
                title = { Text("Create Discussion") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = topic,
                            onValueChange = { topic = it },
                            modifier = Modifier.testTag("discussion_topic_input"),
                            label = { Text("Topic") },
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            modifier = Modifier.testTag("discussion_description_input"),
                            label = { Text("Description (optional)") }
                        )
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            discussionViewModel.createDiscussion(topic, description)
                            topic = ""
                            description = ""
                            showDialog = false
                        },
                        modifier = Modifier.testTag("create_discussion_button")
                    ) {
                        Text("Create")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
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
