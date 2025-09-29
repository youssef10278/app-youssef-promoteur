import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { createError } from './errorHandler';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(createError('Token d\'accès requis', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    console.log('🔍 Token décodé:', { userId: decoded.userId, email: decoded.email });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Erreur décodage token:', error);
    return next(createError('Token invalide', 401));
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      req.user = decoded;
    } catch (error) {
      // Token invalide mais on continue sans utilisateur
      console.warn('Token invalide dans optionalAuth:', error);
    }
  }

  next();
};
