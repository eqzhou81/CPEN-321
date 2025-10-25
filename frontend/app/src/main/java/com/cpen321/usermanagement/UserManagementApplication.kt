package com.cpen321.usermanagement

import android.app.Application
import android.util.Log
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class UserManagementApplication : Application() {
    
    @Inject
    lateinit var tokenManager: TokenManager
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize token in RetrofitClient on app startup
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                Log.d("UserManagementApplication", "🔄 Starting token initialization")
                val token = tokenManager.getTokenSync()
                Log.d("UserManagementApplication", "Retrieved token from storage: ${token?.take(15)}...")
                
                if (token != null) {
                    RetrofitClient.setAuthToken(token)
                    Log.d("UserManagementApplication", "✅ Token initialized on app startup: ${token.take(15)}...")
                    
                    // Verify token is set
                    val currentToken = RetrofitClient.getCurrentToken()
                    Log.d("UserManagementApplication", "Current token in RetrofitClient: ${currentToken?.take(15)}...")
                } else {
                    Log.d("UserManagementApplication", "No stored token found")
                }
            } catch (e: Exception) {
                Log.e("UserManagementApplication", "Failed to initialize token", e)
            }
        }
    }
}
