package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.remote.interceptors.AuthInterceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import android.util.Log

object RetrofitClient {
    private const val BASE_URL = BuildConfig.API_BASE_URL
    private const val IMAGE_BASE_URL = BuildConfig.IMAGE_BASE_URL

    private var authToken: String? = null

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = AuthInterceptor { 
        Log.d("RetrofitClient", "AuthInterceptor getting token: ${authToken?.take(15)}...")
        Log.d("RetrofitClient", "Current authToken variable: $authToken")
        authToken 
    }

    private val httpClient: OkHttpClient by lazy {
        Log.d("RetrofitClient", "🔧 Creating httpClient with interceptors")
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Log.d("RetrofitClient", "🔧 Creating retrofit instance with baseUrl: $BASE_URL")
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    // All APIs use the same retrofit instance
    val discussionApi: DiscussionApi by lazy { 
        Log.d("RetrofitClient", "🔧 Creating DiscussionApi")
        retrofit.create(DiscussionApi::class.java) 
    }
    val authInterface: AuthInterface by lazy { 
        Log.d("RetrofitClient", "🔧 Creating AuthInterface")
        retrofit.create(AuthInterface::class.java) 
    }
    val userInterface: UserInterface by lazy { 
        Log.d("RetrofitClient", "🔧 Creating UserInterface")
        retrofit.create(UserInterface::class.java) 
    }
    val jobApiService: JobApiService by lazy { 
        Log.d("RetrofitClient", "🔧 Creating JobApiService")
        retrofit.create(JobApiService::class.java) 
    }
    val questionApiService: QuestionApiService by lazy { 
        Log.d("RetrofitClient", "🔧 Creating QuestionApiService")
        retrofit.create(QuestionApiService::class.java) 
    }




    val imageInterface: ImageInterface by lazy { retrofit.create(ImageInterface::class.java) }
    fun setAuthToken(token: String?) {
        Log.d("RetrofitClient", "🔄 Setting auth token: ${token?.take(15)}...")
        Log.d("RetrofitClient", "Previous token was: ${authToken?.take(15)}...")
        authToken = token
        Log.d("RetrofitClient", "✅ Auth token set successfully: ${token?.take(15)}...")
        Log.d("RetrofitClient", "Token is now: ${if (token != null) "available" else "null"}")
        
        // Verify the token is actually set
        val currentToken = getCurrentToken()
        Log.d("RetrofitClient", "Verification - current token: ${currentToken?.take(15)}...")
    }
    
    fun hasToken(): Boolean {
        return authToken != null
    }
    
    fun getCurrentToken(): String? {
        return authToken
    }

    fun getPictureUri(picturePath: String): String {
        return if (picturePath.startsWith("uploads/")) {
            IMAGE_BASE_URL + picturePath
        } else {
            picturePath
        }
    }
}
