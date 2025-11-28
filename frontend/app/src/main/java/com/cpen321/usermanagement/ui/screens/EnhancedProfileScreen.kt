package com.cpen321.usermanagement.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.data.remote.dto.User
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel

//@OptIn(ExperimentalMaterial3Api::class)
//@Composable
//fun EnhancedProfileScreen(
//    onNavigateBack: () -> Unit,
//    viewModel: ProfileViewModel = hiltViewModel()
//) {
//    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
//
//    var showEditDialog by remember { mutableStateOf(false) }
//
//    // Load profile when screen is displayed
//    LaunchedEffect(Unit) {
//        viewModel.loadProfile()
//    }
//
//    Scaffold(
//        topBar = {
//            TopAppBar(
//                title = {
//                    Text(
//                        text = "Profile",
//                        style = MaterialTheme.typography.titleLarge.copy(
//                            fontWeight = FontWeight.Bold,
//                            color = colorResource(R.color.text_primary)
//                        )
//                    )
//                },
//                navigationIcon = {
//                    IconButton(onClick = onNavigateBack) {
//                        Icon(
//                            Icons.Default.ArrowBack,
//                            contentDescription = "Back",
//                            tint = colorResource(R.color.text_primary)
//                        )
//                    }
//                },
//                actions = {
//                    IconButton(onClick = { showEditDialog = true }) {
//                        Icon(
//                            Icons.Default.Edit,
//                            contentDescription = "Edit Profile",
//                            tint = colorResource(R.color.text_secondary)
//                        )
//                    }
//                },
//                colors = TopAppBarDefaults.topAppBarColors(
//                    containerColor = colorResource(R.color.surface),
//                    titleContentColor = colorResource(R.color.text_primary)
//                )
//            )
//        }
//    ) { paddingValues ->
//        Box(
//            modifier = Modifier
//                .fillMaxSize()
//                .padding(paddingValues)
//                .background(colorResource(R.color.background))
//        ) {
//            when {
//                uiState.isLoadingProfile -> {
//                    Box(
//                        modifier = Modifier.fillMaxSize(),
//                        contentAlignment = Alignment.Center
//                    ) {
//                        CircularProgressIndicator(
//                            color = colorResource(R.color.primary)
//                        )
//                    }
//                }
//
//                uiState.errorMessage != null -> {
//                    Box(
//                        modifier = Modifier.fillMaxSize(),
//                        contentAlignment = Alignment.Center
//                    ) {
//                        Column(
//                            horizontalAlignment = Alignment.CenterHorizontally,
//                            verticalArrangement = Arrangement.spacedBy(16.dp)
//                        ) {
//                            Icon(
//                                Icons.Default.Error,
//                                contentDescription = "Error",
//                                modifier = Modifier.size(48.dp),
//                                tint = colorResource(R.color.error)
//                            )
//                            Text(
//                                text = uiState.errorMessage ?: "Unknown error",
//                                style = MaterialTheme.typography.bodyMedium.copy(
//                                    color = colorResource(R.color.error)
//                                ),
//                                textAlign = TextAlign.Center
//                            )
//                            Button(
//                                onClick = { viewModel.loadProfile() },
//                                colors = ButtonDefaults.buttonColors(
//                                    containerColor = colorResource(R.color.primary)
//                                )
//                            ) {
//                                Text("Retry")
//                            }
//                        }
//                    }
//                }
//
//                uiState.user != null -> {
//                    ProfileContent(
//                        user = uiState.user!!,
//                        onEditClick = { showEditDialog = true }
//                    )
//                }
//            }
//        }
//
//        // Edit Profile Dialog
//        if (showEditDialog) {
//            EditProfileDialog(
//                user = uiState.user,
//                onDismiss = { showEditDialog = false },
//                onSave = { updatedUser ->
//                    viewModel.updateProfile(updatedUser.name, updatedUser.bio ?: "")
//                    showEditDialog = false
//                }
//            )
//        }
//    }
//}

//@Composable
//private fun ProfileContent(
//    user: User,
//    onEditClick: () -> Unit
//) {
//    Column(
//        modifier = Modifier
//            .fillMaxSize()
//            .verticalScroll(rememberScrollState())
//            .padding(16.dp),
//        verticalArrangement = Arrangement.spacedBy(24.dp)
//    ) {
//        // Profile Header
//        UserProfileHeaderCard(user = user)
//
//        // Profile Information
//        ProfileInformation(user = user)
//
//        // Hobbies Section
//        HobbiesSection(hobbies = user.hobbies ?: emptyList())
//
//        // Statistics Section
//        ProfileStatistics()
//    }
//}

