import { z } from 'zod';
import { IUser } from './users.types';

// Request types
// ------------------------------------------------------------
export interface AuthenticateUserRequest {
  idToken: string;
}

export interface AuthenticateUserResponse {
  message: string;
  data?: AuthResult;
}

// Zod schemas
// ------------------------------------------------------------
export const authenticateUserSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

// Generic types
// ------------------------------------------------------------
export interface AuthResult {
  token: string;
  user: IUser;
};

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
