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
import androidx.compose.foundation.shape.RoundedCornerShape
import com.cpen321.usermanagement.ui.theme.LocalSpacing
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

@OptIn(ExperimentalMaterial3Api::class)
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
            .background(colorResource(R.color.background))
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
                CircularProgressIndicator(
                    color = colorResource(R.color.primary)
                )
            }
        }
        else -> {
            val spacing = LocalSpacing.current
            LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                    .padding(spacing.medium),
            contentPadding = PaddingValues(bottom = 80.dp),
                verticalArrangement = Arrangement.spacedBy(spacing.medium)
        ) {
            items(discussions) { discussion ->
                DiscussionItemCard(discussion, onDiscussionClick)
            }
            }
        }
    }
}

@Composable
private fun CreateDiscussionFAB(onClick: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.BottomEnd
    ) {
    FloatingActionButton(
        onClick = onClick,
            modifier = Modifier.padding(16.dp),
            containerColor = colorResource(R.color.primary),
            contentColor = colorResource(R.color.text_on_primary)
        ) {
            Icon(
                Icons.Default.Add,
                contentDescription = "New Discussion"
            )
        }
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
            CreateDiscussionDialogFields(
                topic = topic,
                description = description,
                onTopicChange = onTopicChange,
                onDescriptionChange = onDescriptionChange,
                spacing = spacing
            )
        },
        confirmButton = {
            CreateDiscussionDialogConfirmButton(
                onCreate = onCreate,
                topic = topic
            )
        },
        dismissButton = {
            CreateDiscussionDialogDismissButton(onDismiss = onDismiss)
        }
    )
}



@Composable
private fun DiscussionItemCard(
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
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(spacing.medium),
            verticalArrangement = Arrangement.spacedBy(spacing.small)
        ) {
            DiscussionItemHeader(discussion = discussion, spacing = spacing)
            DiscussionItemDescription(discussion = discussion)
            DiscussionItemFooter(discussion = discussion, spacing = spacing)
        }
    }
}

@Composable
private fun DiscussionItemHeader(
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
private fun DiscussionItemDescription(discussion: DiscussionListResponse) {
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
private fun DiscussionItemFooter(
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
            shape = RoundedCornerShape(8.dp)
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

    // Load profile when screen is shown
    LaunchedEffect(Unit) {
        profileViewModel.loadProfile()
    }

    // Handle auth state changes (sign out, account deletion)
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

    // Display profile success messages
    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { message ->
            snackBarHostState.showSnackbar(message)
            kotlinx.coroutines.delay(100)
            profileViewModel.clearSuccessMessage()
        }
    }
    
    // Display profile error messages
    LaunchedEffect(uiState.errorMessage) {
        uiState.errorMessage?.let { message ->
            snackBarHostState.showSnackbar(message)
            kotlinx.coroutines.delay(100)
            profileViewModel.clearError()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        ProfileContent(
            isLoading = uiState.isLoadingProfile,
            user = uiState.user,
            profileViewModel = profileViewModel,
            onShowSignOutDialog = { showSignOutDialog = true },
            onShowDeleteDialog = { showDeleteDialog = true },
            isSaving = uiState.isSavingProfile
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
    profileViewModel: com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel,
    onShowSignOutDialog: () -> Unit,
    onShowDeleteDialog: () -> Unit,
    isSaving: Boolean
) {
    when {
        isLoading -> {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = colorResource(R.color.primary)
                )
            }
        }
        else -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                user?.let { 
                    EditableUserInfoCard(
                        user = it,
                        onSave = { name ->
                            profileViewModel.updateProfile(name)
                        },
                        isSaving = isSaving
                    )
                }

                ProfileActionButtons(
                    onShowSignOutDialog = onShowSignOutDialog,
                    onShowDeleteDialog = onShowDeleteDialog
                )
            }
        }
    }
}

