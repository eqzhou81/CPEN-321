import { NextFunction, Request, Response } from 'express';

import {
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  DeleteProfileResponse,
  DeleteProfileRequest,
  IUser,
} from '../types/users.types';
import logger from '../utils/logger.util';
import { userModel } from '../models/user.model';

export class UserController {
  // Helper method to transform IUser to GetProfileResponse
  private transformUserToResponse(user: IUser): GetProfileResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      savedJobs: user.savedJobs,
      savedQuestions: user.savedQuestions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getProfile(req: Request, res: Response<{ data: { user: GetProfileResponse } }>): Promise<void> {
    const user = req.user!;

    const profileResponse = this.transformUserToResponse(user);

    res.status(200).json({
      data: {
        user: profileResponse
      }
    });
  }

  async updateProfile(
    req: Request<unknown, unknown, UpdateProfileRequest>,
    res: Response<UpdateProfileResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;

      const updatedUser = await userModel.update(user._id, req.body);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          profile: this.transformUserToResponse(user),
        });
      }

      res.status(200).json({
        success: true,
        message: 'User info updated successfully',
        profile: this.transformUserToResponse(updatedUser),
      });
    } catch (error) {
      logger.error('Failed to update user info:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to update user info',
          profile: this.transformUserToResponse(req.user!),
        });
      }
      
      next(error); 
    }
  }

  async deleteProfile(
    req: Request<unknown, unknown, DeleteProfileRequest>,
    res: Response<DeleteProfileResponse>,
    next: NextFunction
  ) {
    try {
      const user = req.user!;

      // // Validate confirmation
      // if (!confirmDelete) {
      //   console.log('❌ Controller returning 400');
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Delete confirmation required',
      //   });
      // }


      // Delete user from database
      await userModel.delete(user._id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete user:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to delete user',
        });
      }

      next(error);
    }
  }
}