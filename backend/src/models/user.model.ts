import mongoose, { Schema, Model } from 'mongoose';

import {
  AddSavedJobInput,
  AddSavedQuestionInput,
  CreateUserInput,
  IUser,
  RemoveSavedJobInput,
  RemoveSavedQuestionInput,
  UpdateUserInput,
} from '../types/users.types';

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    savedJobs: {
      type: [String],
      default: [],
    },
    savedQuestions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
    collection: 'users',
  }
);

// ==================== INDEXES ====================
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

// ==================== MODEL ====================
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

// ==================== USER MODEL CLASS ====================
class UserModel {
  /**
   * Create a new user (typically from Google OAuth)
   */
  async create(userData: CreateUserInput): Promise<IUser> {
    const user = new User({
      googleId: userData.googleId,
      email: userData.email,
      name: userData.name,
      savedJobs: [],
    });

    return await user.save();
  }

  /**
   * Find user by ID
   */
  async findById(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return await User.findById(userId).exec();
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return await User.findOne({ googleId }).exec();
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Update user profile
   */
  async update(userId: string, updateData: UpdateUserInput): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Delete user by ID
   */
  async delete(userId: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(userId).exec();
    return result !== null;
  }

  /**
   * Add a job to user's saved jobs
   */
  async addSavedJob(input: AddSavedJobInput): Promise<IUser | null> {
    const { userId, jobId } = input;

    return await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { savedJobs: jobId }, // $addToSet prevents duplicates
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Remove a job from user's saved jobs
   */
  async removeSavedJob(input: RemoveSavedJobInput): Promise<IUser | null> {
    const { userId, jobId } = input;

    return await User.findByIdAndUpdate(
      userId,
      {
        $pull: { savedJobs: jobId },
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Check if a job is saved by user
   */
  async isJobSaved(userId: string, jobId: string): Promise<boolean> {
    const user = await User.findById(userId).select('savedJobs').exec();
    return user ? user.savedJobs.includes(jobId) : false;
  }

  /**
   * Get user's saved jobs
   */
  async getSavedJobs(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('savedJobs').exec();
    return user ? user.savedJobs : [];
  }

  /**
   * Get user's saved questions
   */
  async getSavedQuestions(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('savedQuestions').exec();
    return user ? user.savedQuestions : [];
  }

  /**
   * Add a question to user's saved questions
   */
  async addSavedQuestion(input: AddSavedQuestionInput): Promise<IUser | null> {
    const { userId, questionId } = input;

    return await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { savedQuestions: questionId }, // $addToSet prevents duplicates
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Remove a question from user's saved questions
   */
  async removeSavedQuestion(input: RemoveSavedQuestionInput): Promise<IUser | null> {
    const { userId, questionId } = input;

    return await User.findByIdAndUpdate(
      userId,
      {
        $pull: { savedQuestions: questionId },
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  /**
   * Find or create user (useful for OAuth)
   */
  async findOrCreate(userData: CreateUserInput): Promise<IUser> {
    let user = await this.findByGoogleId(userData.googleId);

    if (!user) {
      user = await this.create(userData);
    }

    return user;
  }

  /**
   * Get all users (admin functionality)
   */
  async findAll(limit = 50, skip = 0): Promise<IUser[]> {
    return await User.find()
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    return await User.countDocuments().exec();
  }

  /**
   * Check if user exists by ID
   */
  async exists(userId: string): Promise<boolean> {
    const count = await User.countDocuments({ _id: userId }).exec();
    return count > 0;
  }
}

// ==================== EXPORT ====================
export const userModel = new UserModel();
export { User };
