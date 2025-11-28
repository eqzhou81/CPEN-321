import { NextFunction, Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.middleware';
import { validateBody } from '../../src/middleware/validation.middleware';
import logger from '../../src/utils/logger.util';

jest.mock('../../src/utils/logger.util');

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route information', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Route not found',
        message: 'Cannot GET /api/test',
        timestamp: expect.any(String),
        path: '/api/test',
        method: 'GET',
      });
    });

    it('should handle POST method', () => {
      mockRequest.method = 'POST';
      mockRequest.originalUrl = '/api/users';

      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot POST /api/users',
        })
      );
    });
  });

  describe('errorHandler', () => {
    it('should log error and return 500', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('should handle different error types', () => {
      const error = new TypeError('Type error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });
});

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    it('should validate and pass valid data', () => {
      const schema = require('zod').z.object({
        name: require('zod').z.string(),
        age: require('zod').z.number(),
      });

      mockRequest.body = { name: 'Test', age: 25 };

      const validator = validateBody(schema);
      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for ZodError', () => {
      const schema = require('zod').z.object({
        name: require('zod').z.string(),
        age: require('zod').z.number(),
      });

      mockRequest.body = { name: 'Test' };

      const validator = validateBody(schema);
      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Invalid input data',
        details: expect.any(Array),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 for non-ZodError', () => {
      const schema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const validator = validateBody(schema as any);
      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Validation processing failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update req.body with validated data', () => {
      const schema = require('zod').z.object({
        email: require('zod').z.string().email(),
      });

      mockRequest.body = { email: 'test@example.com' };

      const validator = validateBody(schema);
      validator(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ email: 'test@example.com' });
    });
  });
});

