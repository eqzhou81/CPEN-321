package com.cpen321.usermanagement.data.remote.dto

data class ValidationError(
    val field: String,
    val message: String
)

data class ApiResponse<T>(
    val success: Boolean,                      // ✅ <-- add this
    val message: String? = null,               // Optional success/error message
    val data: T? = null,                       // Generic data payload

    // Optional fields for error handling
    val error: String? = null,
    val details: List<ValidationError>? = null
)
