package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import kotlinx.coroutines.launch

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
    val coroutineScope = rememberCoroutineScope()

    // Combine backend messages + new socket messages (prevent duplicates)
    val storedMessages = uiState.selectedDiscussion?.messages ?: emptyList()

    // 2. Combine the stored messages with the new live messages from the socket.
    //    Use a Set to automatically handle duplicates based on message ID.
    val allMessages = remember(storedMessages, liveMessages) {
        (storedMessages + liveMessages).distinctBy { it.id }
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.clearMessages()
            viewModel.clearSelectedDiscussion()
        }
    }
    // Connect socket + load discussion data
    LaunchedEffect(discussionId) {
        viewModel.clearMessages()
        viewModel.clearSelectedDiscussion()
        viewModel.connectToSocket(discussionId)
        viewModel.loadDiscussionById(discussionId)
    }

    // Auto-scroll to bottom when new messages appear
    LaunchedEffect(allMessages.size) {
        if (allMessages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(allMessages.lastIndex)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        uiState.selectedDiscussion?.topic ?: "Discussion",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = newMessage,
                    onValueChange = { newMessage = it },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("message_input"),
                    placeholder = { Text("Write a message...") }
                )
                IconButton(
                    onClick = {
                        if (newMessage.isNotBlank()) {
                            // ✅ Only emit via socket — backend already saves message
                            viewModel.sendMessage(
                                discussionId,
                                newMessage.trim(),
                                currentUserName,
                                currentUserId
                            )
                            newMessage = ""
                        }
                    }
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send Message")
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF5F5F5))
                .padding(padding)
        ) {
            when {
                uiState.isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
                uiState.error != null -> Text(
                    text = uiState.error ?: "Error",
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.Center)
                )
                else -> LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    reverseLayout = false
                ) {
                    items(allMessages) { message ->
                        MessageItem(
                            message = message,
                            isOwn = message.userId == currentUserId
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MessageItem(message: MessageResponse, isOwn: Boolean) {
    val bubbleColor = if (isOwn) Color(0xFF1A365D) else Color.White
    val textColor = if (isOwn) Color.White else Color.Black

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 6.dp)
    ) {
        // Show username for all messages
        Text(
            text = message.userName,
            style = MaterialTheme.typography.labelMedium.copy(
                color = Color.Gray,
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier.padding(start = 4.dp, bottom = 2.dp)
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = bubbleColor),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(10.dp)
                    .fillMaxWidth()
            ) {
                Text(
                    text = message.content,
                    color = textColor,
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.createdAt.takeIf { it.isNotBlank() } ?: "",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = textColor.copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}
