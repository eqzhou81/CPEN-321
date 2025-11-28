import mongoose, { Document, Model, Schema, UpdateQuery } from 'mongoose';
import logger from '../utils/logger.util';

// Connection states enum (matches mongoose connection readyState values)
enum ConnectionStates {
  disconnected = 0,
  connected = 1,
  connecting = 2,
  disconnecting = 3
}

// Session status enum
export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

// Session interface
export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  questionIds: mongoose.Types.ObjectId[];
  currentQuestionIndex: number;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  answeredQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

// Session schema
const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: true,
      index: true,
    },
    questionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    }],
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.ACTIVE,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    answeredQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
sessionSchema.index({ userId: 1, jobId: 1 });
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual for progress percentage
sessionSchema.virtual('progressPercentage').get(function(this: ISession) {
  return this.totalQuestions > 0 ? Math.round((this.answeredQuestions / this.totalQuestions) * 100) : 0;
});

// Virtual for current question
sessionSchema.virtual('currentQuestion').get(function(this: ISession) {
  return this.currentQuestionIndex < this.questionIds.length ? this.questionIds[this.currentQuestionIndex] : null;
});

// Virtual for remaining questions
sessionSchema.virtual('remainingQuestions').get(function(this: ISession) {
  return this.totalQuestions - this.answeredQuestions;
});

const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);

export class SessionModel {
  // Create a new mock interview session
  async create(
    userId: mongoose.Types.ObjectId,
    jobId: mongoose.Types.ObjectId,
    questionIds?: mongoose.Types.ObjectId[]
  ): Promise<ISession> {
    try {
      if (!questionIds || questionIds.length === 0) {
        throw new Error('At least one question is required to start a session');
      }

      // Check if there's already an active session for this job
      const existingSession = await this.findActiveByJobId(jobId, userId);
      if (existingSession) {
        throw new Error('An active session already exists for this job. Please complete or cancel it first.');
      }

      const session = new Session({
        userId,
        jobId,
        questionIds,
        totalQuestions: questionIds.length,
        currentQuestionIndex: 0,
        answeredQuestions: 0,
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
      });

      return await session.save();
    } catch (error) {
      logger.error('Error creating session:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create session');
    }
  }

  // Find session by ID
  async findById(sessionId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<ISession | null> {
    try {
      return await Session.findOne({ _id: sessionId, userId })
        .populate('questionIds')
        .exec();
    } catch (error) {
      logger.error('Error finding session by ID:', error);
      throw new Error('Failed to find session');
    }
  }

  // Find active session by job ID
  async findActiveByJobId(jobId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<ISession | null> {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database connection is not ready');
      }

      return await Session.findOne({
        jobId,
        userId,
        status: SessionStatus.ACTIVE
      })
        .populate('questionIds')
        .exec();
    } catch (error) {
      logger.error('Error finding active session:', error);
      throw new Error('Failed to find active session');
    }
  }

  // Get all sessions for a user
  async findByUserId(userId: mongoose.Types.ObjectId, limit = 20): Promise<ISession[]> {
    try {
      return await Session.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('questionIds')
        .exec();
    } catch (error) {
      logger.error('Error finding sessions by user ID:', error);
      throw new Error('Failed to find sessions');
    }
  }

  // Update session progress
  async updateProgress(
    sessionId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    answeredQuestions: number,
    currentQuestionIndex?: number
  ): Promise<ISession | null> {
    try {
      const updateData: UpdateQuery<ISession> = { answeredQuestions };
      
      if (currentQuestionIndex !== undefined) {
        updateData.currentQuestionIndex = currentQuestionIndex;
      }

      return (await Session.findOneAndUpdate(
        { _id: sessionId, userId },
        updateData,
        { new: true }
      ).populate('questionIds').exec()) as ISession | null;
    } catch (error) {
      logger.error('Error updating session progress:', error);
      throw new Error('Failed to update session progress');
    }
  }

  // Move to next question
  async moveToNextQuestion(sessionId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<ISession | null> {
    try {
      const session = await this.findById(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      const nextIndex = session.currentQuestionIndex + 1;
      const answeredQuestions = session.answeredQuestions + 1;

      // Check if session should be completed
      let status = session.status;
      let completedAt = session.completedAt;

      if (nextIndex >= session.totalQuestions) {
        status = SessionStatus.COMPLETED;
        completedAt = new Date();
      }

      return await Session.findOneAndUpdate(
        { _id: sessionId, userId },
        {
          currentQuestionIndex: nextIndex,
          answeredQuestions,
          status,
          completedAt,
        },
        { new: true }
      ).populate('questionIds').exec();
    } catch (error) {
      logger.error('Error moving to next question:', error);
      throw new Error('Failed to move to next question');
    }
  }

  // Navigate to specific question index (for Previous/Next navigation)
  async navigateToQuestion(
    sessionId: mongoose.Types.ObjectId, 
    userId: mongoose.Types.ObjectId, 
    questionIndex: number
  ): Promise<ISession | null> {
    try {
      const session = await this.findById(sessionId, userId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Validate question index
      if (questionIndex < 0 || questionIndex >= session.totalQuestions) {
        throw new Error('Invalid question index');
      }

      return await Session.findOneAndUpdate(
        { _id: sessionId, userId },
        { currentQuestionIndex: questionIndex },
        { new: true }
      ).populate('questionIds').exec();
    } catch (error) {
      logger.error('Error navigating to question:', error);
      
      // Preserve specific error messages for controller handling
      if (error instanceof Error) {
        if (error.message === 'Session not found' || error.message === 'Invalid question index') {
          throw error; // Re-throw specific errors as-is
        }
      }
      
      // Only throw generic error for unexpected errors
      throw new Error('Failed to navigate to question');
    }
  }

  // Update session status
  async updateStatus(
    sessionId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    status: SessionStatus
  ): Promise<ISession | null> {
    try {
      const updateData: UpdateQuery<ISession> = { status };
      
      if (status === SessionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      return (await Session.findOneAndUpdate(
        { _id: sessionId, userId },
        updateData,
        { new: true }
      ).populate('questionIds').exec()) as ISession | null;
    } catch (error) {
      logger.error('Error updating session status:', error);
      throw new Error('Failed to update session status');
    }
  }

  // Get session statistics
  async getSessionStats(userId: mongoose.Types.ObjectId): Promise<{
    total: number;
    completed: number;
    active: number;
    averageProgress: number;
  }> {
    try {
      const sessions = await Session.find({ userId }).exec();
      
      const total = sessions.length;
      const completed = sessions.filter(s => s.status === SessionStatus.COMPLETED).length;
      const active = sessions.filter(s => s.status === SessionStatus.ACTIVE).length;
      
      const totalProgress = sessions.reduce((sum, session) => {
        return sum + (session.totalQuestions > 0 ? (session.answeredQuestions / session.totalQuestions) * 100 : 0);
      }, 0);
      
      const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;

      return {
        total,
        completed,
        active,
        averageProgress,
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      throw new Error('Failed to get session statistics');
    }
  }

  // Delete session
  async delete(sessionId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await Session.deleteOne({ _id: sessionId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }
}

export const sessionModel = new SessionModel();
