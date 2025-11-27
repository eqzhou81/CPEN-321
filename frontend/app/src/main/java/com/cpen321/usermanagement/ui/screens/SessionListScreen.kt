package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.data.remote.dto.SessionModels.Session
import com.cpen321.usermanagement.data.remote.dto.SessionModels.SessionStatus
import com.cpen321.usermanagement.ui.viewmodels.SessionListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SessionListScreen(
    onBackClick: () -> Unit,
    onSessionClick: (String) -> Unit,
    onCreateSession: () -> Unit,
    viewModel: SessionListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadSessions()
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF1E3A8A))
    ) {
        SessionListTopBar(
            onBackClick = onBackClick,
            onCreateSession = onCreateSession
        )
        
        SessionListContent(
            uiState = uiState,
            onSessionClick = onSessionClick,
            onCreateSession = onCreateSession,
            onRetry = { viewModel.loadSessions() }
        )
    }
}

@Composable
private fun SessionListTopBar(
    onBackClick: () -> Unit,
    onCreateSession: () -> Unit
) {
    TopAppBar(
        title = { 
            Text(
                "Mock Interview Sessions",
                color = Color.White,
                fontWeight = FontWeight.Bold
            ) 
        },
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(
                    Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFF1E3A8A)
        ),
        actions = {
            IconButton(onClick = onCreateSession) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = "Create Session",
                    tint = Color.White
                )
            }
        }
    )
}

@Composable
private fun SessionListContent(
    uiState: SessionListViewModel.UiState,
    onSessionClick: (String) -> Unit,
    onCreateSession: () -> Unit,
    onRetry: () -> Unit
) {
    when (val state = uiState) {
        is SessionListViewModel.UiState.Loading -> {
            LoadingState()
        }
        
        is SessionListViewModel.UiState.Success -> {
            SessionsList(
                sessions = state.sessions,
                onSessionClick = onSessionClick,
                onCreateSession = onCreateSession
            )
        }
        
        is SessionListViewModel.UiState.Error -> {
            ErrorState(message = state.message, onRetry = onRetry)
        }
    }
}

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = Color.White)
    }
}

@Composable
private fun SessionsList(
    sessions: List<Session>,
    onSessionClick: (String) -> Unit,
    onCreateSession: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(sessions) { session ->
            SessionCard(
                session = session,
                onClick = { onSessionClick(session.id) }
            )
        }
        
        if (sessions.isEmpty()) {
            item {
                EmptyStateCard(onCreateSession = onCreateSession)
            }
        }
    }
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "Error: $message",
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onRetry) {
                Text("Retry")
            }
        }
    }
}

@Composable
private fun SessionCard(
    session: Session,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Interview Session",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    "Progress: ${session.answeredQuestions}/${session.totalQuestions} questions",
                    fontSize = 14.sp,
                    color = Color.Gray
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Progress Bar
                LinearProgressIndicator(
                    progress = session.progressPercentage / 100f,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp),
                    color = when (session.status) {
                        SessionStatus.COMPLETED -> Color(0xFF4CAF50)
                        SessionStatus.ACTIVE -> Color(0xFFFFC107)
                        SessionStatus.PAUSED -> Color(0xFFFF9800)
                        SessionStatus.CANCELLED -> Color(0xFFF44336)
                    },
                    trackColor = Color(0xFFE0E0E0)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Status Badge
                StatusBadge(status = session.status)
            }
            
            Icon(
                Icons.Default.PlayArrow,
                contentDescription = "Start Session",
                tint = Color(0xFF1565C0),
                modifier = Modifier.size(32.dp)
            )
        }
    }
}

@Composable
private fun StatusBadge(status: SessionStatus) {
    val (text, color) = when (status) {
        SessionStatus.ACTIVE -> "Active" to Color(0xFF4CAF50)
        SessionStatus.PAUSED -> "Paused" to Color(0xFFFF9800)
        SessionStatus.COMPLETED -> "Completed" to Color(0xFF2196F3)
        SessionStatus.CANCELLED -> "Cancelled" to Color(0xFFF44336)
    }
    
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = text,
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun EmptyStateCard(onCreateSession: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "No Interview Sessions Yet",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                "Create your first mock interview session to start practicing!",
                fontSize = 14.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = onCreateSession,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1565C0)
                )
            ) {
                Icon(
                    Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Create Session")
            }
        }
    }
}

