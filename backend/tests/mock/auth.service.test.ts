import jwt from 'jsonwebtoken';
import { userModel } from '../../src/models/user.model';

// Create mock functions that will be used
let mockVerifyIdToken: jest.Mock;

// Mock OAuth2Client before importing the service
jest.mock('google-auth-library', () => {
  mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

jest.mock('jsonwebtoken');
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

// Import service after mocks are set up
import { authService } from '../../src/services/auth.service';

describe('AuthService', () => {
  const mockGoogleId = 'mock-google-id-123';
  const mockEmail = 'test@example.com';
  const mockName = 'Test User';
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockIdToken = 'valid-google-id-token';

  const mockUser = {
    _id: mockUserId,
    googleId: mockGoogleId,
    email: mockEmail,
    name: mockName,
    savedJobs: [],
    savedQuestions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGooglePayload = {
    sub: mockGoogleId,
    email: mockEmail,
    name: mockName,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockClear();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyGoogleToken (tested through public methods)', () => {
    it('should verify Google token successfully through signUp', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new-jwt-token');

      const result = await authService.signUpWithGoogle(mockIdToken);

      expect(result.user).toEqual(mockUser);
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: mockIdToken,
        audience: 'test-client-id',
      });
    });

    it('should throw error when payload is null', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow(
        'Invalid token payload'
      );
    });

    it('should throw error when email is missing', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: mockGoogleId,
          name: mockName,
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow(
        'Missing required user information from Google'
      );
    });

    it('should throw error when name is missing', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: mockGoogleId,
          email: mockEmail,
        }),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow(
        'Missing required user information from Google'
      );
    });

    it('should handle verification errors', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow(
        'Invalid Google token'
      );
    });
  });

  describe('generateAccessToken (tested through public methods)', () => {
    it('should generate JWT token successfully through generateToken', () => {
      const mockToken = 'generated-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = authService.generateToken(mockUser);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        'test-jwt-secret',
        { expiresIn: '19h' }
      );
    });
  });

  describe('signUpWithGoogle', () => {
    it('should sign up new user successfully', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new-jwt-token');

      const result = await authService.signUpWithGoogle(mockIdToken);

      expect(result).toEqual({
        token: 'new-jwt-token',
        user: mockUser,
      });
      expect(userModel.findByGoogleId).toHaveBeenCalledWith(mockGoogleId);
      expect(userModel.create).toHaveBeenCalledWith({
        googleId: mockGoogleId,
        email: mockEmail,
        name: mockName,
      });
    });

    it('should throw error when user already exists', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow(
        'User already exists'
      );
    });

    it('should handle errors during signup', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.signUpWithGoogle(mockIdToken)).rejects.toThrow('Database error');
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in existing user successfully', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('existing-jwt-token');

      const result = await authService.signInWithGoogle(mockIdToken);

      expect(result).toEqual({
        token: 'existing-jwt-token',
        user: mockUser,
      });
      expect(userModel.findByGoogleId).toHaveBeenCalledWith(mockGoogleId);
    });

    it('should throw error when user not found', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(null);

      await expect(authService.signInWithGoogle(mockIdToken)).rejects.toThrow('User not found');
    });

    it('should handle errors during signin', async () => {
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(mockGooglePayload),
      };
      mockVerifyIdToken.mockResolvedValue(mockTicket);
      (userModel.findByGoogleId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.signInWithGoogle(mockIdToken)).rejects.toThrow('Database error');
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create new user when not exists', async () => {
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(null);
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.createOrUpdateUser({
        googleId: mockGoogleId,
        email: mockEmail,
        name: mockName,
      });

      expect(result).toEqual(mockUser);
      expect(userModel.create).toHaveBeenCalledWith({
        googleId: mockGoogleId,
        email: mockEmail,
        name: mockName,
      });
    });

    it('should return existing user when found', async () => {
      (userModel.findByGoogleId as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.createOrUpdateUser({
        googleId: mockGoogleId,
        email: mockEmail,
        name: mockName,
      });

      expect(result).toEqual(mockUser);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('should handle errors during create or update', async () => {
      (userModel.findByGoogleId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        authService.createOrUpdateUser({
          googleId: mockGoogleId,
          email: mockEmail,
          name: mockName,
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('generateToken', () => {
    it('should generate token for user', () => {
      const mockToken = 'generated-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = authService.generateToken(mockUser);

      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUserId },
        'test-jwt-secret',
        { expiresIn: '19h' }
      );
    });
  });
});

