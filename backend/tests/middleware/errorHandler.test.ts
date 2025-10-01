import { Request, Response, NextFunction } from 'express';
import { errorHandler, createError, asyncHandler, AppError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('createError', () => {
    it('should create an error with message and status code', () => {
      const error = createError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should default to status 500 if not provided', () => {
      const error = createError('Test error');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('errorHandler', () => {
    it('should handle generic errors with 500 status', () => {
      const error = new Error('Generic error') as AppError;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Generic error',
        })
      );
    });

    it('should handle errors with custom status codes', () => {
      const error = createError('Not found', 404);

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Not found',
        })
      );
    });

    it('should handle PostgreSQL duplicate key errors', () => {
      const error = new Error('duplicate key value violates unique constraint') as AppError;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Cette ressource existe déjà',
        })
      );
    });

    it('should handle PostgreSQL foreign key errors', () => {
      const error = new Error('foreign key constraint violation') as AppError;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Référence invalide vers une ressource',
        })
      );
    });

    it('should handle not found errors', () => {
      const error = new Error('Resource not found') as AppError;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Ressource non trouvée',
        })
      );
    });

    it('should handle JWT errors', () => {
      const error = new Error('Invalid token') as AppError;
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token invalide',
        })
      );
    });

    it('should handle expired token errors', () => {
      const error = new Error('Token expired') as AppError;
      error.name = 'TokenExpiredError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token expiré',
        })
      );
    });

    it('should handle validation errors', () => {
      const error = new Error('Validation failed') as AppError;
      error.name = 'ValidationError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Données invalides',
        })
      );
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createError('Test error', 400);
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: 'Test stack trace',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createError('Test error', 400);
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async functions', async () => {
      const asyncFn = async (req: Request, res: Response) => {
        res.json({ success: true });
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should catch and forward async errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('Async error');
    });

    it('should preserve error status codes', async () => {
      const asyncFn = async () => {
        throw createError('Not found', 404);
      };

      const wrappedFn = asyncHandler(asyncFn);
      await wrappedFn(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });
});

