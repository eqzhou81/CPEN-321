package com.cpen321.usermanagement.data.remote.api

import android.util.Log
import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.remote.interceptors.AuthInterceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    // Use STAGING_BASE_URL for debug builds (tests), otherwise use production API_BASE_URL
    private val BASE_URL = if (BuildConfig.DEBUG && BuildConfig.STAGING_BASE_URL.isNotEmpty()) {
        BuildConfig.STAGING_BASE_URL
    } else {
        BuildConfig.API_BASE_URL
    }
    private const val IMAGE_BASE_URL = BuildConfig.IMAGE_BASE_URL

    // Use a mutable holder so the lambda always gets the current value
    private class TokenHolder {
        @Volatile
        var token: String? = null
    }
    
    private val tokenHolder = TokenHolder()
    
    // Test base URL override - set by tests to use MockWebServer
    @Volatile
    private var testBaseUrl: String? = null
    
    /**
     * Set test base URL (for MockWebServer injection in tests)
     * Only works in test builds
     * This recreates all service instances with the new base URL
     */
    fun setTestBaseUrl(baseUrl: String?) {
        testBaseUrl = baseUrl
        // Reset retrofit instance to use new base URL
        _retrofit = null
        // Clear lazy service instances so they're recreated with new base URL
        _authInterface = null
        _userInterface = null
        _jobApiService = null
        _questionApiService = null
        _sessionInterface = null
        _questionInterface = null
        _discussionApi = null
    }
    
    // Lazy service instances that can be reset
    @Volatile
    private var _authInterface: AuthInterface? = null
    @Volatile
    private var _userInterface: UserInterface? = null
    @Volatile
    private var _jobApiService: JobApiService? = null
    @Volatile
    private var _questionApiService: QuestionApiService? = null
    @Volatile
    private var _sessionInterface: SessionInterface? = null
    @Volatile
    private var _questionInterface: QuestionInterface? = null
    @Volatile
    private var _discussionApi: DiscussionApi? = null
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val authInterceptor = AuthInterceptor { tokenHolder.token }
    
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(8, TimeUnit.SECONDS)  // Reduced from 10s
        .readTimeout(12, TimeUnit.SECONDS)    // Reduced from 15s
        .writeTimeout(12, TimeUnit.SECONDS)   // Reduced from 15s
        .callTimeout(15, TimeUnit.SECONDS)    // Reduced from 20s
        .retryOnConnectionFailure(true)      // Auto-retry on connection failure
        .build()
    
    // Lazy retrofit instance that can be reset for tests
    @Volatile
    private var _retrofit: Retrofit? = null
    
    private val retrofit: Retrofit
        get() {
            if (_retrofit == null) {
                val baseUrl = testBaseUrl ?: BASE_URL
                _retrofit = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(httpClient)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
            }
            return _retrofit!!
        }

    val authInterface: AuthInterface
        get() {
            if (_authInterface == null) {
                _authInterface = retrofit.create(AuthInterface::class.java)
            }
            return _authInterface!!
        }

    val userInterface: UserInterface
        get() {
            if (_userInterface == null) {
                _userInterface = retrofit.create(UserInterface::class.java)
            }
            return _userInterface!!
        }
    
    val jobApiService: JobApiService
        get() {
            if (_jobApiService == null) {
                _jobApiService = retrofit.create(JobApiService::class.java)
            }
            return _jobApiService!!
        }
    
    val questionApiService: QuestionApiService
        get() {
            if (_questionApiService == null) {
                _questionApiService = retrofit.create(QuestionApiService::class.java)
            }
            return _questionApiService!!
        }
    
    val sessionInterface: SessionInterface
        get() {
            if (_sessionInterface == null) {
                _sessionInterface = retrofit.create(SessionInterface::class.java)
            }
            return _sessionInterface!!
        }
    
    val questionInterface: QuestionInterface
        get() {
            if (_questionInterface == null) {
                _questionInterface = retrofit.create(QuestionInterface::class.java)
            }
            return _questionInterface!!
        }

    val discussionApi: DiscussionApi
        get() {
            if (_discussionApi == null) {
                _discussionApi = retrofit.create(DiscussionApi::class.java)
            }
            return _discussionApi!!
        }
    fun setAuthToken(token: String?) {
        tokenHolder.token = token
        android.util.Log.d("RetrofitClient", "Auth token updated: ${if (token != null) "Set (${token.length} chars)" else "Cleared"}")
    }

    fun getPictureUri(picturePath: String): String {
        return if (picturePath.startsWith("uploads/")) {
            IMAGE_BASE_URL + picturePath
        } else {
            picturePath
        }
    }
}