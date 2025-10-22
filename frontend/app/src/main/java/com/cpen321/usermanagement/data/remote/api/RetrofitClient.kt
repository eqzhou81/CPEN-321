package com.cpen321.usermanagement.data.remote.api

import com.cpen321.usermanagement.BuildConfig
import com.cpen321.usermanagement.data.remote.interceptors.AuthInterceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = BuildConfig.API_BASE_URL
    private const val IMAGE_BASE_URL = BuildConfig.IMAGE_BASE_URL

    private var authToken: String? = null

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = AuthInterceptor { authToken }

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(httpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val authInterface: AuthInterface by lazy { retrofit.create(AuthInterface::class.java) }
    val imageInterface: ImageInterface by lazy { retrofit.create(ImageInterface::class.java) }
    val userInterface: UserInterface by lazy { retrofit.create(UserInterface::class.java) }
    val hobbyInterface: HobbyInterface by lazy { retrofit.create(HobbyInterface::class.java) }
    val jobApiService: JobApiService by lazy { retrofit.create(JobApiService::class.java) }
    val questionApiService: QuestionApiService by lazy { retrofit.create(QuestionApiService::class.java) }

    val discussionApi : DiscussionApi by lazy {retrofit.create(DiscussionApi::class.java)}



    fun setAuthToken(token: String?) {
        authToken = token
    }

    fun getPictureUri(picturePath: String): String {
        return if (picturePath.startsWith("uploads/")) {
            IMAGE_BASE_URL + picturePath
        } else {
            picturePath
        }
    }
}