@Composable
private fun EditableUserInfoCard(
    user: com.cpen321.usermanagement.data.remote.dto.User,
    onSave: (String?) -> Unit,
    isSaving: Boolean
) {
    var name by remember(user.id) { mutableStateOf(user.name ?: "") }
    var isEditing by remember { mutableStateOf(false) }
    
    // Update name when user changes (e.g., after successful save)
    LaunchedEffect(user.name) {
        if (!isEditing) {
            name = user.name ?: ""
        }
    }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            EditableUserInfoFields(
                name = name,
                onNameChange = { name = it },
                email = user.email ?: "",
                isEditing = isEditing,
                isSaving = isSaving
            )
            EditableUserInfoActions(
                isEditing = isEditing,
                isSaving = isSaving,
                name = name,
                originalName = user.name ?: "",
                onEdit = { isEditing = true },
                onCancel = {
                    isEditing = false
                    name = user.name ?: ""
                },
                onSave = {
                    onSave(name.takeIf { it.isNotBlank() })
                    isEditing = false
                }
            )
        }
    }
}

@Composable
private fun EditableUserInfoFields(
    name: String,
    onNameChange: (String) -> Unit,
    email: String,
    isEditing: Boolean,
    isSaving: Boolean
) {
    OutlinedTextField(
        value = name,
        onValueChange = onNameChange,
        label = { Text("Name") },
        enabled = isEditing && !isSaving,
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = colorResource(R.color.primary),
            unfocusedBorderColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    )
    
    OutlinedTextField(
        value = email,
        onValueChange = { },
        label = { Text("Email") },
        enabled = false,
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            disabledBorderColor = colorResource(R.color.text_secondary).copy(alpha = 0.3f),
            disabledTextColor = colorResource(R.color.text_secondary)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    )
}

@Composable
private fun EditableUserInfoActions(
    isEditing: Boolean,
    isSaving: Boolean,
    name: String,
    originalName: String,
    onEdit: () -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (isEditing) {
            EditableUserInfoCancelButton(
                onCancel = onCancel,
                isSaving = isSaving
            )
            EditableUserInfoSaveButton(
                onSave = onSave,
                isSaving = isSaving,
                name = name
            )
        } else {
            EditableUserInfoEditButton(onEdit = onEdit)
        }
    }
}

@Composable
private fun EditableUserInfoCancelButton(
    onCancel: () -> Unit,
    isSaving: Boolean
) {
    OutlinedButton(
        onClick = onCancel,
        modifier = Modifier.weight(1f),
        enabled = !isSaving,
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colorResource(R.color.text_secondary)
        )
    ) {
        Text("Cancel")
    }
}

@Composable
private fun EditableUserInfoSaveButton(
    onSave: () -> Unit,
    isSaving: Boolean,
    name: String
) {
    Button(
        onClick = onSave,
        modifier = Modifier.weight(1f),
        enabled = !isSaving && name.isNotBlank(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        if (isSaving) {
            CircularProgressIndicator(
                modifier = Modifier.size(16.dp),
                color = colorResource(R.color.text_on_primary),
                strokeWidth = 2.dp
            )
        } else {
            Text("Save")
        }
    }
}

@Composable
private fun EditableUserInfoEditButton(onEdit: () -> Unit) {
    Button(
        onClick = onEdit,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.primary)
        ),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Icon(
            Icons.Default.Edit,
            contentDescription = "Edit",
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text("Edit Profile")
    }
}

@Composable
private fun ProfileActionButtons(
    onShowSignOutDialog: () -> Unit,
    onShowDeleteDialog: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
) {
    Button(
        onClick = onShowSignOutDialog,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(
            containerColor = colorResource(R.color.error)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
        ) {
            Icon(
                Icons.Default.Logout,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
        Text("Sign Out")
    }

    OutlinedButton(
        onClick = onShowDeleteDialog,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = colorResource(R.color.error)
            ),
            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
        ) {
            Icon(
                Icons.Default.Delete,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
        Text("Delete Account")
        }
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
