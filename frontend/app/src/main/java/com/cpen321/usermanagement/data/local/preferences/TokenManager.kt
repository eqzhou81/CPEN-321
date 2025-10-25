package com.cpen321.usermanagement.data.local.preferences

import android.content.Context
import android.util.Log
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

class TokenManager(private val context: Context) {

    companion object {
        private const val TAG = "TokenManager"
    }

    private val tokenKey = stringPreferencesKey("auth_token")

    suspend fun saveToken(token: String) {
        try {
            Log.d(TAG, "💾 Saving token to storage: ${token.take(15)}...")
            context.dataStore.edit { preferences ->
                preferences[tokenKey] = token
            }
            Log.d(TAG, "✅ Token saved successfully to DataStore")
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while saving token", e)
            throw e
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied to save token", e)
            throw e
        }
    }

    fun getToken(): Flow<String?> {
        return try {
            context.dataStore.data.map { preferences ->
                preferences[tokenKey]
            }
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting token flow", e)
            throw e
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied to get token flow", e)
            throw e
        }
    }

    suspend fun getTokenSync(): String? {
        return try {
            Log.d(TAG, "🔍 Retrieving token from storage...")
            val token = context.dataStore.data.first()[tokenKey]
            Log.d(TAG, "📱 Token retrieved from storage: ${token?.take(15)}...")
            token
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while getting token synchronously", e)
            null
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied to get token synchronously", e)
            null
        }
    }

    suspend fun clearToken() {
        try {
            Log.d(TAG, "🗑️ Clearing token from storage")
            context.dataStore.edit { preferences ->
                preferences.remove(tokenKey)
            }
            Log.d(TAG, "✅ Token cleared successfully")
        } catch (e: java.io.IOException) {
            Log.e(TAG, "IO error while clearing token", e)
            throw e
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied to clear token", e)
            throw e
        }
    }
    
    // Debug method to check token status
    suspend fun debugTokenStatus() {
        try {
            val token = context.dataStore.data.first()[tokenKey]
            Log.d(TAG, "🔍 DEBUG - Token in storage: ${token?.take(15)}...")
            Log.d(TAG, "🔍 DEBUG - Token exists: ${token != null}")
        } catch (e: Exception) {
            Log.e(TAG, "Error checking token status", e)
        }
    }
}
