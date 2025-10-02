import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createCheckSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Check } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir tous les chèques de l'utilisateur
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { type, statut, project_id, payment_plan_id, expense_id, sale_id } = req.query;

  // Log pour debug
  console.log('🔍 Requête chèques avec filtres:', {
    type, statut, project_id, payment_plan_id, expense_id, sale_id,
    user_id: req.user!.userId
  });

  let whereConditions = ['c.user_id = $1'];
  const queryParams = [req.user!.userId];
  let paramIndex = 2;

  if (type) {
    whereConditions.push(`c.type_cheque = $${paramIndex}`);
    queryParams.push(type as string);
    paramIndex++;
  }

  if (statut) {
    whereConditions.push(`c.statut = $${paramIndex}`);
    queryParams.push(statut as string);
    paramIndex++;
  }

  if (project_id) {
    whereConditions.push(`c.project_id = $${paramIndex}`);
    queryParams.push(project_id as string);
    paramIndex++;
  }

  if (payment_plan_id) {
    whereConditions.push(`c.payment_plan_id = $${paramIndex}`);
    queryParams.push(payment_plan_id as string);
    paramIndex++;
  }

  if (expense_id) {
    whereConditions.push(`c.expense_id = $${paramIndex}`);
    queryParams.push(expense_id as string);
    paramIndex++;
  }

  if (sale_id) {
    whereConditions.push(`c.sale_id = $${paramIndex}`);
    queryParams.push(sale_id as string);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  const result = await query(
    `SELECT c.*, p.nom as project_nom, s.client_nom, e.nom as expense_nom
     FROM checks c
     LEFT JOIN projects p ON c.project_id = p.id
     LEFT JOIN sales s ON c.sale_id = s.id
     LEFT JOIN expenses e ON c.expense_id = e.id
     WHERE ${whereClause}
     ORDER BY c.date_emission DESC`,
    queryParams
  );

  // Log pour debug
  console.log(`✅ Chèques trouvés: ${result.rows.length} résultats`);
  if (expense_id) {
    console.log(`🎯 Filtrage par expense_id: ${expense_id} - Résultats: ${result.rows.length}`);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Obtenir les statistiques des chèques en attente
router.get('/stats/pending', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT
       COUNT(CASE WHEN statut = 'emis' AND type_cheque = 'recu' THEN 1 END) as cheques_en_attente,
       COALESCE(SUM(CASE WHEN statut = 'emis' AND type_cheque = 'recu' THEN montant ELSE 0 END), 0) as montant_en_attente,
       COUNT(CASE WHEN statut = 'emis' AND type_cheque = 'recu' AND date_echeance < CURRENT_DATE THEN 1 END) as cheques_en_retard,
       COALESCE(SUM(CASE WHEN statut = 'emis' AND type_cheque = 'recu' AND date_echeance < CURRENT_DATE THEN montant ELSE 0 END), 0) as montant_en_retard
     FROM checks
     WHERE user_id = $1`,
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Obtenir les statistiques des chèques
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query;

  // Construire la clause WHERE avec filtres de date
  let whereClause = 'WHERE user_id = $1';
  const params: any[] = [req.user!.userId];

  if (period && period !== 'all') {
    if (startDate && endDate) {
      whereClause += ' AND created_at >= $2 AND created_at <= $3';
      params.push(startDate, endDate);
    }
  }

  const result = await query(
    `SELECT
       COUNT(*) as total_cheques,
       COUNT(CASE WHEN type_cheque = 'recu' THEN 1 END) as cheques_recus,
       COUNT(CASE WHEN type_cheque = 'donne' THEN 1 END) as cheques_donnes,
       COUNT(CASE WHEN statut = 'emis' THEN 1 END) as cheques_emis,
       COUNT(CASE WHEN statut = 'encaisse' THEN 1 END) as cheques_encaisses,
       COUNT(CASE WHEN statut = 'annule' THEN 1 END) as cheques_annules,
       COALESCE(SUM(CASE WHEN type_cheque = 'recu' THEN montant ELSE 0 END), 0) as montant_total_recus,
       COALESCE(SUM(CASE WHEN type_cheque = 'donne' THEN montant ELSE 0 END), 0) as montant_total_donnes
     FROM checks
     ${whereClause}`,
    params
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Obtenir un chèque spécifique
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT c.*, p.nom as project_nom, s.client_nom, e.nom as expense_nom
     FROM checks c
     LEFT JOIN projects p ON c.project_id = p.id
     LEFT JOIN sales s ON c.sale_id = s.id
     LEFT JOIN expenses e ON c.expense_id = e.id
     WHERE c.id = $1 AND c.user_id = $2`,
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Chèque non trouvé', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Créer un nouveau chèque
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createCheckSchema, req.body);

  // Vérifier les références si fournies
  if (validatedData.project_id) {
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [validatedData.project_id, req.user!.userId]
    );
    if (projectCheck.rows.length === 0) {
      throw createError('Projet non trouvé', 404);
    }
  }

  if (validatedData.sale_id) {
    const saleCheck = await query(
      'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
      [validatedData.sale_id, req.user!.userId]
    );
    if (saleCheck.rows.length === 0) {
      throw createError('Vente non trouvée', 404);
    }
  }

  if (validatedData.expense_id) {
    const expenseCheck = await query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [validatedData.expense_id, req.user!.userId]
    );
    if (expenseCheck.rows.length === 0) {
      throw createError('Dépense non trouvée', 404);
    }
  }

  const result = await query(
    `INSERT INTO checks (
       user_id, project_id, sale_id, expense_id, type_cheque, montant,
       numero_cheque, nom_beneficiaire, nom_emetteur, date_emission,
       date_encaissement, statut, facture_recue, description
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      req.user!.userId,
      validatedData.project_id,
      validatedData.sale_id,
      validatedData.expense_id,
      validatedData.type_cheque,
      validatedData.montant,
      validatedData.numero_cheque,
      validatedData.nom_beneficiaire,
      validatedData.nom_emetteur,
      validatedData.date_emission,
      validatedData.date_encaissement,
      validatedData.statut,
      validatedData.facture_recue,
      validatedData.description
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Chèque créé avec succès'
  };

  res.status(201).json(response);
}));

// Mettre à jour un chèque
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Vérifier que le chèque appartient à l'utilisateur
  const existingCheck = await query(
    'SELECT id FROM checks WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (existingCheck.rows.length === 0) {
    throw createError('Chèque non trouvé', 404);
  }

  // Construire la requête de mise à jour
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'montant', 'numero_cheque', 'nom_beneficiaire', 'nom_emetteur',
    'date_emission', 'date_encaissement', 'statut', 'facture_recue', 'description'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updateFields.push(`${field} = $${paramIndex}`);
      values.push(updateData[field]);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw createError('Aucune donnée à mettre à jour', 400);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(id, req.user!.userId);

  const result = await query(
    `UPDATE checks 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Chèque mis à jour avec succès'
  };

  res.json(response);
}));

// Supprimer un chèque
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM checks WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Chèque non trouvé', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Chèque supprimé avec succès'
  };

  res.json(response);
}));

// Marquer un chèque comme encaissé
router.patch('/:id/encaisser', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date_encaissement } = req.body;

  const result = await query(
    `UPDATE checks 
     SET statut = 'encaisse', 
         date_encaissement = $1,
         updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND statut = 'emis'
     RETURNING *`,
    [date_encaissement || new Date(), id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Chèque non trouvé ou déjà encaissé', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Chèque marqué comme encaissé'
  };

  res.json(response);
}));

export default router;
