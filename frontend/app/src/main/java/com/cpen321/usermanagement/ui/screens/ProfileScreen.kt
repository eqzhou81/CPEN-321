package com.cpen321.usermanagement.ui.screens

import Button
import Icon
import androidx.compose.runtime.rememberCoroutineScope
import MenuButtonItem
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import com.cpen321.usermanagement.R
import com.cpen321.usermanagement.ui.components.MessageSnackbar
import com.cpen321.usermanagement.ui.components.MessageSnackbarState
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel
import com.cpen321.usermanagement.ui.viewmodels.ProfileUiState
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import com.cpen321.usermanagement.ui.theme.LocalSpacing
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalContext
import android.Manifest
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import coil.compose.rememberAsyncImagePainter
import com.cpen321.usermanagement.data.model.MyLocation
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.MapView
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.libraries.places.api.model.Place
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState



private data class ProfileDialogState(
    val showDeleteDialog: Boolean = false,
    val showSignOutDialog: Boolean = false
)

data class ProfileScreenActions(
    val onBackClick: () -> Unit,
    val onAccountDeleted: () -> Unit,
    val onSignOut: () -> Unit
)

private data class ProfileScreenCallbacks(
    val onBackClick: () -> Unit,
    val onSignOutAccountClick: () -> Unit,
    val onSignOutDialogDismiss: () -> Unit,
    val onSignOutDialogConfirm: () -> Unit,
    val onDeleteAccountClick: () -> Unit,
    val onDeleteDialogDismiss: () -> Unit,
    val onDeleteDialogConfirm: () -> Unit,
    val onSuccessMessageShown: () -> Unit,
    val onErrorMessageShown: () -> Unit
)





@Composable
fun ProfileScreen(
    authViewModel: AuthViewModel,
    profileViewModel: ProfileViewModel,
    actions: ProfileScreenActions
) {
    val uiState by profileViewModel.uiState.collectAsState()
    val snackBarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    // Dialog state
    var dialogState by remember {
        mutableStateOf(ProfileDialogState())
    }

    val authState by authViewModel.uiState.collectAsState()

    LaunchedEffect(authState.isAuthenticated, authState.errorMessage) {
        if (!authState.isAuthenticated) {

            if(authState.isSigningOut){
                actions.onSignOut()
            }
            else{
                actions.onAccountDeleted()
            }

        } else if (authState.errorMessage != null) {
            // Show error message
            val errorMsg = authState.errorMessage
            if(errorMsg != null){
                snackBarHostState.showSnackbar(errorMsg)
                authViewModel.clearError()
            }


        }
    }

    // Side effects
    LaunchedEffect(Unit) {
        profileViewModel.clearSuccessMessage()
        profileViewModel.clearError()
    }




    ProfileContent(
        uiState = uiState,
        dialogState = dialogState,
        snackBarHostState = snackBarHostState,
        callbacks = ProfileScreenCallbacks(
            onBackClick = actions.onBackClick,

            onSignOutAccountClick = {
                dialogState = dialogState.copy(showSignOutDialog = true)
            },
            onSignOutDialogDismiss = {
                dialogState = dialogState.copy(showSignOutDialog = false)
            },
            onSignOutDialogConfirm = {
                dialogState = dialogState.copy(showSignOutDialog = false)
                authViewModel.handleSignout()
            },
            onDeleteAccountClick = {
                dialogState = dialogState.copy(showDeleteDialog = true)
            },
            onDeleteDialogDismiss = {
                dialogState = dialogState.copy(showDeleteDialog = false)
            },
            onDeleteDialogConfirm = {
                dialogState = dialogState.copy(showDeleteDialog = false)
                authViewModel.handleAccountDeletion()
            },

            onSuccessMessageShown = profileViewModel::clearSuccessMessage,
            onErrorMessageShown = profileViewModel::clearError
        )
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileContent(
    uiState: ProfileUiState,
    dialogState: ProfileDialogState,
    snackBarHostState: SnackbarHostState,
    callbacks: ProfileScreenCallbacks,
    modifier: Modifier = Modifier
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            ProfileTopBar(onBackClick = callbacks.onBackClick)
        },
        snackbarHost = {
            MessageSnackbar(
                hostState = snackBarHostState,
                messageState = MessageSnackbarState(
                    successMessage = uiState.successMessage,
                    errorMessage = uiState.errorMessage,
                    onSuccessMessageShown = callbacks.onSuccessMessageShown,
                    onErrorMessageShown = callbacks.onErrorMessageShown
                )
            )
        }
    ) { paddingValues ->
        ProfileBody(
            uiState = uiState,
            paddingValues = paddingValues,
            isLoading = uiState.isLoadingProfile,
            onDeleteAccountClick = callbacks.onDeleteAccountClick,
            onSignOutClick = callbacks.onSignOutAccountClick

        )
    }

    if (dialogState.showDeleteDialog) {
        DeleteAccountDialog(
            onDismiss = callbacks.onDeleteDialogDismiss,
            onConfirm = callbacks.onDeleteDialogConfirm
        )
    }

    if (dialogState.showSignOutDialog) {
        SignOutDialog(
            onDismiss = callbacks.onSignOutDialogDismiss,
            onConfirm = callbacks.onSignOutDialogConfirm
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileTopBar(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        modifier = modifier,
        title = {
            Text(
                text = stringResource(R.string.profile),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Medium
            )
        },
        navigationIcon = {
            IconButton(onClick = onBackClick) {
                Icon(name = R.drawable.ic_arrow_back)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun ProfileBody(
    uiState: ProfileUiState,
    paddingValues: PaddingValues,
    isLoading: Boolean,
    onDeleteAccountClick: () -> Unit,
    onSignOutClick: () -> Unit,
    modifier: Modifier = Modifier
) {

    Box(
        modifier = modifier
            .fillMaxSize()
            .padding(paddingValues)
    ) {
        when {
            isLoading -> {
                LoadingIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }

            else -> {

                ProfileMenuItems(
                    onDeleteAccountClick = onDeleteAccountClick,
                    onSignOutClick  = onSignOutClick


                )
            }
        }
    }
}

@Composable
private fun ProfileMenuItems(
    onDeleteAccountClick: () -> Unit,
    onSignOutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val spacing = LocalSpacing.current
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(spacing.large)
            .verticalScroll(scrollState),
        verticalArrangement = Arrangement.spacedBy(spacing.medium)
    ) {
        ProfileSection(


            )

        AccountSection(
            onDeleteAccountClick = onDeleteAccountClick,
            onSignOutClick = onSignOutClick
        )
    }
}

@Composable
private fun ProfileSection(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(LocalSpacing.current.medium)
    ) {



    }
}

@Composable
private fun AccountSection(
    onDeleteAccountClick: () -> Unit,
    onSignOutClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(LocalSpacing.current.medium)
    ) {
        DeleteAccountButton(onClick = onDeleteAccountClick)
        SignOutButton (onClick = onSignOutClick)
    }
}

@Composable
private fun ManageProfileButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.manage_profile),
        iconRes = R.drawable.ic_manage_profile,
        onClick = onClick,
    )
}

