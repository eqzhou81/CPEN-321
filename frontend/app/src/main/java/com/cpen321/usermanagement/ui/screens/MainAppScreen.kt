package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.navigation.Navigation
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel

/**
 * Main App Screen with top navigation bar
 * Includes logout, profile, and discussions icons
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var showProfileDialog by remember { mutableStateOf(false) }
    var showDiscussionsDialog by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Job Tracker",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = colorResource(R.color.text_primary)
                        )
                    )
                },
                actions = {
                    // Logout Button
                    IconButton(
                        onClick = { showLogoutDialog = true }
                    ) {
                        Icon(
                            Icons.Default.Logout,
                            contentDescription = "Logout",
                            tint = colorResource(R.color.text_secondary)
                        )
                    }
                    
                    // Profile Button
                    IconButton(
                        onClick = { showProfileDialog = true }
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = colorResource(R.color.text_secondary)
                        )
                    }
                    
                    // Discussions Button
                    IconButton(
                        onClick = { showDiscussionsDialog = true }
                    ) {
                        Icon(
                            Icons.Default.Chat,
                            contentDescription = "Discussions",
                            tint = colorResource(R.color.text_secondary)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colorResource(R.color.surface),
                    titleContentColor = colorResource(R.color.text_primary)
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Navigation()
        }
        
        // Profile Dialog
        if (showProfileDialog) {
            ProfileDialog(
                onDismiss = { showProfileDialog = false }
            )
        }
        
        // Discussions Dialog
        if (showDiscussionsDialog) {
            DiscussionsDialog(
                onDismiss = { showDiscussionsDialog = false }
            )
        }
        
        // Logout Dialog
        if (showLogoutDialog) {
            LogoutDialog(
                onDismiss = { showLogoutDialog = false },
                onConfirm = {
                    authViewModel.handleSignout()
                    showLogoutDialog = false
                }
            )
        }
    }
}

@Composable
private fun ProfileDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Profile",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold
                )
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile Picture Placeholder
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(colorResource(R.color.primary).copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = "Profile Picture",
                        modifier = Modifier.size(40.dp),
                        tint = colorResource(R.color.primary)
                    )
                }
                
                Text(
                    text = "User Profile",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Medium
                    )
                )
                
                Text(
                    text = "Profile functionality will be implemented here. This will show user information, settings, and preferences.",
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
