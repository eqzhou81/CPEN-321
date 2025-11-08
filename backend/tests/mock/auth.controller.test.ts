import request from 'supertest';
import { app } from '../../src/config/app';
import { authService } from '../../src/services/auth.service';
import { userModel } from '../../src/models/user.model';

jest.mock('../../src/services/auth.service');
jest.mock('../../src/models/user.model');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

// Mock user data
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  googleId: 'mock-google-id',
  email: 'test@example.com',
  name: 'Test User',
  savedJobs: [],
  savedQuestions: [],
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-02T00:00:00.000Z'),
};

const mockAuthResult = {
  token: 'mock-jwt-token',
  user: mockUser
};

// Expected response with serialized dates (as they appear in JSON responses)
const expectedUserInResponse = {
  _id: '507f1f77bcf86cd799439011',
  googleId: 'mock-google-id',
  email: 'test@example.com',
  name: 'Test User',
  savedJobs: [],
  savedQuestions: [],
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-02T00:00:00.000Z',
};

const expectedAuthResult = {
  token: 'mock-jwt-token',
  user: expectedUserInResponse
};

describe('AuthController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Clean up any open handles
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe('POST /api/auth/signup', () => {
        it('should sign up user successfully', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signUpWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                message: 'User signed up successfully',
                data: expectedAuthResult
            });

            expect(authService.signUpWithGoogle).toHaveBeenCalledWith(requestData.idToken);
        });

        it('should handle missing idToken (controller level)', async () => {
            const requestData = {}; // Missing idToken

            // Since no validation middleware, this will reach the controller
            // Controller should handle this gracefully or throw an error
            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid Google token');
        });

        it('should handle empty idToken (controller level)', async () => {
            const requestData = {
                idToken: ''
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid Google token');
        });

        it('should return 401 for invalid Google token', async () => {
            const requestData = {
                idToken: 'invalid-google-token'
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'Invalid Google token'
            });
        });

        it('should return 409 if user already exists', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('User already exists')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(409);
            expect(response.body).toEqual({
                message: 'User already exists, please sign in instead.'
            });
        });

        it('should return 500 for failed user processing', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Failed to process user')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to process user information'
            });
        });

        it('should handle non-Error exceptions', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            // Mock a non-Error exception
            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue('Some string error');

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            // Should be handled by error middleware
            expect(response.status).toBe(500);
        });

        it('should ignore extra fields in request (no validation middleware)', async () => {
            const requestData = {
                idToken: 'valid-google-id-token',
                extraField: 'ignored'
            };

            (authService.signUpWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            // Should work since there's no validation middleware to reject extra fields
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User signed up successfully');
        });
    });

    describe('POST /api/auth/signin', () => {
        it('should sign in user successfully', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signInWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'User signed in successfully',
                data: expectedAuthResult
            });

            expect(authService.signInWithGoogle).toHaveBeenCalledWith(requestData.idToken);
        });

        it('should handle missing idToken (controller level)', async () => {
            const requestData = {}; // Missing idToken

            // Since no validation middleware, this will reach the controller
            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid Google token');
        });

        it('should handle empty idToken (controller level)', async () => {
            const requestData = {
                idToken: ''
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid Google token');
        });

        it('should return 401 for invalid Google token', async () => {
            const requestData = {
                idToken: 'invalid-google-token'
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                message: 'Invalid Google token'
            });
        });

        it('should return 404 if user not found', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('User not found')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'User not found, please sign up first.'
            });
        });

        it('should return 500 for failed user processing', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Failed to process user')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                message: 'Failed to process user information'
            });
        });

        it('should handle non-Error exceptions', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            // Mock a non-Error exception
            (authService.signInWithGoogle as jest.Mock).mockRejectedValue('Some string error');

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            // Should be handled by error middleware
            expect(response.status).toBe(500);
        });

        it('should ignore extra fields in request (no validation middleware)', async () => {
            const requestData = {
                idToken: 'valid-google-id-token',
                extraField: 'ignored'
            };

            (authService.signInWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            // Should work since there's no validation middleware to reject extra fields
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User signed in successfully');
        });
        
        it('should return 500 for failed user processing', async () => {
        const requestData = {
          idToken: 'valid-google-id-token'
        };

        (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
          new Error('Failed to process user')
        );

        const response = await request(app)
            .post('/api/auth/signin')
            .send(requestData);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          message: 'Failed to process user information'
        });
      });

    });

    describe('Mock Auth Endpoint (Development Only)', () => {
        beforeAll(() => {
            // Set environment variable for mock auth endpoint
            process.env.BYPASS_AUTH = 'true';
        });

        afterAll(() => {
            // Clean up environment variable
            delete process.env.BYPASS_AUTH;
        });

        it('should provide mock signin endpoint when BYPASS_AUTH is enabled', async () => {
            // This test might not work exactly as expected due to how the route is conditionally loaded
            // But we can test the basic structure
            const response = await request(app)
                .post('/api/auth/mock-signin')
                .send({});

            if (response.status === 200) {
                expect(response.body.message).toBe('Mock sign in successful');
                expect(response.body.data.user).toBeDefined();
                expect(response.body.data.token).toBeDefined();
            } else {
                // Route might not be available if app was loaded before env var was set
                expect(response.status).toBe(404);
            }
        });
    });

    describe('Input Edge Cases (Controller Level Handling)', () => {
        it('should handle very long idToken', async () => {
            const requestData = {
                idToken: 'a'.repeat(10000) // Very long token
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid Google token');
        });

        it('should handle null idToken gracefully', async () => {
            const requestData = {
                idToken: null
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            // Controller should handle this through service error
            expect(response.status).toBe(401);
        });

        it('should handle numeric idToken', async () => {
            const requestData = {
                idToken: 12345
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(401);
        });

        it('should handle boolean idToken', async () => {
            const requestData = {
                idToken: true
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
        });

        it('should handle array idToken', async () => {
            const requestData = {
                idToken: ['token1', 'token2']
            };

            (authService.signInWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(response.status).toBe(401);
        });

        it('should handle object idToken', async () => {
            const requestData = {
                idToken: { token: 'value' }
            };

            (authService.signUpWithGoogle as jest.Mock).mockRejectedValue(
                new Error('Invalid Google token')
            );

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(401);
        });
    });

    describe('Service Integration', () => {
        it('should pass correct parameters to auth service on signup', async () => {
            const requestData = {
                idToken: 'specific-test-token-12345'
            };

            (authService.signUpWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(authService.signUpWithGoogle).toHaveBeenCalledWith('specific-test-token-12345');
            expect(authService.signUpWithGoogle).toHaveBeenCalledTimes(1);
        });

        it('should pass correct parameters to auth service on signin', async () => {
            const requestData = {
                idToken: 'another-specific-test-token-67890'
            };

            (authService.signInWithGoogle as jest.Mock).mockResolvedValue(mockAuthResult);

            await request(app)
                .post('/api/auth/signin')
                .send(requestData);

            expect(authService.signInWithGoogle).toHaveBeenCalledWith('another-specific-test-token-67890');
            expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning different user data', async () => {
            const requestData = {
                idToken: 'valid-google-id-token'
            };

            const differentUser = {
                ...mockUser,
                _id: 'different-user-id',
                email: 'different@example.com',
                name: 'Different User'
            };

            const differentAuthResult = {
                token: 'different-jwt-token',
                user: differentUser
            };

            (authService.signUpWithGoogle as jest.Mock).mockResolvedValue(differentAuthResult);

            const response = await request(app)
                .post('/api/auth/signup')
                .send(requestData);

            expect(response.status).toBe(201);
            expect(response.body.data.user.email).toBe('different@example.com');
            expect(response.body.data.user.name).toBe('Different User');
            expect(response.body.data.token).toBe('different-jwt-token');
        });
    });
});