@Composable
private fun ManageHobbiesButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.manage_hobbies),
        iconRes = R.drawable.ic_heart_smile,
        onClick = onClick,
    )
}

@Composable
private fun DeleteAccountButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.delete_account),
        iconRes = R.drawable.ic_delete_forever,
        onClick = onClick,
    )
}

@Composable
private fun DeleteAccountDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        modifier = modifier,
        onDismissRequest = onDismiss,
        title = {
            DeleteDialogTitle()
        },
        text = {
            DeleteDialogText()
        },
        confirmButton = {
            DeleteDialogConfirmButton(onClick = onConfirm)
        },
        dismissButton = {
            DeleteDialogDismissButton(onClick = onDismiss)
        }
    )
}


@Composable
private fun DeleteDialogTitle(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.delete_account),
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = modifier
    )
}

@Composable
private fun DeleteDialogText(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.delete_account_confirmation),
        modifier = modifier
    )
}

@Composable
private fun DeleteDialogConfirmButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        onClick = onClick,
    ) {
        Text(stringResource(R.string.confirm))
    }
}

@Composable
private fun DeleteDialogDismissButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        type = "secondary",
        onClick = onClick,
    ) {
        Text(stringResource(R.string.cancel))
    }
}



@Composable
private fun LoadingIndicator(
    modifier: Modifier = Modifier
) {
    CircularProgressIndicator(modifier = modifier)
}

@Composable
private fun SignOutButton(
    onClick: () -> Unit,
) {
    MenuButtonItem(
        text = stringResource(R.string.sign_out),
        iconRes = R.drawable.ic_sign_out,
        onClick = onClick,
    )
}

@Composable
private fun SignOutDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        modifier = modifier,
        onDismissRequest = onDismiss,
        title = {
            SignOutDialogTitle()
        },
        text = {
            SignOutDialogText()
        },
        confirmButton = {
            SignOutDialogConfirmButton(onClick = onConfirm)
        },
        dismissButton = {
            SignOutDialogDismissButton(onClick = onDismiss)
        }
    )
}


@Composable
private fun SignOutDialogTitle(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.sign_out),
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        modifier = modifier
    )
}

@Composable
private fun SignOutDialogText(
    modifier: Modifier = Modifier
) {
    Text(
        text = stringResource(R.string.sign_out_confirmation),
        modifier = modifier
    )
}

@Composable
private fun SignOutDialogConfirmButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        onClick = onClick,
    ) {
        Text(stringResource(R.string.confirm))
    }
}

@Composable
private fun SignOutDialogDismissButton(
    onClick: () -> Unit,
) {
    Button(
        fullWidth = false,
        type = "secondary",
        onClick = onClick,
    ) {
        Text(stringResource(R.string.cancel))
    }
}





