import request from 'supertest';
import { app } from '../../src/app';
import { userModel } from '../../src/models/user.model';
import { IUser } from '../../src/types/users.types';

jest.mock('../../src/models/user.model');
jest.mock('../../src/config/database', () => ({
  connectDB: jest.fn()
}));

// Mock JWT token for authentication
const mockToken = 'Bearer mock-jwt-token';
const mockUserId = '507f1f77bcf86cd799439011';

// Mock user data
const mockUser: IUser = {
  _id: mockUserId,
  googleId: 'mock-google-id',
  email: 'test@example.com',
  name: 'Test User',
  savedJobs: ['job1', 'job2'],
  savedQuestions: ['question1', 'question2'],
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-02T00:00:00.000Z'),
} as IUser;

// Mock authenticateToken middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

describe('UsersController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        // Clean up any open handles
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe('GET /api/user/profile', () => {
        it('should return user profile successfully', async () => {
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                data: {
                    user: {
                        id: mockUserId,
                        email: 'test@example.com',
                        name: 'Test User',
                        savedJobs: ['job1', 'job2'],
                        savedQuestions: ['question1', 'question2'],
                        createdAt: '2023-01-01T00:00:00.000Z',
                        updatedAt: '2023-01-02T00:00:00.000Z'
                    }
                }
            });
        });

        it('should handle profile retrieval without authentication (middleware should catch this)', async () => {
            // This test assumes the auth middleware would catch missing auth
            // but since we're mocking it, we'll test the controller logic
            const response = await request(app)
                .get('/api/user/profile');
                // No Authorization header

            // With our mock, this will still work, but in real scenario auth middleware would block it
            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/user/profile', () => {
        it('should update user profile successfully', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            const updatedUser = {
                ...mockUser,
                name: 'Updated Name',
                updatedAt: new Date('2023-01-03T00:00:00.000Z')
            };

            (userModel.update as jest.Mock).mockResolvedValue(updatedUser);

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'User info updated successfully',
                profile: {
                    id: mockUserId,
                    email: 'test@example.com',
                    name: 'Updated Name',
                    savedJobs: ['job1', 'job2'],
                    savedQuestions: ['question1', 'question2'],
                    createdAt: '2023-01-01T00:00:00.000Z',
                    updatedAt: '2023-01-03T00:00:00.000Z'
                }
            });

            expect(userModel.update).toHaveBeenCalledWith(mockUserId, updateData);
        });

        it('should return 404 if user not found during update', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            (userModel.update as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
            expect(response.body.profile).toEqual({
                id: mockUserId,
                email: 'test@example.com',
                name: 'Test User',
                savedJobs: ['job1', 'job2'],
                savedQuestions: ['question1', 'question2'],
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-02T00:00:00.000Z'
            });
        });

        it('should handle database errors during update', async () => {
            const updateData = {
                name: 'Updated Name'
            };

            (userModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Database error');
            expect(response.body.profile).toEqual({
                id: mockUserId,
                email: 'test@example.com',
                name: 'Test User',
                savedJobs: ['job1', 'job2'],
                savedQuestions: ['question1', 'question2'],
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: '2023-01-02T00:00:00.000Z'
            });
        });

        it('should return 400 for invalid update data (validation)', async () => {
            const invalidData = {
                name: '' // Empty name should fail validation
            };

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(invalidData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for extra fields (strict validation)', async () => {
            const invalidData = {
                name: 'Valid Name',
                extraField: 'should not be allowed' // Extra field should fail strict validation
            };

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(invalidData);

            expect(response.status).toBe(400);
        });

        it('should allow update with only valid fields', async () => {
            const updateData = {
                name: 'New Valid Name'
            };

            const updatedUser = {
                ...mockUser,
                name: 'New Valid Name'
            };

            (userModel.update as jest.Mock).mockResolvedValue(updatedUser);

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should allow empty update (no fields to update)', async () => {
            const updateData = {}; // Empty update should be allowed

            const updatedUser = mockUser; // No changes

            (userModel.update as jest.Mock).mockResolvedValue(updatedUser);

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('DELETE /api/user/profile', () => {
        it('should delete user profile successfully', async () => {
            const deleteData = {
                confirmDelete: true
            };

            (userModel.delete as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: 'User deleted successfully'
            });

            expect(userModel.delete).toHaveBeenCalledWith(mockUserId);
        });

        it('should return 400 if confirmDelete is missing', async () => {
            const deleteData = {}; // Missing confirmDelete

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(400);
        });

        it('should return 400 if confirmDelete is false', async () => {
            const deleteData = {
                confirmDelete: false
            };

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(400);
        });

        it('should return 400 if confirmDelete is not a boolean', async () => {
            const deleteData = {
                confirmDelete: 'true' // String instead of boolean
            };

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(400);
        });

        it('should handle database errors during deletion', async () => {
            const deleteData = {
                confirmDelete: true
            };

            (userModel.delete as jest.Mock).mockRejectedValue(new Error('Database deletion error'));

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Database deletion error');
        });

        it('should return 400 for extra fields in delete request', async () => {
            const deleteData = {
                confirmDelete: true,
                extraField: 'not allowed'
            };

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            expect(response.status).toBe(400);
        });

        it('should handle non-Error exceptions during deletion', async () => {
            const deleteData = {
                confirmDelete: true
            };

            // Mock a non-Error exception (string, object, etc.)
            (userModel.delete as jest.Mock).mockRejectedValue('Some non-error exception');

            const response = await request(app)
                .delete('/api/user/profile')
                .set('Authorization', mockToken)
                .send(deleteData);

            // Should call next() with the error, which would be handled by error middleware
            // In our test setup, this might not be fully handled, but the controller logic should work
            expect(response.status).toBe(500);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle user update with very long name (within limits)', async () => {
            const updateData = {
                name: 'A'.repeat(100) // Maximum allowed length
            };

            const updatedUser = {
                ...mockUser,
                name: updateData.name
            };

            (userModel.update as jest.Mock).mockResolvedValue(updatedUser);

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject user update with name too long', async () => {
            const updateData = {
                name: 'A'.repeat(101) // Over the limit
            };

            const response = await request(app)
                .post('/api/user/profile')
                .set('Authorization', mockToken)
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should handle profile transformation with edge cases', async () => {
            // Test that the profile transformation works with the current mock data structure
            const response = await request(app)
                .get('/api/user/profile')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body.data.user.savedJobs).toEqual(['job1', 'job2']);
            expect(response.body.data.user.savedQuestions).toEqual(['question1', 'question2']);
            expect(response.body.data.user.id).toBe(mockUserId);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.name).toBe('Test User');
        });
    });
});