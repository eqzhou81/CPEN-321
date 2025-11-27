package com.cpen321.usermanagement.di

import com.cpen321.usermanagement.data.remote.api.AuthInterface
import com.cpen321.usermanagement.data.remote.api.JobApiService
import com.cpen321.usermanagement.data.remote.api.QuestionApiService
import com.cpen321.usermanagement.data.remote.api.RetrofitClient
import com.cpen321.usermanagement.data.remote.api.SessionInterface
import com.cpen321.usermanagement.data.remote.api.UserInterface
import com.cpen321.usermanagement.data.remote.api.QuestionInterface
import com.cpen321.usermanagement.data.repository.JobRepository
import com.cpen321.usermanagement.data.repository.SessionRepository
import com.cpen321.usermanagement.data.repository.SessionRepositoryImpl
import com.cpen321.usermanagement.data.local.preferences.TokenManager
import com.cpen321.usermanagement.data.remote.api.DiscussionApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthService(): AuthInterface {
        return RetrofitClient.authInterface
    }

    @Provides
    @Singleton
    fun provideUserService(): UserInterface {
        return RetrofitClient.userInterface
    }

    @Provides
    @Singleton
    fun provideSessionService(): SessionInterface {
        return RetrofitClient.sessionInterface
    }
    
    @Provides
    @Singleton
    fun provideQuestionApiService(): QuestionApiService {
        return RetrofitClient.questionApiService
    }

    @Provides
    @Singleton
    fun provideQuestionService(): QuestionInterface {
        return RetrofitClient.questionInterface
    }

    @Provides
    @Singleton
    fun provideJobService(): JobApiService {
        return RetrofitClient.jobApiService
    }

    @Provides
    @Singleton
    fun provideJobRepository(jobApiService: JobApiService): JobRepository {
        return JobRepository(jobApiService)
    }

    @Provides
    @Singleton
    fun provideSessionRepository(sessionInterface: SessionInterface, tokenManager: TokenManager): SessionRepository {
        return SessionRepositoryImpl(sessionInterface, tokenManager)
    }

    @Provides
    @Singleton
    fun provideDiscussionApi(): DiscussionApi {
        return RetrofitClient.discussionApi
    }
}
