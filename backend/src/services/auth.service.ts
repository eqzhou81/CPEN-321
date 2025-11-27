import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { userModel } from '../models/user.model';
import type { AuthResult } from '../types/auth.types';
import type { GoogleUserInfo, IUser } from '../types/users.types';
import logger from '../utils/logger.util';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email || !payload.name) {
        throw new Error('Missing required user information from Google');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
      
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  private generateAccessToken(user: IUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ id: user._id }, secret, {
      expiresIn: '19h',
    });
  }

  async signUpWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const googleUserInfo = await this.verifyGoogleToken(idToken);

      logger.info('🔍 Verifying Google ID token...');
      logger.info('Using CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
      logger.info('Using first 30 chars of idToken:', idToken.slice(0, 30));

      // Check if user already exists
      const existingUser = await userModel.findByGoogleId(
        googleUserInfo.googleId
      );
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const user = await userModel.create(googleUserInfo);
      const token = this.generateAccessToken(user);

      return { token, user };
    } catch (error) {
      logger.error('Sign up failed:', error);
      throw error;
    }
  }

  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const googleUserInfo = await this.verifyGoogleToken(idToken);

      // Find existing user
      const user = await userModel.findByGoogleId(googleUserInfo.googleId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateAccessToken(user);

      return { token, user };
    } catch (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }
  }

  // Helper method for testing
  async createOrUpdateUser(userData: { email: string; name: string; googleId: string }): Promise<IUser> {
    try {
      // Check if user already exists
      let user = await userModel.findByGoogleId(userData.googleId);
      
      if (!user) {
        // Create new user
        user = await userModel.create({
          googleId: userData.googleId,
          email: userData.email,
          name: userData.name,
        });
      }

      return user;
    } catch (error) {
      logger.error('Create or update user failed:', error);
      throw error;
    }
  }

  generateToken(user: IUser): string {
    return this.generateAccessToken(user);
  }
}

export const authService = new AuthService();
