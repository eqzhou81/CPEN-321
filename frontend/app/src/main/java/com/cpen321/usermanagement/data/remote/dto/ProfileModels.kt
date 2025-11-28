package com.cpen321.usermanagement.data.remote.dto

// ============================================
// REQUEST DTOs
// ============================================

/**
 * Matches backend UpdateProfileRequest:
 * export interface UpdateProfileRequest { name?: string; }
 */
data class UpdateProfileRequest(
    val name: String? = null
)

/**
 * Matches backend DeleteProfileRequest:
 * export interface DeleteProfileRequest { confirmDelete: boolean; }
 */
data class DeleteProfileRequest(
    val confirmDelete: Boolean
)

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Matches backend GetProfileResponse:
 * export interface GetProfileResponse {
 *   id: string;
 *   email: string;
 *   name: string;
 *   profilePicture?: string;
 *   savedJobs: string[];
 *   createdAt: string;
 *   updatedAt: string;
 * }
 */


/**
 * Matches backend UpdateProfileResponse:
 * export interface UpdateProfileResponse {
 *   success: boolean;
 *   message: string;
 *   profile: GetProfileResponse;
 * }
 * Note: profile is GetProfileResponse which is the User object directly
 */
data class UpdateProfileResponse(
    val success: Boolean,
    val message: String,
    val profile: User  // Backend returns GetProfileResponse which is the User object directly
)

data class GetProfileResponse(
    val data: ProfileData
)

data class ProfileData(
    val user: User
)
/**
 * Matches backend DeleteProfileResponse:
 * export interface DeleteProfileResponse {
 *   success: boolean;
 *   message: string;
 * }
 */
data class DeleteProfileResponse(
    val success: Boolean,
    val message: String
)

// ============================================
// SUPPORTING TYPES (internal)
// ============================================

/**
 * Lightweight representation of user profile (if you still use it internally)
 */
data class User(
    val id: String,
    val email: String,
    val name: String,
    val profilePicture: String? = null,
    val savedJobs: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)
