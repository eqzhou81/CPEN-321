package com.cpen321.usermanagement.data.remote.interceptors

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val url = originalRequest.url.toString()

        Log.d("AuthInterceptor", "🔥 INTERCEPTOR CALLED for: $url")
        Log.d("AuthInterceptor", "Request method: ${originalRequest.method}")
        Log.d("AuthInterceptor", "Request headers: ${originalRequest.headers}")

        val token = tokenProvider()
        Log.d("AuthInterceptor", "Token available: ${token != null}")
        Log.d("AuthInterceptor", "Token value: ${token?.take(15)}...")
        
        if (token == null) {
            Log.w("AuthInterceptor", "❌ No token available for request to: $url")
            return chain.proceed(originalRequest)
        }
        
        Log.d("AuthInterceptor", "✅ Adding Authorization header with token: ${token.take(15)}...")

        val newRequest = originalRequest.newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()

        Log.d("AuthInterceptor", "New request headers: ${newRequest.headers}")

        var response = chain.proceed(newRequest)
        
        Log.d("AuthInterceptor", "Response code: ${response.code} for $url")

        // Retry if error
        if (!(response.code in 200..299)) {
            Log.w("AuthInterceptor", "Request failed with code ${response.code}, retrying...")
            val retryRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            response = chain.proceed(retryRequest)
            Log.d("AuthInterceptor", "Retry response code: ${response.code}")
        }

        return response
    }
}