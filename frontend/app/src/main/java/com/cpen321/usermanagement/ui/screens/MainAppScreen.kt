package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.api.DiscussionListResponse
import com.cpen321.usermanagement.ui.navigation.Navigation
import com.cpen321.usermanagement.ui.navigation.NavigationStateManager
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel
import com.cpen321.usermanagement.ui.viewmodels.AuthUiState

@Composable
private fun MainAppScreenEffects(
    authState: AuthUiState,
    snackBarHostState: SnackbarHostState,
    authViewModel: AuthViewModel,
    navigationStateManager: NavigationStateManager
) {
    LaunchedEffect(authState.isAuthenticated, authState.errorMessage) {
        if (!authState.isAuthenticated) {
            if (authState.isSigningOut) {
                navigationStateManager.handleAccountSignOut()
            } else {
                navigationStateManager.handleAccountDeletion()
            }
        } else if (authState.errorMessage != null) {
            val errorMsg = authState.errorMessage
            if (errorMsg != null) {
                snackBarHostState.showSnackbar(errorMsg)
                authViewModel.clearError()
            }
        }
    }
}

@Composable
private fun MainAppTopBar(selectedTab: MainTab) {
            TopAppBar(
                title = {
                    Text(
                text = when (selectedTab) {
                    MainTab.JOB_APPLICATIONS -> "Job Applications"
                    MainTab.DISCUSSIONS -> "Discussions"
                    MainTab.PROFILE -> "Profile"
                },
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = colorResource(R.color.surface),
            titleContentColor = colorResource(R.color.text_primary)
        )
    )
}

@Composable
private fun MainAppBottomBar(
    selectedTab: MainTab,
    onTabSelected: (MainTab) -> Unit
) {
    NavigationBar(
        containerColor = colorResource(R.color.surface),
        contentColor = colorResource(R.color.text_primary)
    ) {
        MainTab.values().forEach { tab ->
            NavigationBarItem(
                icon = {
                        Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.title
                    )
                },
                label = {
                    Text(
                        text = tab.title,
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                selected = selectedTab == tab,
                onClick = { onTabSelected(tab) }
            )
        }
    }
}

@Composable
private fun MainAppContent(
    selectedTab: MainTab,
    discussionViewModel: com.cpen321.usermanagement.ui.viewmodels.DiscussionViewModel,
    authViewModel: AuthViewModel,
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    snackBarHostState: SnackbarHostState,
    scope: CoroutineScope,
    navigationStateManager: NavigationStateManager
) {
    when (selectedTab) {
        MainTab.JOB_APPLICATIONS -> Navigation()
        MainTab.DISCUSSIONS -> {
            DiscussionScreenContent(
                discussionViewModel = discussionViewModel,
                onDiscussionClick = { discussionId ->
                    scope.launch {
                        snackBarHostState.showSnackbar(
                            "Tap to view discussion details",
                            duration = SnackbarDuration.Short
                        )
                    }
                }
            )
        }
        MainTab.PROFILE -> {
            ProfileScreenContent(
                authViewModel = authViewModel,
                profileViewModel = profileViewModel,
                onSignOut = { navigationStateManager.handleAccountSignOut() },
                onAccountDeleted = { navigationStateManager.handleAccountDeletion() }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(
    authViewModel: AuthViewModel = hiltViewModel(),
    navigationStateManager: NavigationStateManager
) {
    val scope = rememberCoroutineScope()
    var selectedTab by remember { mutableStateOf(MainTab.JOB_APPLICATIONS) }
    val authState by authViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }
    val profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel = hiltViewModel()
    val discussionViewModel: com.cpen321.usermanagement.ui.viewmodels.DiscussionViewModel = hiltViewModel()

    MainAppScreenEffects(
        authState = authState,
        snackBarHostState = snackBarHostState,
        authViewModel = authViewModel,
        navigationStateManager = navigationStateManager
    )

    Scaffold(
        topBar = { MainAppTopBar(selectedTab = selectedTab) },
        bottomBar = { MainAppBottomBar(selectedTab = selectedTab, onTabSelected = { selectedTab = it }) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            MainAppContent(
                selectedTab = selectedTab,
                discussionViewModel = discussionViewModel,
                authViewModel = authViewModel,
                profileViewModel = profileViewModel,
                snackBarHostState = snackBarHostState,
                scope = scope,
                navigationStateManager = navigationStateManager
            )
        }
        SnackbarHost(
            hostState = snackBarHostState,
            modifier = Modifier.padding(16.dp)
        )
    }
}

/**
 * Enum representing the main navigation tabs
 */
private enum class MainTab(
    val title: String,
    val icon: ImageVector
) {
    JOB_APPLICATIONS("Jobs", Icons.Default.Work),
    DISCUSSIONS("Discussions", Icons.Default.Chat),
    PROFILE("Profile", Icons.Default.Person)
}


@Composable
private fun DiscussionScreenContent(
    discussionViewModel: com.cpen321.usermanagement.ui.viewmodels.DiscussionViewModel,
    onDiscussionClick: (String) -> Unit
) {
    val uiState by discussionViewModel.uiState.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var topic by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        // Connect to socket for general discussion updates (not a specific discussion)
        discussionViewModel.connectToSocket(discussionId = null)
        // Load discussions after a small delay to let socket initialize
        kotlinx.coroutines.delay(200)
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        DiscussionListContent(
            isLoading = uiState.isLoading,
            discussions = uiState.discussions,
            onDiscussionClick = onDiscussionClick
        )

        CreateDiscussionFAB(onClick = { showDialog = true })

        if (showDialog) {
            CreateDiscussionDialog(
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
    }

    SnackbarHost(
        hostState = snackbarHostState,
        modifier = Modifier.padding(16.dp)
    )
}

@Composable
private fun DiscussionListContent(
    isLoading: Boolean,
    discussions: List<com.cpen321.usermanagement.data.remote.api.DiscussionListResponse>,
    onDiscussionClick: (String) -> Unit
) {
    when {
        isLoading && discussions.isEmpty() -> {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }
        else -> LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentPadding = PaddingValues(bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(discussions) { discussion ->
                DiscussionItemCard(discussion, onDiscussionClick)
            }
        }
    }
}

@Composable
private fun CreateDiscussionFAB(onClick: () -> Unit) {
    FloatingActionButton(
        onClick = onClick,
        modifier = Modifier
            .align(Alignment.BottomEnd)
            .padding(16.dp)
    ) {
        Icon(Icons.Default.Add, contentDescription = "New Discussion")
    }
}

@Composable
private fun CreateDiscussionDialog(
    topic: String,
    description: String,
    onTopicChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onCreate: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Discussion") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = topic,
                    onValueChange = onTopicChange,
                    label = { Text("Topic") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = onDescriptionChange,
                    label = { Text("Description (optional)") }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onCreate) {
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



@Composable
private fun DiscussionItemCard(
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


@Composable
private fun ProfileScreenContent(
    authViewModel: AuthViewModel,
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    onSignOut: () -> Unit,
    onAccountDeleted: () -> Unit
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showSignOutDialog by remember { mutableStateOf(false) }
    val authState by authViewModel.uiState.collectAsState()

    LaunchedEffect(authState.isAuthenticated, authState.errorMessage) {
        if (!authState.isAuthenticated) {
            if (authState.isSigningOut) {
                onSignOut()
            } else {
                onAccountDeleted()
            }
        } else if (authState.errorMessage != null) {
            authState.errorMessage?.let { errorMsg ->
                snackBarHostState.showSnackbar(errorMsg)
                authViewModel.clearError()
            }
        }
    }

    LaunchedEffect(Unit) {
        profileViewModel.clearSuccessMessage()
        profileViewModel.clearError()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        ProfileContent(
            isLoading = uiState.isLoadingProfile,
            user = uiState.user,
            onShowSignOutDialog = { showSignOutDialog = true },
            onShowDeleteDialog = { showDeleteDialog = true }
        )
    }

    ProfileDialogs(
        showDeleteDialog = showDeleteDialog,
        showSignOutDialog = showSignOutDialog,
        onDismissDeleteDialog = { showDeleteDialog = false },
        onDismissSignOutDialog = { showSignOutDialog = false },
        onConfirmDelete = {
            showDeleteDialog = false
            authViewModel.handleAccountDeletion()
        },
        onConfirmSignOut = {
            showSignOutDialog = false
            authViewModel.handleSignout()
        }
    )

    SnackbarHost(
        hostState = snackBarHostState,
        modifier = Modifier.padding(16.dp)
    )
}

@Composable
private fun ProfileContent(
    isLoading: Boolean,
    user: com.cpen321.usermanagement.data.remote.dto.User?,
    onShowSignOutDialog: () -> Unit,
    onShowDeleteDialog: () -> Unit
) {
    when {
        isLoading -> CircularProgressIndicator(Modifier.align(Alignment.Center))
        else -> {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Profile",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold
                    )
                )

                Spacer(Modifier.height(16.dp))

                user?.let { UserInfoCard(user = it) }

                Spacer(Modifier.height(8.dp))

                ProfileActionButtons(
                    onShowSignOutDialog = onShowSignOutDialog,
                    onShowDeleteDialog = onShowDeleteDialog
                )
            }
        }
    }
}

@Composable
private fun UserInfoCard(user: com.cpen321.usermanagement.data.remote.dto.User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = user.name ?: "User",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                )
            )
            Text(
                text = user.email ?: "",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = colorResource(R.color.text_secondary)
                )
            )
        }
    }
}

@Composable
private fun ProfileActionButtons(
    onShowSignOutDialog: () -> Unit,
    onShowDeleteDialog: () -> Unit
) {
    Button(
        onClick = onShowSignOutDialog,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.error)
        )
    ) {
        Icon(Icons.Default.Logout, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text("Sign Out")
    }

    OutlinedButton(
        onClick = onShowDeleteDialog,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colorResource(R.color.error)
        )
    ) {
        Icon(Icons.Default.Delete, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text("Delete Account")
    }
}

