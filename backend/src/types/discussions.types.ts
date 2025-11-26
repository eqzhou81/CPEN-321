import { Document } from 'mongoose';
import { z } from 'zod';
// ==================== DISCUSSION MODEL INTERFACE ====================
export interface IDiscussion extends Document {
  _id: string;
  userId: string;                      // Creator's user ID
  topic: string;                       // e.g., "Amazon SDE Interview"
  description?: string;                // Optional description
  messages: IMessage[];
  messageCount: number;
  participantCount: number;
  lastActivityAt: Date;
  isActive: boolean;
  creatorName?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  userId: string;
  userName: string;                    // Denormalized for performance
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== REQUEST TYPES ====================

export interface CreateDiscussionRequest {
  topic: string;                       // Max 100 characters
  description?: string;                // Max 500 characters
}

export interface PostMessageRequest {
  content: string;
}

export interface GetDiscussionsQuery {
  search?: string;                     // Search in topic/description
  sortBy?: 'recent' | 'popular';       // Sort by activity or message count
  page?: number;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface DiscussionListResponse {
  id: string;
  topic: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  messageCount: number;
  participantCount: number;
  lastActivityAt: string;
  createdAt: string;
}

export interface DiscussionDetailResponse {
  id: string;
  topic: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  messageCount: number;
  participantCount: number;
  messages: MessageResponse[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionResponse {
  success: boolean;
  discussionId: string;
  message: string;
}

export interface PostMessageResponse {
  success: boolean;
  message: MessageResponse;
}

// ==================== VALIDATION SCHEMAS ====================


export const createDiscussionSchema = z.object({
  topic: z.string()
    .min(1, 'Discussion topic is required. Please enter a topic title.')
    .max(100, 'Topic title is too long. Please keep it under 100 characters.'),
  description: z.string()
    .max(500, 'Description is too long. Please keep it under 500 characters.')
    .optional(),
}).strict();

export const postMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(2000, 'Message is too long. Please keep it under 2000 characters.'),
}).strict();

// ==================== ERROR TYPES ====================

export class EmptyTopicException extends Error {
  constructor() {
    super('Discussion topic is required. Please enter a topic title.');
    this.name = 'EmptyTopicException';
  }
}

export class TopicTooLongException extends Error {
  constructor() {
    super('Topic title is too long. Please keep it under 100 characters.');
    this.name = 'TopicTooLongException';
  }
}

export class DescriptionTooLongException extends Error {
  constructor() {
    super('Description is too long. Please keep it under 500 characters.');
    this.name = 'DescriptionTooLongException';
  }
}