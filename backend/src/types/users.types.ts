import mongoose, { Document } from 'mongoose';
// ============================================
// users.types.ts
// ============================================
import { z } from 'zod';

// ==================== USER MODEL INTERFACE ====================
// Represents the User document in MongoDB
export interface IUser extends Document {
  _id: string;
  googleId: string;                    // Google OAuth ID
  email: string;
  name: string;
  savedJobs: string[];                 // Array of job IDs (references user's jobs collection)
  createdAt: Date;
  updatedAt: Date;
}

// ==================== REQUEST TYPES ====================

// Get Profile - No request body needed (uses authenticated user from token)
export interface GetProfileRequest {
  // Empty - user ID comes from JWT token via authenticateToken middleware
}

// Update Profile Request
export interface UpdateProfileRequest {
  name?: string;
}

// Delete Profile Request
export interface DeleteProfileRequest {
  confirmDelete: boolean;               // Require explicit confirmation
}

// ==================== RESPONSE TYPES ====================

// Profile Response (what gets sent back to client)
export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  savedJobs: string[];                  // Array of job IDs
  createdAt: string;                    // ISO date string
  updatedAt: string;                    // ISO date string
}

// Delete Response
export interface DeleteProfileResponse {
  success: boolean;
  message: string;
}

// Update Response
export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile: ProfileResponse;
}

// ==================== VALIDATION SCHEMAS ====================

// Update Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).strict(); // Reject any additional properties

// Delete Profile Schema
export const deleteProfileSchema = z.object({
  confirmDelete: z.literal(true), // Must be exactly true
}).strict();

// ==================== TYPE EXPORTS FOR VALIDATION ====================

// Extract TypeScript type from Zod schema (useful for consistency)
export type UpdateProfileRequestValidated = z.infer<typeof updateProfileSchema>;
export type DeleteProfileRequestValidated = z.infer<typeof deleteProfileSchema>;

// ==================== UTILITY TYPES ====================

// Represents the user stored in JWT token payload
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;                          // Issued at (timestamp)
  exp: number;                          // Expiration (timestamp)
}

// Extended Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// ==================== HELPER TYPES ====================

// For creating a new user (from Google OAuth)
export interface CreateUserInput {
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
}

// For updating user in database (internal use)
export interface UpdateUserInput {
  name?: string;
  updatedAt: Date;
}

// For adding/removing saved jobs (internal use)
export interface AddSavedJobInput {
  userId: string;
  jobId: string;
}

export interface RemoveSavedJobInput {
  userId: string;
  jobId: string;
}