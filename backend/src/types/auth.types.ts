import { IUser } from './users.types';

// Request types
// ------------------------------------------------------------
export interface AuthenticateUserRequest {
  idToken: string;
}

export type AuthenticateUserResponse = {
  message: string;
  data?: AuthResult;
};

// Generic types
// ------------------------------------------------------------
export type AuthResult = {
  token: string;
  user: IUser;
};

declare global {
  namespace Express {
    interface Request {
      users?: IUser;
    }
  }
}
