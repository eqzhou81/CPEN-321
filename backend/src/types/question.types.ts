import type { Document } from 'mongoose';
// ============================================
// question.types.ts
// ============================================
import { z } from 'zod';

// ==================== QUESTION MODEL INTERFACE ====================
// Represents the Question document in MongoDB
export interface Question extends Document {
  _id: string;
  name: string;
  link: string;
  // canonical external url
  url?: string;
  // difficulty label
  difficulty?: string;
  tags: string[];
}

// ==================== REQUEST TYPES ====================

// Get Question - No request body needed
export interface GetQuestionRequest {
    id: string;
}

// Update Question Request
export interface UpdateQuestionRequest {
  name?: string;
  link?: string;
  tags?: string[];
  url?: string;
  difficulty?: string;
}

// ==================== RESPONSE TYPES ====================

// Question Response (what gets sent back to client)
export interface GetQuestionResponse {
  id: string;
  name: string;
  link: string;
  url?: string;
  difficulty?: string;
  tags: string[];
}

// Update Response
// TODO: might not need to return question here
export interface UpdateQuestionResponse {
  success: boolean;
  message: string;
  question: GetQuestionResponse;
}

// ==================== VALIDATION SCHEMAS ====================

// Update Question Schema
export const updateQuestionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  link: z.string().min(1).max(200).optional(),
  tags: z.array(z.string()).min(1).optional(),
  url: z.string().url().optional(),
  difficulty: z.string().optional(),
}).strict(); // Reject any additional properties

// Create Question Schema
export const createQuestionSchema = z.object({
  name: z.string().min(1).max(100),
  // If you want strict URL validation, replace with z.string().url()
  link: z.string().min(1).max(200),
  // Default to [] if not provided
  tags: z.array(z.string()).default([]),
  url: z.string().url().optional(),
  difficulty: z.string().optional(),
}).strict();

// ==================== TYPE EXPORTS FOR VALIDATION ====================
export type CreateQuestionRequestValidated = z.infer<typeof createQuestionSchema>;

// ==================== UTILITY TYPES ====================

// ==================== HELPER TYPES ====================

// For creating a new question
export interface CreateQuestionInput {
  name: string;
  link: string;
  tags: string[];
  url?: string;
  difficulty?: string;
}

// For updating questions in database (internal use)
export interface UpdateQuestionInput {
  name?: string;
  link?: string;
  tags?: string[];
  url?: string;
  difficulty?: string;
}