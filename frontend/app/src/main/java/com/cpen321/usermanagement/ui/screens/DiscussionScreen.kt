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
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.theme.LocalSpacing
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
            .background(colorResource(R.color.background))
    ) {
        when {
            isLoading && allDiscussions.isEmpty() ->
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = colorResource(R.color.primary)
                )
            else -> {
                val spacing = LocalSpacing.current
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(spacing.medium),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    verticalArrangement = Arrangement.spacedBy(spacing.medium)
                ) {
                items(allDiscussions) { discussion ->
                    DiscussionItem(discussion, onDiscussionClick)
                }
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
        val spacing = LocalSpacing.current
        AlertDialog(
            onDismissRequest = onDismiss,
            containerColor = colorResource(R.color.surface),
            title = {
                Text(
                    "Create Discussion",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = colorResource(R.color.text_primary)
                    )
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(spacing.medium)) {
                    OutlinedTextField(
                        value = topic,
                        onValueChange = onTopicChange,
                        modifier = Modifier.testTag("discussion_topic_input"),
                        label = { Text("Topic") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorResource(R.color.primary),
                            unfocusedBorderColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = onDescriptionChange,
                        modifier = Modifier.testTag("discussion_description_input"),
                        label = { Text("Description (optional)") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colorResource(R.color.primary),
                            unfocusedBorderColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
                        ),
                        shape = RoundedCornerShape(12.dp),
                        minLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = onCreate,
                    enabled = topic.isNotBlank(),
                    modifier = Modifier.testTag("create_discussion_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colorResource(R.color.primary)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = onDismiss,
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = colorResource(R.color.text_secondary)
                    )
                ) {
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
                title = {
                    Text(
                        "Community Discussions",
                        modifier = Modifier.testTag("discussions_title"),
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colorResource(R.color.surface),
                    titleContentColor = colorResource(R.color.text_primary)
                ),
                actions = {
                    IconButton(onClick = onClose) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Close",
                            tint = colorResource(R.color.text_primary)
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showDialog = true },
                modifier = Modifier.testTag("new_discussion_button"),
                containerColor = colorResource(R.color.primary),
                contentColor = colorResource(R.color.text_on_primary)
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
    val spacing = LocalSpacing.current
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick(discussion.id) },
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(spacing.medium),
            verticalArrangement = Arrangement.spacedBy(spacing.small)
        ) {
            DiscussionItemHeaderContent(discussion = discussion, spacing = spacing)
            DiscussionItemDescriptionContent(discussion = discussion)
            DiscussionItemFooterContent(discussion = discussion, spacing = spacing)
        }
    }
}

@Composable
private fun DiscussionItemHeaderContent(
    discussion: DiscussionListResponse,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.Chat,
                contentDescription = null,
                tint = colorResource(R.color.primary),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(spacing.small))
            Text(
                text = discussion.topic,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                ),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun DiscussionItemDescriptionContent(discussion: DiscussionListResponse) {
    if (discussion.description?.isNotBlank() == true) {
        Text(
            text = discussion.description ?: "",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = colorResource(R.color.text_secondary)
            ),
            maxLines = 2
        )
    }
}

@Composable
private fun DiscussionItemFooterContent(
    discussion: DiscussionListResponse,
    spacing: com.cpen321.usermanagement.ui.theme.Spacing
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "By ${discussion.creatorName}",
            style = MaterialTheme.typography.labelSmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
        Surface(
            color = colorResource(R.color.primary).copy(alpha = 0.1f),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
        ) {
            Text(
                text = "${discussion.messageCount} messages",
                modifier = Modifier.padding(
                    horizontal = spacing.small,
                    vertical = spacing.extraSmall
                ),
                style = MaterialTheme.typography.labelSmall.copy(
                    color = colorResource(R.color.primary),
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}
