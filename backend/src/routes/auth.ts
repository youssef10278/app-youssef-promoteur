import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, User, RegisterRequest, AuthRequest } from '../types';

const router = Router();

// Inscription
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(registerSchema, req.body) as RegisterRequest;
  
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [validatedData.email]
  );
  
  if (existingUser.rows.length > 0) {
    throw createError('Un utilisateur avec cet email existe déjà', 409);
  }
  
  // Hacher le mot de passe
  const passwordHash = await hashPassword(validatedData.password);
  
  // Créer l'utilisateur
  const result = await query(
    `INSERT INTO users (email, password_hash, nom, telephone, societe)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, nom, telephone, societe, created_at`,
    [validatedData.email, passwordHash, validatedData.nom, validatedData.telephone, validatedData.societe]
  );
  
  const user = result.rows[0];
  
  // Générer les tokens
  const token = generateToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  
  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        telephone: user.telephone,
        societe: user.societe,
        created_at: user.created_at
      },
      token,
      refreshToken
    },
    message: 'Inscription réussie'
  };
  
  res.status(201).json(response);
}));

// Connexion
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(loginSchema, req.body) as AuthRequest;
  
  // Trouver l'utilisateur
  const result = await query(
    'SELECT id, email, password_hash, nom, telephone, societe, created_at FROM users WHERE email = $1',
    [validatedData.email]
  );
  
  if (result.rows.length === 0) {
    throw createError('Email ou mot de passe incorrect', 401);
  }
  
  const user = result.rows[0];
  
  // Vérifier le mot de passe
  const isValidPassword = await verifyPassword(validatedData.password, user.password_hash);
  
  if (!isValidPassword) {
    throw createError('Email ou mot de passe incorrect', 401);
  }
  
  // Générer les tokens
  const token = generateToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  
  const response: ApiResponse = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        telephone: user.telephone,
        societe: user.societe,
        created_at: user.created_at
      },
      token,
      refreshToken
    },
    message: 'Connexion réussie'
  };
  
  res.json(response);
}));

// Profil utilisateur
router.get('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT id, email, nom, telephone, societe, created_at, updated_at FROM users WHERE id = $1',
    [req.user!.userId]
  );
  
  if (result.rows.length === 0) {
    throw createError('Utilisateur non trouvé', 404);
  }
  
  const user = result.rows[0];
  
  const response: ApiResponse = {
    success: true,
    data: user
  };
  
  res.json(response);
}));

// Mise à jour du profil
router.put('/profile', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const { nom, telephone, societe } = req.body;
  
  const result = await query(
    `UPDATE users 
     SET nom = COALESCE($1, nom), 
         telephone = COALESCE($2, telephone), 
         societe = COALESCE($3, societe),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, nom, telephone, societe, created_at, updated_at`,
    [nom, telephone, societe, req.user!.userId]
  );
  
  if (result.rows.length === 0) {
    throw createError('Utilisateur non trouvé', 404);
  }
  
  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Profil mis à jour avec succès'
  };
  
  res.json(response);
}));

// Vérification du token
router.get('/verify', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: { valid: true, user: req.user },
    message: 'Token valide'
  };
  
  res.json(response);
}));

// Déconnexion (côté client principalement)
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Déconnexion réussie'
  };
  
  res.json(response);
}));

export default router;
