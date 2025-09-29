import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';

  // Gestion des erreurs PostgreSQL
  if (err.message?.includes('duplicate key')) {
    statusCode = 409;
    message = 'Cette ressource existe déjà';
  }

  if (err.message?.includes('foreign key')) {
    statusCode = 400;
    message = 'Référence invalide vers une ressource';
  }

  if (err.message?.includes('not found')) {
    statusCode = 404;
    message = 'Ressource non trouvée';
  }

  // Gestion des erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Gestion des erreurs de validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Données invalides';
  }

  // Log de l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Erreur:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