@Composable
private fun UserProfileHeaderCard(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Picture
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(colorResource(R.color.primary).copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = "Profile Picture",
                    modifier = Modifier.size(50.dp),
                    tint = colorResource(R.color.primary)
                )
            }
            
            // User Name
            Text(
                text = user.name,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
            
            // Email
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = colorResource(R.color.text_secondary)
                )
            )
        }
    }
}

//@Composable
//private fun ProfileInformation(user: User) {
//    Card(
//        modifier = Modifier.fillMaxWidth(),
//        colors = CardDefaults.cardColors(
//            containerColor = colorResource(R.color.surface)
//        ),
//        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
//    ) {
//        Column(
//            modifier = Modifier.padding(20.dp),
//            verticalArrangement = Arrangement.spacedBy(16.dp)
//        ) {
//            Text(
//                text = "Profile Information",
//                style = MaterialTheme.typography.titleMedium.copy(
//                    fontWeight = FontWeight.Bold,
//                    color = colorResource(R.color.text_primary)
//                )
//            )
//
//            // Bio Section
//            if (!user.bio.isNullOrBlank()) {
//                InfoRow(
//                    icon = Icons.Default.Description,
//                    label = "Bio",
//                    value = user.bio
//                )
//            }
//
//            // Profile Picture URL
//            if (!user.profilePicture.isNullOrBlank()) {
//                InfoRow(
//                    icon = Icons.Default.Image,
//                    label = "Profile Picture",
//                    value = user.profilePicture
//                )
//            }
//        }
//    }
//}

@Composable
private fun HobbiesSection(hobbies: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Hobbies & Interests",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
            
            if (hobbies.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Favorite,
                        contentDescription = "Hobbies",
                        tint = colorResource(R.color.primary),
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = hobbies.joinToString(", "),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = colorResource(R.color.text_secondary)
                        )
                    )
                }
            } else {
                Text(
                    text = "No hobbies added yet",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = colorResource(R.color.text_tertiary)
                    )
                )
            }
        }
    }
}

@Composable
private fun ProfileStatistics() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colorResource(R.color.surface)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Account Statistics",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = colorResource(R.color.text_primary)
                )
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                StatItem(
                    icon = Icons.Default.CalendarToday,
                    label = "Member Since",
                    value = "2024"
                )
                
                StatItem(
                    icon = Icons.Default.Work,
                    label = "Job Applications",
                    value = "6"
                )
            }
        }
    }
}

@Composable
private fun InfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            icon,
            contentDescription = label,
            tint = colorResource(R.color.primary),
            modifier = Modifier.size(20.dp)
        )
        
        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                    color = colorResource(R.color.text_secondary)
                )
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = colorResource(R.color.text_primary)
                )
            )
        }
    }
}

@Composable
private fun StatItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            icon,
            contentDescription = label,
            tint = colorResource(R.color.primary),
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                color = colorResource(R.color.text_primary)
            )
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall.copy(
                color = colorResource(R.color.text_secondary)
            )
        )
    }
}

//@Composable
//private fun EditProfileDialog(
//    user: User?,
//    onDismiss: () -> Unit,
//    onSave: (User) -> Unit
//) {
//    var name by remember { mutableStateOf(user?.name ?: "") }
//    var bio by remember { mutableStateOf(user?.bio ?: "") }
//
//    AlertDialog(
//        onDismissRequest = onDismiss,
//        title = {
//            Text(
//                text = "Edit Profile",
//                style = MaterialTheme.typography.titleLarge.copy(
//                    fontWeight = FontWeight.Bold
//                )
//            )
//        },
//        text = {
//            Column(
//                verticalArrangement = Arrangement.spacedBy(16.dp)
//            ) {
//                OutlinedTextField(
//                    value = name,
//                    onValueChange = { name = it },
//                    label = { Text("Name") },
//                    modifier = Modifier.fillMaxWidth()
//                )
//
//                OutlinedTextField(
//                    value = bio,
//                    onValueChange = { bio = it },
//                    label = { Text("Bio") },
//                    modifier = Modifier.fillMaxWidth(),
//                    maxLines = 3
//                )
//            }
//        },
//        confirmButton = {
//            Button(
//                onClick = {
//                    if (user != null) {
//                        val updatedUser = user.copy(
//                            name = name,
//                            bio = bio
//                        )
//                        onSave(updatedUser)
//                    }
//                },
//                colors = ButtonDefaults.buttonColors(
//                    containerColor = colorResource(R.color.primary)
//                )
//            ) {
//                Text("Save")
//            }
//        },
//        dismissButton = {
//            TextButton(onClick = onDismiss) {
//                Text("Cancel")
//            }
//        }
//    )
//}
