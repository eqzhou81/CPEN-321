import mongoose, { Schema, Model } from 'mongoose';
import {
<<<<<<< HEAD
  Question,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../types/question.types';

// ==================== MONGOOSE SCHEMA ====================

const questionSchema = new Schema<Question>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
=======
  IQuestion,
  QuestionType,
  QuestionStatus,
  CreateQuestionRequest,
  UpdateQuestionRequest,
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
>>>>>>> e93bffa (Add questions backend logic and openai service)
    },
    tags: {
      type: [String],
      default: [],
    },
<<<<<<< HEAD
  },
  {
    collection: 'question',
  }
);

// ==================== INDEXES ====================
questionSchema.index({ name: 1 });
questionSchema.index({ tags: 1 });

// ==================== MODEL ====================
const Question: Model<Question> = mongoose.model<Question>('Question', questionSchema);

// ==================== QUESTION MODEL CLASS ====================
class QuestionModel {
  /**
   * Create a new question
   */
  async create(questionData: CreateQuestionInput): Promise<Question> {
    const question = new Question({
      name: questionData.name,
      link: questionData.link,
      tags: questionData.tags,
    });

    return await question.save();
  }

  /**
   * Find question by ID
   */
  async findById(questionId: string | mongoose.Types.ObjectId): Promise<Question | null> {
    return await Question.findById(questionId).exec();
  }
  
  /**
   * Find question by name
   */
  async findByName(name: string): Promise<Question | null> {
    return await Question.findOne({ name }).exec();
  }
  
  /**
   * Find question by tags
   */
  async findByTags(tags: string[]): Promise<Question[]> {
    return await Question.find({ tags: { $in: tags } }).exec();
  }

  /**
   * Find questions by a list of IDs
   */
  async findByIds(ids: (string | mongoose.Types.ObjectId)[]): Promise<Question[]> {
    return await Question.find({ _id: { $in: ids } }).exec();
  }

  /**
   * Update question
   */
  async update(questionId: string | mongoose.Types.ObjectId, updateData: UpdateQuestionInput): Promise<Question | null> {
    return await Question.findByIdAndUpdate(
      questionId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Get all questions
   */
  async getAll(): Promise<Question[]> {
    return await Question.find().exec();
  }
}

export const questionModel = new QuestionModel();
export { Question };
=======
    externalUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (url: string) {
          if (!url) return true;
          try {
            new URL(url);
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
        tags: questionData.tags || [],
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
    questionsData: any[]
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
      const query: any = { jobId, userId };
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
>>>>>>> e93bffa (Add questions backend logic and openai service)
