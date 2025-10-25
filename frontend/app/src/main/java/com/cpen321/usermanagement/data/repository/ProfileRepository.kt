package com.cpen321.usermanagement.data.repository

import android.net.Uri
import com.cpen321.usermanagement.data.remote.dto.User
import android.health.connect.datatypes.ExerciseRoute.Location
import com.cpen321.usermanagement.data.model.MyLocation
import com.google.android.libraries.places.api.model.Place


interface ProfileRepository {
    suspend fun getProfile(): Result<User>







}