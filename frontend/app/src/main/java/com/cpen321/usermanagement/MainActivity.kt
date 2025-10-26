package com.cpen321.usermanagement

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.cpen321.usermanagement.ui.navigation.AppNavigation
import com.cpen321.usermanagement.ui.navigation.Navigation
import com.cpen321.usermanagement.ui.screens.AuthScreen
import com.cpen321.usermanagement.ui.screens.LoadingScreen
import com.cpen321.usermanagement.ui.screens.MainAppScreen
import com.cpen321.usermanagement.ui.theme.ProvideFontSizes
import com.cpen321.usermanagement.ui.theme.ProvideSpacing
import com.cpen321.usermanagement.ui.theme.UserManagementTheme
import com.cpen321.usermanagement.ui.viewmodels.AuthViewModel
import com.cpen321.usermanagement.ui.viewmodels.ProfileViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        // Store the result and notify the callback
        googleSignInResult = result.data
        notifyResult(result.data)
    }
    
    companion object {
        var googleSignInResult: Intent? = null
        private var launcher: androidx.activity.result.ActivityResultLauncher<Intent>? = null
        private var onResultCallback: ((Intent?) -> Unit)? = null
        
        fun setLauncher(launcher: androidx.activity.result.ActivityResultLauncher<Intent>) {
            this.launcher = launcher
        }
        
        fun setResultCallback(callback: (Intent?) -> Unit) {
            this.onResultCallback = callback
        }
        
        fun launchGoogleSignIn(intent: Intent) {
            launcher?.launch(intent)
        }
        
        fun notifyResult(result: Intent?) {
            onResultCallback?.invoke(result)
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Register the launcher
        setLauncher(googleSignInLauncher)
        
        setContent {
            UserManagementTheme {
                UserManagementApp()
            }
        }
    }
}

@Composable
fun UserManagementApp() {
    ProvideSpacing {
        ProvideFontSizes {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                AppNavigation()
            }
        }
    }
}
