import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Interface pour les paramètres d'entreprise
interface CompanySettings {
  id?: string;
  user_id: string;
  name: string;
  address?: string;
  phone?: string;
  email: string;
  website?: string;
  footer_text?: string;
  additional_info?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// Récupérer les paramètres par défaut de l'utilisateur
router.get('/default', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, user_id, name, address, phone, email, website, 
            footer_text, additional_info, is_default, created_at, updated_at
     FROM company_settings 
     WHERE user_id = $1 AND is_default = true`,
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows.length > 0 ? result.rows[0] : null
  };

  res.json(response);
}));

// Récupérer tous les paramètres de l'utilisateur
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, user_id, name, address, phone, email, website, 
            footer_text, additional_info, is_default, created_at, updated_at
     FROM company_settings 
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Sauvegarder/Mettre à jour les paramètres
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    address,
    phone,
    email,
    website,
    footer_text,
    additional_info
  } = req.body;

  // Validation des champs requis
  if (!name || !email) {
    throw createError('Le nom et l\'email sont requis', 400);
  }

  // Vérifier s'il existe déjà des paramètres par défaut
  const existingResult = await query(
    'SELECT id FROM company_settings WHERE user_id = $1 AND is_default = true',
    [req.user!.userId]
  );

  let result;

  if (existingResult.rows.length > 0) {
    // Mettre à jour les paramètres existants
    result = await query(
      `UPDATE company_settings 
       SET name = $1, address = $2, phone = $3, email = $4, 
           website = $5, footer_text = $6, additional_info = $7, updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING id, user_id, name, address, phone, email, website, 
                 footer_text, additional_info, is_default, created_at, updated_at`,
      [name, address, phone, email, website, footer_text, additional_info, 
       existingResult.rows[0].id, req.user!.userId]
    );
  } else {
    // Créer de nouveaux paramètres
    result = await query(
      `INSERT INTO company_settings 
       (user_id, name, address, phone, email, website, footer_text, additional_info, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, user_id, name, address, phone, email, website, 
                 footer_text, additional_info, is_default, created_at, updated_at`,
      [req.user!.userId, name, address, phone, email, website, footer_text, additional_info]
    );
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Paramètres d\'entreprise sauvegardés avec succès'
  };

  res.json(response);
}));

// Supprimer les paramètres (réinitialisation)
router.delete('/default', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'DELETE FROM company_settings WHERE user_id = $1 AND is_default = true RETURNING id',
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: { deleted: result.rows.length > 0 },
    message: result.rows.length > 0 
      ? 'Paramètres d\'entreprise supprimés avec succès'
      : 'Aucun paramètre à supprimer'
  };

  res.json(response);
}));

// Vérifier si l'utilisateur a des paramètres sauvegardés
router.get('/exists', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT id FROM company_settings WHERE user_id = $1 AND is_default = true',
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: { exists: result.rows.length > 0 }
  };

  res.json(response);
}));

export default router;
