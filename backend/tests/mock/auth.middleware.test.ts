import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../src/middleware/auth.middleware';
import { userModel } from '../../src/models/user.model';

jest.mock('jsonwebtoken');
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

describe('authenticateToken middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.BYPASS_AUTH;
    process.env.JWT_SECRET = 'test-secret';
    process.env.MOCK_USER_ID = '507f1f77bcf86cd799439011';
    process.env.MOCK_USER_EMAIL = 'test@example.com';
    process.env.MOCK_USER_NAME = 'Test User';

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    delete process.env.BYPASS_AUTH;
  });

  describe('BYPASS_AUTH enabled', () => {

  });

  describe('Token validation', () => {
    it('should return 401 when no token provided', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      mockRequest.headers = {};

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should extract token from Bearer header', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });



    it('should return 401 when decoded token has no id', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({});

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
    });

    it('should return 401 when user not found', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'Token is valid but user no longer exists',
      });
    });

    it('should set user and call next when token is valid', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ id: '507f1f77bcf86cd799439011' });
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed-token',
      };

      const jwtError = new jwt.JsonWebTokenError('Invalid token');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw jwtError;
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
        message: 'Token is malformed or expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle TokenExpiredError', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token expired',
        message: 'Please login again',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass other errors to next', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token',
      };

      const otherError = new Error('Unexpected error');
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw otherError;
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle authorization header without Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'token-without-bearer',
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle empty token string', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });


  });
});

