import { Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../../src/middleware/auth';
import { generateToken } from '../../src/utils/auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate with valid token', () => {
      const token = generateToken({ userId: '123', email: 'test@example.com' });
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('123');
      expect(mockRequest.user?.email).toBe('test@example.com');
    });

    it('should reject request without token', () => {
      mockRequest.headers = {};

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.message).toContain('Token');
      expect(error.statusCode).toBe(401);
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token-here',
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.message).toContain('invalide');
      expect(error.statusCode).toBe(401);
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });

    it('should reject expired token', (done) => {
      // Créer un token avec une expiration très courte
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1ms' }
      );

      // Attendre que le token expire
      setTimeout(() => {
        mockRequest.headers = {
          authorization: `Bearer ${expiredToken}`,
        };

        authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        const error = (nextFunction as jest.Mock).mock.calls[0][0];
        expect(error).toBeDefined();
        expect(error.statusCode).toBe(401);
        done();
      }, 10);
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate with valid token', () => {
      const token = generateToken({ userId: '123', email: 'test@example.com' });
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('123');
    });

    it('should continue without user when no token provided', () => {
      mockRequest.headers = {};

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without user when token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should not throw error with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      expect(() => {
        optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);
      }).not.toThrow();

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});

