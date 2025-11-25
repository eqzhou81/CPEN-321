import { NextFunction, Request, Response } from 'express';
import {
  CreateDiscussionRequest,
  PostMessageRequest,
  GetDiscussionsQuery,
  DiscussionListResponse,
  DiscussionDetailResponse,
  MessageResponse,
  CreateDiscussionResponse,
  PostMessageResponse,
  EmptyTopicException,
  TopicTooLongException,
  DescriptionTooLongException,
  createDiscussionSchema,
  postMessageSchema,
} from '../types/discussions.types';
import { discussionModel } from '../models/discussions.model';
import { userModel } from '../models/user.model';
import logger from '../utils/logger.util';
import { ZodError } from 'zod';

export class DiscussionsController {
  /**
   * Get ALL discussions (main browse endpoint)
   * GET /api/discussions
   * Public - shows discussions from ALL users
   */
  async getDiscussions(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, sortBy = 'recent', page = 1, limit = 20 } = req.query as GetDiscussionsQuery;

      const skip = (Number(page) - 1) * Number(limit);

      // Get ALL discussions
      const discussions = await discussionModel.findAll(
        search,
        sortBy,
        Number(limit),
        skip
      );

      const total = await discussionModel.count(search);

      // Transform to response format with creator names
      const discussionsWithCreators: DiscussionListResponse[] = await Promise.all(
        discussions.map(async (d) => {
          const creator = await userModel.findById(d.userId);
          return {
            id: d._id.toString(),
            topic: d.topic,
            description: d.description,
            creatorId: d.userId,
            creatorName: creator?.name || 'Unknown User',
            messageCount: d.messageCount,
            participantCount: d.participantCount,
            lastActivityAt: d.lastActivityAt.toISOString(),
            createdAt: d.createdAt.toISOString(),
          };
        })
      );

      res.status(200).json({
        success: true,
        data: discussionsWithCreators,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Failed to get discussions:', error);
      next(error);
    }
  }

  /**
   * Get specific discussion with ALL messages
   * GET /api/discussions/:id
   * Public - anyone can view any discussion
   */
  async getDiscussionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const discussion = await discussionModel.findById(id);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: 'Discussion not found',
        });
      }

      // Get creator info
      const creator = await userModel.findById(discussion.userId);

      const response: DiscussionDetailResponse = {
        id: discussion._id.toString(),
        topic: discussion.topic,
        description: discussion.description,
        creatorId: discussion.userId,
        creatorName: creator?.name || 'Unknown User',
        messageCount: discussion.messageCount,
        participantCount: discussion.participantCount,
        messages: discussion.messages.map((m) => ({
          id: m._id.toString(),
          userId: m.userId,
          userName: m.userName,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
        isActive: true, // Always true since we removed soft delete
        createdAt: discussion.createdAt.toISOString(),
        updatedAt: discussion.updatedAt.toISOString(),
      };

      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Failed to get discussion:', error);
      next(error);
    }
  }

  /**
   * Create a new discussion
   * POST /api/discussions
   * Requires authentication
   */
 async createDiscussion(
  req: Request<unknown, unknown, CreateDiscussionRequest>,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user!;
    const { topic, description } = req.body;

    // ✅ Validate input safely with Zod schema
    try {
      createDiscussionSchema.parse({ topic, description });
    } catch (validationError: unknown) {
      console.error("❌ Validation failed:", validationError);

      // ✅ Defensive parsing of Zod errors
      const zodError = validationError as { issues?: { message?: string }[] };
      const firstError = zodError.issues?.[0];

      const errorMessage = firstError?.message ?? 'Validation error';

      // ✅ Custom, readable error messages
      // errorMessage is always a string (either firstError?.message or 'Validation error')
      if (errorMessage.includes("required") || !topic?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Topic cannot be empty.",
          error: "EmptyTopicException",
        });
      }

      if (errorMessage.includes("100 characters")) {
        return res.status(400).json({
          success: false,
          message: "Topic cannot exceed 100 characters.",
          error: "TopicTooLongException",
        });
      }

      if (errorMessage.includes("500 characters")) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 500 characters.",
          error: "DescriptionTooLongException",
        });
      }

      // ✅ Fallback for any other validation issue
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: "ValidationError",
      });
    }

    // ✅ Create discussion if validation passed
    const discussion = await discussionModel.create(
      user._id.toString(),
      user.name,
      topic.trim(),
      description?.trim()
    );

    logger.info(`Discussion created: ${discussion._id} by user ${user._id}`);

    //emit discussion to socket 
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('newDiscussion', {
          id: discussion._id.toString(),
          topic: discussion.topic,
          description: discussion.description,
          creatorId: discussion.userId,
          creatorName: user.name,
          messageCount: discussion.messageCount,
          participantCount: discussion.participantCount,
          lastActivityAt: discussion.lastActivityAt.toISOString(),
          createdAt: discussion.createdAt.toISOString(),
        });
      }
    } catch (socketError) {
      // Log but don't fail the main request
     
    const err = socketError as Error;
    console.error('Socket.IO notification failed:', err.message);

      // Continue with successful response - this is key!
    }

    const response: CreateDiscussionResponse = {
      success: true,
      discussionId: discussion._id.toString(),
      message: "Discussion created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    
    // ✅ Fallback for unhandled server errors
    logger.error("Failed to create discussion:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating discussion.",
      error: "InternalServerError",
    });
  }
}


  /**
   * Post a message to a discussion
   * POST /api/discussions/:id/messages
   * Requires authentication - but anyone can post to ANY discussion (Reddit-style)
   */
  async postMessage(
    req: Request<{ id: string }, unknown, PostMessageRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { content } = req.body;

      // Validate message content
      postMessageSchema.parse({ content });

      const discussion = await discussionModel.findById(id);

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: 'Discussion not found',
        });
      }

      // NO ownership check - anyone can post to any discussion!

      // Post message
      const updatedDiscussion = await discussionModel.postMessage(
        id,
        user._id.toString(),
        user.name,
        content.trim()
      );

      if (!updatedDiscussion) {
        return res.status(500).json({
          success: false,
          message: 'Failed to post message',
        });
      }

      // Get the newly created message
      const newMessage = updatedDiscussion.messages[updatedDiscussion.messages.length - 1];

      const messageResponse: MessageResponse = {
        id: newMessage._id.toString(),
        userId: newMessage.userId,
        userName: newMessage.userName,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
        updatedAt: newMessage.updatedAt.toISOString(),
      };

      const response: PostMessageResponse = {
        success: true,
        message: messageResponse,
      };

      try {
      const io = req.app.get('io');
      io?.to(id).emit('messageReceived', messageResponse);
    } catch (socketError) {
      console.error('Socket.IO emit failed:', socketError);
      
    }

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to post message:', error);
      next(error);
    }
  }

  /**
   * Get discussions created by the authenticated user
   * GET /api/discussions/my/discussions
   * Requires authentication
   */
  async getMyDiscussions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const discussions = await discussionModel.findByUserId(
        user._id.toString(),
        Number(limit),
        skip
      );

      const total = await discussionModel.countByUserId(user._id.toString());

      const response: DiscussionListResponse[] = discussions.map((d) => ({
        id: d._id.toString(),
        topic: d.topic,
        description: d.description,
        creatorId: d.userId,
        creatorName: user.name,
        messageCount: d.messageCount,
        participantCount: d.participantCount,
        lastActivityAt: d.lastActivityAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: response,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Failed to get user discussions:', error);
      next(error);
    }
  }



  // NO DELETE METHOD - discussions are permanent like Reddit!
}