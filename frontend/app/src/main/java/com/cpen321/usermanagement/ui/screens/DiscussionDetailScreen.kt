package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.data.remote.api.MessageResponse
import com.cpen321.usermanagement.ui.viewmodels.DiscussionViewModel
import com.cpen321.usermanagement.ui.viewmodels.DiscussionUiState

@Composable
private fun DiscussionDetailEffects(
    discussionId: String,
    viewModel: DiscussionViewModel,
    allMessages: List<MessageResponse>,
    listState: LazyListState,
    lastMessageCount: Int,
    onLastMessageCountChanged: (Int) -> Unit
) {
    DisposableEffect(Unit) {
        onDispose {
            viewModel.clearMessages()
            viewModel.clearSelectedDiscussion()
        }
    }
    
    LaunchedEffect(discussionId) {
        viewModel.clearMessages()
        viewModel.clearSelectedDiscussion()
        viewModel.connectToSocket(discussionId)
        kotlinx.coroutines.delay(100)
        viewModel.loadDiscussionById(discussionId)
    }

    LaunchedEffect(allMessages.size) {
        if (allMessages.isNotEmpty() && allMessages.size > lastMessageCount) {
            onLastMessageCountChanged(allMessages.size)
            kotlinx.coroutines.delay(100)
            try {
                listState.animateScrollToItem(allMessages.lastIndex)
            } catch (e: IllegalStateException) {
                // Silently handle scroll errors to prevent ANR
            } catch (e: IndexOutOfBoundsException) {
                // Silently handle index errors to prevent ANR
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscussionDetailScreen(
    discussionId: String,
    currentUserId: String,
    currentUserName: String,
    onBack: () -> Unit,
    viewModel: DiscussionViewModel = hiltViewModel()
) {
    val liveMessages by viewModel.messages.collectAsState()
    var newMessage by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    var lastMessageCount by remember { mutableStateOf(0) }

    val storedMessages = uiState.selectedDiscussion?.messages ?: emptyList()
    val allMessages = remember(storedMessages, liveMessages) {
        (storedMessages + liveMessages).distinctBy { it.id }
            .sortedBy { it.createdAt }
    }

    DiscussionDetailEffects(
        discussionId = discussionId,
        viewModel = viewModel,
        allMessages = allMessages,
        listState = listState,
        lastMessageCount = lastMessageCount,
        onLastMessageCountChanged = { lastMessageCount = it }
    )

    Scaffold(
        topBar = {
            DiscussionTopBar(
                topic = uiState.selectedDiscussion?.topic ?: "Discussion",
                onBack = onBack
            )
        },
        bottomBar = {
            MessageInputBar(
                newMessage = newMessage,
                onMessageChange = { newMessage = it },
                onSendMessage = {
                    if (newMessage.isNotBlank()) {
                        val messageToSend = newMessage.trim()
                        newMessage = ""
                        viewModel.sendMessage(
                            discussionId,
                            messageToSend,
                            currentUserName,
                            currentUserId
                        )
                    }
                }
            )
        }
    ) { padding ->
        DiscussionContent(
            uiState = uiState,
            allMessages = allMessages,
            currentUserId = currentUserId,
            listState = listState,
            padding = padding
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DiscussionTopBar(topic: String, onBack: () -> Unit) {
            TopAppBar(
                title = {
                    Text(
                topic,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
            }
        }
    )
}

@Composable
private fun MessageInputBar(
    newMessage: String,
    onMessageChange: (String) -> Unit,
    onSendMessage: () -> Unit
) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = newMessage,
            onValueChange = onMessageChange,
            modifier = Modifier
                .weight(1f)
                .testTag("message_input"),
                    placeholder = { Text("Write a message...") }
                )
        IconButton(onClick = onSendMessage) {
            Icon(Icons.Filled.Send, contentDescription = "Send Message")
        }
            }
        }

@Composable
private fun DiscussionContent(
    uiState: DiscussionUiState,
    allMessages: List<MessageResponse>,
    currentUserId: String,
    listState: androidx.compose.foundation.lazy.LazyListState,
    padding: PaddingValues
) {
        Box(
            modifier = Modifier
                .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
                .padding(padding)
        ) {
            when {
            uiState.isLoading && allMessages.isEmpty() -> {
                LoadingState()
            }
            uiState.error != null -> {
                ErrorState(errorMessage = uiState.error ?: "Error loading discussion")
            }
            else -> {
                MessagesList(
                    allMessages = allMessages,
                    currentUserId = currentUserId,
                    listState = listState
                )
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
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = "Loading messages...",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
private fun ErrorState(errorMessage: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Error",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun MessagesList(
    allMessages: List<MessageResponse>,
    currentUserId: String,
    listState: androidx.compose.foundation.lazy.LazyListState
) {
    if (allMessages.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No messages yet. Start the conversation!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    } else {
        LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxSize()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
                    reverseLayout = false
                ) {
            items(
                items = allMessages,
                key = { it.id }
            ) { message ->
                        MessageItem(
                            message = message,
                            isOwn = message.userId == currentUserId
                        )
                    }
                }
            }
        }

@Composable
private fun MessageColors(isOwn: Boolean) = Pair(
    first = if (isOwn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
    second = if (isOwn) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
)

@Composable
private fun MessageBubbleContent(
    message: MessageResponse,
    textColor: Color
) {
    Column(modifier = Modifier.padding(12.dp)) {
        Text(
            text = message.content,
            color = textColor,
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = formatMessageTime(message.createdAt),
            style = MaterialTheme.typography.labelSmall.copy(
                color = textColor.copy(alpha = 0.7f)
            ),
            modifier = Modifier.align(Alignment.End)
        )
    }
}

@Composable
fun MessageItem(message: MessageResponse, isOwn: Boolean) {
    val (bubbleColor, textColor) = MessageColors(isOwn)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 2.dp),
        horizontalArrangement = if (isOwn) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier.widthIn(max = 280.dp),
            horizontalAlignment = if (isOwn) Alignment.End else Alignment.Start
        ) {
            if (!isOwn) {
                Text(
                    text = message.userName,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        fontWeight = FontWeight.Medium
                    ),
                    modifier = Modifier.padding(start = 8.dp, bottom = 4.dp)
                )
            }
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = bubbleColor),
                shape = RoundedCornerShape(
                    topStart = 16.dp,
                    topEnd = 16.dp,
                    bottomStart = if (isOwn) 16.dp else 4.dp,
                    bottomEnd = if (isOwn) 4.dp else 16.dp
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                MessageBubbleContent(message = message, textColor = textColor)
            }
        }
    }
}

private fun formatMessageTime(createdAt: String): String {
    return if (createdAt.isNotBlank()) {
        try {
            // Simple formatting - just show time if available
            createdAt.takeLast(8).take(5) // Extract HH:MM from timestamp
        } catch (e: Exception) {
            ""
        }
    } else {
        ""
    }
}