@Composable
private fun ProfileDialogs(
    showDeleteDialog: Boolean,
    showSignOutDialog: Boolean,
    onDismissDeleteDialog: () -> Unit,
    onDismissSignOutDialog: () -> Unit,
    onConfirmDelete: () -> Unit,
    onConfirmSignOut: () -> Unit
) {
    if (showDeleteDialog) {
        DeleteAccountDialog(
            onDismiss = onDismissDeleteDialog,
            onConfirm = onConfirmDelete
        )
    }

    if (showSignOutDialog) {
        SignOutDialog(
            onDismiss = onDismissSignOutDialog,
            onConfirm = onConfirmSignOut
        )
    }
}

@Composable
private fun DeleteAccountDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete Account") },
        text = { Text("Are you sure you want to delete your account? This action cannot be undone.") },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = colorResource(R.color.error)
                )
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun SignOutDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Sign Out") },
        text = { Text("Are you sure you want to sign out?") },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = colorResource(R.color.error)
                )
            ) {
                Text("Sign Out")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun DiscussionsDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Discussions",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                )
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    Icons.Default.Chat,
                    contentDescription = "Discussions",
                    modifier = Modifier.size(48.dp),
                    tint = colorResource(R.color.primary)
                )
                
                Text(
                    text = "Discussions Feature",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Medium
                    )
                )
                
                Text(
                    text = "This feature will allow users to discuss job applications, share experiences, and get advice from the community.",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_secondary)
                    )
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun LogoutDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Logout",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                )
            )
        },
        text = {
            Text(
                text = "Are you sure you want to logout?",
                style = MaterialTheme.typography.bodyMedium
            )
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                colors = ButtonDefaults.textButtonColors(
                    contentColor = colorResource(R.color.error)
                )
            ) {
                Text("Logout")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
