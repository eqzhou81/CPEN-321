import mongoose, { Schema, Model } from 'mongoose';
import {
  Question,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../types/question.types';

// ==================== MONGOOSE SCHEMA ====================

const questionSchema = new Schema<Question & { url?: string; difficulty?: string }>(
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
    },
    // Optional canonical URL (external reference)
    url: {
      type: String,
      required: false,
      trim: true,
    },
    // Optional difficulty level (e.g. Easy, Medium, Hard)
    difficulty: {
      type: String,
      required: false,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
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
   * Find question by canonical url
   */
  async findByUrl(url: string): Promise<Question | null> {
    return await Question.findOne({ url }).exec();
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