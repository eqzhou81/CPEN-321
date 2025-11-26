import mongoose, { FilterQuery, Schema, Model, SortOrder } from 'mongoose';
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
    creatorName: {
      type: String,
      required: true,
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

// ==================== SIMPLE MODEL DEFINITION ====================
// FIX: Use try-catch to handle model registration safely
let Discussion: Model<IDiscussion>;

try {
  // Try to get the existing model
  Discussion = mongoose.model<IDiscussion>('Discussion');
} catch {
  // If it doesn't exist, create it
  Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema);
}

// ==================== MODEL METHODS ====================
export const discussionModel = {
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
      creatorName: userName,
      topic,
      description,
      messages: [],
      messageCount: 0,
      participantCount: 1,
      lastActivityAt: new Date(),
    });

    return await discussion.save();
  },

  /**
   * Find ALL discussions with optional search and pagination
   */
  async findAll(
    search?: string,
    sortBy: 'recent' | 'popular' = 'recent',
    limit = 20,
    skip = 0
  ): Promise<IDiscussion[]> {
    const query: FilterQuery<IDiscussion> = {};

    if (search) {
      query.$text = { $search: search };
    }

    const sort: Record<string, SortOrder> = sortBy === 'popular' 
      ? { messageCount: -1, lastActivityAt: -1 }
      : { lastActivityAt: -1 };

    return (await Discussion.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .exec()) as IDiscussion[];
  },

  /**
   * Find discussion by ID
   */
  async findById(discussionId: string): Promise<IDiscussion | null> {
    return await Discussion.findById(discussionId).exec();
  },

  /**
   * Post a message to a discussion
   */
  async postMessage(
    discussionId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<IDiscussion | null> {
    const discussion = await Discussion.findById(discussionId).exec();

    if (!discussion) return null;

    const newMessage = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      userName,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    discussion.messages.push(newMessage);
    discussion.messageCount = discussion.messages.length;
    discussion.lastActivityAt = new Date();

    const uniqueParticipants = new Set(discussion.messages.map((m) => m.userId));
    discussion.participantCount = uniqueParticipants.size;

    return await discussion.save();
  },

  /**
   * Get discussions created by a specific user
   */
  async findByUserId(userId: string, limit = 20, skip = 0): Promise<IDiscussion[]> {
    return await Discussion.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  },

  /**
   * Get total count of discussions
   */
  async count(search?: string): Promise<number> {
    const query: { $text?: { $search: string } } = {};
    if (search) {
      query.$text = { $search: search };
    }
    return await Discussion.countDocuments(query).exec();
  },

  /**
   * Get count of discussions created by user
   */
  async countByUserId(userId: string): Promise<number> {
    return await Discussion.countDocuments({ userId }).exec();
  },

  /**
   * Delete discussions by query (for testing cleanup)
   */
  async deleteMany(query: FilterQuery<IDiscussion>): Promise<unknown> {
    return await Discussion.deleteMany(query).exec();
  },

  /**
   * Find by ID and delete (for testing cleanup)
   */
  async findByIdAndDelete(id: string): Promise<IDiscussion | null> {
    return await Discussion.findByIdAndDelete(id).exec();
  }
};

export { Discussion };