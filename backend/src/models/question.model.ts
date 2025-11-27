import mongoose, { FilterQuery, Model, Schema } from 'mongoose';
import {
  CreateQuestionRequest,
  IQuestion,
  QuestionStatus,
  QuestionType
} from '../types/questions.types';
import logger from '../utils/logger.util';


const questionSchema = new Schema<IQuestion>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    externalUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (url: string) {
          if (!url) return true;
          try {
            const _ = new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    status: {
      type: String,
      enum: Object.values(QuestionStatus),
      default: QuestionStatus.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'questions',
  }
);

questionSchema.index({ userId: 1, jobId: 1 });
questionSchema.index({ userId: 1, type: 1 });
questionSchema.index({ userId: 1, status: 1 });
questionSchema.index({ jobId: 1, type: 1 });


const Question: Model<IQuestion> = mongoose.model<IQuestion>('Question', questionSchema);


export class QuestionModel {
  async create(
    userId: mongoose.Types.ObjectId,
    questionData: CreateQuestionRequest
  ): Promise<IQuestion> {
    try {
      if (!questionData.jobId) {
        throw new Error('Job ID is required');
      }
      if (!questionData.title || questionData.title.trim().length === 0) {
        throw new Error('Title is required');
      }
      if (questionData.title.length > 200) {
        throw new Error('Title too long (max 200 characters)');
      }
      if (questionData.type === QuestionType.BEHAVIORAL && (!questionData.description || questionData.description.trim().length === 0)) {
        throw new Error('Description is required for behavioral questions');
      }
      if (!Object.values(QuestionType).includes(questionData.type)) {
        throw new Error('Invalid question type');
      }

      const question = new Question({
        userId,
        jobId: new mongoose.Types.ObjectId(questionData.jobId),
        type: questionData.type,
        title: questionData.title.trim(),
        description: questionData.description ? questionData.description.trim() : '',
        difficulty: questionData.difficulty,
        tags: questionData.tags ?? [],
        externalUrl: questionData.externalUrl,
      });

      return await question.save();
    } catch (error) {
      logger.error('Error creating question:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create question');
    }
  }

  async createMany(
    userId: mongoose.Types.ObjectId,
    jobId: mongoose.Types.ObjectId,
    questionsData: Omit<CreateQuestionRequest, 'jobId'>[]
  ): Promise<IQuestion[]> {
    try {
      const questions = questionsData.map((data) => ({
        ...data,
        userId,
        jobId,
      }));

      const result = await Question.insertMany(questions);
      return result as IQuestion[];
    } catch (error) {
      logger.error('Error creating multiple questions:', error);
      throw new Error('Failed to create questions');
    }
  }

  async findByJobAndType(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    type?: QuestionType
  ): Promise<IQuestion[]> {
    try {
      const query: FilterQuery<IQuestion> = { jobId, userId };
      if (type) {
        query.type = type;
      }

      return await Question.find(query).sort({ createdAt: -1 }).exec();
    } catch (error) {
      logger.error('Error finding questions by job and type:', error);
      throw new Error('Failed to find questions');
    }
  }

  async findById(
    questionId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IQuestion | null> {
    try {
      return await Question.findOne({ _id: questionId, userId }).exec();
    } catch (error) {
      logger.error('Error finding question by ID:', error);
      throw new Error('Failed to find question');
    }
  }

  async updateStatus(
    questionId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    status: QuestionStatus
  ): Promise<IQuestion | null> {
    try {
      return await Question.findOneAndUpdate(
        { _id: questionId, userId },
        { status, updatedAt: new Date() },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Error updating question status:', error);
      throw new Error('Failed to update question status');
    }
  }

  async findByJobId(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<IQuestion[]> {
    try {
      return await Question.find({ jobId, userId }).exec();
    } catch (error) {
      logger.error('Error finding questions by job ID:', error);
      throw new Error('Failed to find questions by job ID');
    }
  }

  async getProgressByJob(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<{
    technical: { total: number; completed: number };
    behavioral: { total: number; completed: number };
    overall: { total: number; completed: number };
  }> {
    try {
      const questions = await Question.find({ jobId, userId }).exec();

      const technical = questions.filter((q) => q.type === QuestionType.TECHNICAL);
      const behavioral = questions.filter((q) => q.type === QuestionType.BEHAVIORAL);

      const technicalCompleted = technical.filter((q) => q.status === QuestionStatus.COMPLETED);
      const behavioralCompleted = behavioral.filter((q) => q.status === QuestionStatus.COMPLETED);

      return {
        technical: {
          total: technical.length,
          completed: technicalCompleted.length,
        },
        behavioral: {
          total: behavioral.length,
          completed: behavioralCompleted.length,
        },
        overall: {
          total: questions.length,
          completed: technicalCompleted.length + behavioralCompleted.length,
        },
      };
    } catch (error) {
      logger.error('Error getting question progress:', error);
      throw new Error('Failed to get question progress');
    }
  }

  async deleteByJobId(
    jobId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      const result = await Question.deleteMany({ jobId, userId });
      return result.deletedCount;
    } catch (error) {
      logger.error('Error deleting questions by job ID:', error);
      throw new Error('Failed to delete questions');
    }
  }
}


export const questionModel = new QuestionModel();

export { Question };
