import mongoose, { Schema, Model } from 'mongoose';
import { IDiscussion, IMessage } from '../types/discussions.types';

// ==================== MESSAGE SCHEMA ====================
const messageSchema = new Schema<IMessage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== DISCUSSION SCHEMA ====================
const discussionSchema = new Schema<IDiscussion>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
      index: 'text',
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
      index: 'text',
    },
    messages: [messageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    participantCount: {
      type: Number,
      default: 1,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: -1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and sorting
discussionSchema.index({ topic: 'text', description: 'text' });
discussionSchema.index({ lastActivityAt: -1 });
discussionSchema.index({ messageCount: -1 });
discussionSchema.index({ createdAt: -1 });

const Discussion: Model<IDiscussion> = mongoose.model<IDiscussion>('Discussion', discussionSchema);

// ==================== DISCUSSION MODEL CLASS ====================
class DiscussionModel {
  /**
   * Create a new discussion
   */
  async create(
    userId: string,
    userName: string,
    topic: string,
    description?: string
  ): Promise<IDiscussion> {
    const discussion = new Discussion({
      userId,
      topic,
      description,
      messages: [],
      messageCount: 0,
      participantCount: 1,
      lastActivityAt: new Date(),
    });

    return await discussion.save();
  }

  /**
   * Find ALL discussions with optional search and pagination
   * This is the main browse endpoint - shows discussions from ALL users
   */
  async findAll(
    search?: string,
    sortBy: 'recent' | 'popular' = 'recent',
    limit = 20,
    skip = 0
  ): Promise<IDiscussion[]> {
    const query: any = {}; // No filters - show ALL discussions!

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Determine sort order
    const sort: any = sortBy === 'popular' 
      ? { messageCount: -1, lastActivityAt: -1 }  // Popular: most messages first
      : { lastActivityAt: -1 };                    // Recent: newest activity first

    return await Discussion.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Find discussion by ID
   */
  async findById(discussionId: string): Promise<IDiscussion | null> {
    return await Discussion.findById(discussionId).exec();
  }

  /**
   * Post a message to a discussion
   * Anyone can post to any discussion - no ownership checks
   */
  async postMessage(
    discussionId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<IDiscussion | null> {
    const discussion = await Discussion.findById(discussionId).exec();

    if (!discussion) return null;

    // Create new message
    const newMessage: IMessage = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      userName,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add message to discussion
    discussion.messages.push(newMessage);
    discussion.messageCount = discussion.messages.length;
    discussion.lastActivityAt = new Date();

    // Update participant count (unique users who posted)
    const uniqueParticipants = new Set(discussion.messages.map((m) => m.userId));
    discussion.participantCount = uniqueParticipants.size;

    return await discussion.save();
  }

  /**
   * Get discussions created by a specific user
   * For "My Discussions" view
   */
  async findByUserId(userId: string, limit = 20, skip = 0): Promise<IDiscussion[]> {
    return await Discussion.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }


  /**
   * Search discussions by query string
   * Searches in both topic and description
   */
  async search(query: string, limit = 20, skip = 0): Promise<IDiscussion[]> {
    return await Discussion.find({
      $text: { $search: query },
    })
      .sort({ score: { $meta: 'textScore' }, lastActivityAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

   /**
   * Get total count of discussions
   * Used for pagination
   */
  async count(search?: string): Promise<number> {
    const query: any = {};
    if (search) {
      query.$text = { $search: search };
    }
    return await Discussion.countDocuments(query).exec();
  }

  /**
   * Get count of discussions created by user
   */
  async countByUserId(userId: string): Promise<number> {
    return await Discussion.countDocuments({ userId }).exec();
  }



  // NO DELETE METHOD - discussions are permanent like Reddit!
}

export const discussionModel = new DiscussionModel();
export { Discussion };