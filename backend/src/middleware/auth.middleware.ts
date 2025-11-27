import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { userModel } from '../models/user.model';
import { IUser } from '../types/users.types';
import { asyncHandler } from '../utils/asyncHandler.util';

export const authenticateToken: RequestHandler = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Local development auth bypass
    if (process.env.BYPASS_AUTH === 'true') {
      console.log('🔓 Auth bypass enabled for local development');
      
      // Create a mock user object
      req.user = {
        _id: new mongoose.Types.ObjectId(process.env.MOCK_USER_ID ?? '507f1f77bcf86cd799439011').toString(),
        email: process.env.MOCK_USER_EMAIL ?? 'test@example.com',
        name: process.env.MOCK_USER_NAME ?? 'Test User',
        googleId: 'mock-google-id',
        profilePicture: 'https://via.placeholder.com/150',
        bio: 'Test user for local development',
        hobbies: ['coding', 'testing'],
        savedJobs: [],
        savedQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as IUser | undefined;
      
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: mongoose.Types.ObjectId;
    };

    if (!decoded.id) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
      return;
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        error: 'User not found',
        message: 'Token is valid but user no longer exists',
      });
      return;
    }

    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or expired',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
      return;
    }

    next(error);
  }
});
