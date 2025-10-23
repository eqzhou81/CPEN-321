package com.cpen321.usermanagement.data.remote.interceptors

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    
    companion object {
        private const val TAG = "AuthInterceptor"
    }
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val token = tokenProvider()
        if (token == null) {
            Log.w(TAG, "No token available for request: ${originalRequest.url}")
            return chain.proceed(originalRequest)
        }
        
        Log.d(TAG, "Adding auth token to request: ${originalRequest.url}")

        val newRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()

        return chain.proceed(newRequest)
    }
}