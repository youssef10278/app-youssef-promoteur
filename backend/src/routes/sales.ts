import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createSaleSchema, salesFiltersSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Sale, SalesFilters, PaginatedResponse } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir toutes les ventes avec filtres et pagination
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const filters = validate(salesFiltersSchema, req.query) as SalesFilters;
  
  // Construction de la requête WHERE
  const whereConditions = ['s.user_id = $1'];
  const queryParams = [req.user!.userId];
  let paramIndex = 2;

  if (filters.search) {
    whereConditions.push(`(
      s.client_nom ILIKE $${paramIndex} OR 
      s.unite_numero ILIKE $${paramIndex} OR 
      s.description ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.statut) {
    whereConditions.push(`s.statut = $${paramIndex}`);
    queryParams.push(filters.statut);
    paramIndex++;
  }

  if (filters.type_propriete) {
    whereConditions.push(`s.type_propriete = $${paramIndex}`);
    queryParams.push(filters.type_propriete);
    paramIndex++;
  }

  if (filters.mode_paiement) {
    whereConditions.push(`s.mode_paiement = $${paramIndex}`);
    queryParams.push(filters.mode_paiement);
    paramIndex++;
  }

  if (filters.date_debut) {
    whereConditions.push(`s.created_at >= $${paramIndex}`);
    queryParams.push(filters.date_debut);
    paramIndex++;
  }

  if (filters.date_fin) {
    whereConditions.push(`s.created_at <= $${paramIndex}`);
    queryParams.push(filters.date_fin);
    paramIndex++;
  }

  if (filters.montant_min) {
    whereConditions.push(`s.prix_total >= $${paramIndex}`);
    queryParams.push(filters.montant_min.toString());
    paramIndex++;
  }

  if (filters.montant_max) {
    whereConditions.push(`s.prix_total <= $${paramIndex}`);
    queryParams.push(filters.montant_max.toString());
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Requête pour compter le total
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM sales s
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE ${whereClause}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / filters.limit!);

  // Requête principale avec pagination
  const offset = (filters.page! - 1) * filters.limit!;

  const result = await query(
    `SELECT s.*, p.nom as project_nom
     FROM sales s
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE ${whereClause}
     ORDER BY s.${filters.sortBy} ${filters.sortOrder}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, filters.limit, offset]
  );

  // Convertir les valeurs numériques de string vers number
  const salesWithConvertedNumbers = result.rows.map(sale => ({
    ...sale,
    surface: parseFloat(sale.surface || 0),
    prix_total: parseFloat(sale.prix_total || 0),
    avance_declare: parseFloat(sale.avance_declare || 0),
    avance_non_declare: parseFloat(sale.avance_non_declare || 0),
    avance_cheque: parseFloat(sale.avance_cheque || 0),
    avance_espece: parseFloat(sale.avance_espece || 0),
    avance_total: parseFloat(sale.avance_total || 0)
  }));

  const response: PaginatedResponse<Sale> = {
    success: true,
    data: salesWithConvertedNumbers,
    pagination: {
      page: filters.page!,
      limit: filters.limit!,
      total,
      totalPages
    }
  };

  res.json(response);
}));

// Obtenir les statistiques globales des ventes
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { period, startDate, endDate } = req.query;

  // Construire la clause WHERE avec filtres de date
  let whereClause = 'WHERE s.user_id = $1 AND s.statut != \'annule\'';
  const params: any[] = [req.user!.userId];

  if (period && period !== 'all') {
    if (startDate && endDate) {
      whereClause += ' AND s.created_at >= $2 AND s.created_at <= $3';
      params.push(startDate, endDate);
    }
  }

  const result = await query(
    `SELECT
       COUNT(*) as total_ventes,
       COUNT(CASE WHEN s.statut = 'termine' THEN 1 END) as ventes_finalisees,
       COUNT(CASE WHEN s.statut = 'en_cours' THEN 1 END) as ventes_en_cours,
       COALESCE(SUM(s.prix_total), 0) as chiffre_affaires_total,
       COALESCE(SUM(s.avance_total), 0) as montant_encaisse,
       COALESCE(SUM(s.prix_total - s.avance_total), 0) as montant_restant
     FROM sales s
     ${whereClause}`,
    params
  );

  const stats = result.rows[0];
  const response: ApiResponse = {
    success: true,
    data: {
      totalVentes: parseInt(stats.total_ventes),
      ventesFinalisees: parseInt(stats.ventes_finalisees),
      ventesEnCours: parseInt(stats.ventes_en_cours),
      chiffreAffairesTotal: parseFloat(stats.chiffre_affaires_total),
      montantEncaisse: parseFloat(stats.montant_encaisse),
      montantRestant: parseFloat(stats.montant_restant)
    }
  };

  res.json(response);
}));

// Obtenir les ventes d'un projet spécifique
router.get('/project/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const filters = validate(salesFiltersSchema, req.query) as SalesFilters;

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  // Construction de la requête WHERE
  const whereConditions = ['s.project_id = $1', 's.user_id = $2'];
  const queryParams = [projectId, req.user!.userId];
  let paramIndex = 3;

  if (filters.search) {
    whereConditions.push(`(
      s.client_nom ILIKE $${paramIndex} OR 
      s.unite_numero ILIKE $${paramIndex} OR 
      s.description ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.statut) {
    whereConditions.push(`s.statut = $${paramIndex}`);
    queryParams.push(filters.statut);
    paramIndex++;
  }

  if (filters.type_propriete) {
    whereConditions.push(`s.type_propriete = $${paramIndex}`);
    queryParams.push(filters.type_propriete);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Requête pour compter le total
  const countResult = await query(
    `SELECT COUNT(*) as total FROM sales s WHERE ${whereClause}`,
    queryParams
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / filters.limit!);

  // Requête principale
  const offset = (filters.page! - 1) * filters.limit!;

  const result = await query(
    `SELECT s.*, p.nom as project_nom
     FROM sales s
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE ${whereClause}
     ORDER BY s.${filters.sortBy} ${filters.sortOrder}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, filters.limit, offset]
  );

  // Convertir les valeurs numériques de string vers number pour les ventes du projet
  const salesWithConvertedNumbers = result.rows.map(sale => ({
    ...sale,
    surface: parseFloat(sale.surface || 0),
    prix_total: parseFloat(sale.prix_total || 0),
    avance_declare: parseFloat(sale.avance_declare || 0),
    avance_non_declare: parseFloat(sale.avance_non_declare || 0),
    avance_cheque: parseFloat(sale.avance_cheque || 0),
    avance_espece: parseFloat(sale.avance_espece || 0),
    avance_total: parseFloat(sale.avance_total || 0)
  }));

  const response: PaginatedResponse<Sale> = {
    success: true,
    data: salesWithConvertedNumbers,
    pagination: {
      page: filters.page!,
      limit: filters.limit!,
      total,
      totalPages
    }
  };

  res.json(response);
}));



// Obtenir une vente spécifique
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT s.*, p.nom as project_nom
     FROM sales s
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE s.id = $1 AND s.user_id = $2`,
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  // Convertir les valeurs numériques pour la vente individuelle
  const saleWithConvertedNumbers = {
    ...result.rows[0],
    surface: parseFloat(result.rows[0].surface || 0),
    prix_total: parseFloat(result.rows[0].prix_total || 0),
    avance_declare: parseFloat(result.rows[0].avance_declare || 0),
    avance_non_declare: parseFloat(result.rows[0].avance_non_declare || 0),
    avance_cheque: parseFloat(result.rows[0].avance_cheque || 0),
    avance_espece: parseFloat(result.rows[0].avance_espece || 0),
    avance_total: parseFloat(result.rows[0].avance_total || 0)
  };

  const response: ApiResponse = {
    success: true,
    data: saleWithConvertedNumbers
  };

  res.json(response);
}));

// Créer une nouvelle vente
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createSaleSchema, req.body);

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [validatedData.project_id, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  // Vérifier que l'unité n'est pas déjà vendue
  const unitCheck = await query(
    'SELECT id FROM sales WHERE project_id = $1 AND unite_numero = $2',
    [validatedData.project_id, validatedData.unite_numero]
  );

  if (unitCheck.rows.length > 0) {
    throw createError('Cette unité est déjà vendue', 409);
  }

  // Créer la vente
  const result = await query(
    `INSERT INTO sales (
       project_id, user_id, type_propriete, unite_numero, client_nom,
       client_telephone, client_email, client_adresse, surface, prix_total,
       description, mode_paiement, avance_declare, avance_non_declare,
       avance_cheque, avance_espece
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      validatedData.project_id,
      req.user!.userId,
      validatedData.type_propriete,
      validatedData.unite_numero,
      validatedData.client_nom,
      validatedData.client_telephone,
      validatedData.client_email,
      validatedData.client_adresse,
      validatedData.surface,
      validatedData.prix_total,
      validatedData.description,
      validatedData.mode_paiement,
      validatedData.avance_declare,
      validatedData.avance_non_declare,
      validatedData.avance_cheque,
      validatedData.avance_espece
    ]
  );

  const sale = result.rows[0];

  // NOUVEAU: Créer automatiquement un payment_plan pour l'avance initiale
  const totalAvance = (validatedData.avance_declare || 0) + (validatedData.avance_non_declare || 0);
  if (totalAvance > 0) {
    await query(
      `INSERT INTO payment_plans (
         sale_id, user_id, numero_echeance, description, montant_prevu, montant_paye,
         date_prevue, date_paiement, mode_paiement, montant_espece, montant_cheque, statut
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        sale.id,
        req.user!.userId,
        1, // Premier paiement
        'Avance initiale (premier paiement)',
        totalAvance,
        totalAvance, // Montant payé = montant prévu car c'est déjà payé
        new Date().toISOString().split('T')[0], // Date prévue = aujourd'hui
        new Date().toISOString(), // Date de paiement = maintenant (timestamp)
        validatedData.mode_paiement,
        validatedData.avance_espece || 0,
        validatedData.avance_cheque || 0,
        'paye' // Statut payé car c'est l'avance initiale
      ]
    );
  }

  // CORRECTION: Créer automatiquement les chèques si le mode de paiement inclut des chèques
  if ((validatedData.mode_paiement === 'cheque' || validatedData.mode_paiement === 'cheque_espece') &&
      validatedData.avance_cheque > 0) {

    // Vérifier si des chèques détaillés sont fournis
    if (validatedData.cheques && validatedData.cheques.length > 0) {
      // Créer les chèques avec les détails fournis
      for (const chequeDetail of validatedData.cheques) {
        const chequeData = {
          user_id: req.user!.userId,
          project_id: validatedData.project_id,
          sale_id: sale.id,
          type_cheque: 'recu',
          montant: chequeDetail.montant,
          numero_cheque: chequeDetail.numero, // CORRECTION: Utiliser le vrai numéro
          nom_beneficiaire: 'Promoteur',
          nom_emetteur: validatedData.client_nom,
          date_emission: chequeDetail.date_echeance || new Date().toISOString().split('T')[0],
          statut: 'emis',
          description: `Chèque pour la vente de ${validatedData.unite_numero}`,
          banque: chequeDetail.banque
        };

        await query(
          `INSERT INTO checks (
             user_id, project_id, sale_id, type_cheque, montant,
             numero_cheque, nom_beneficiaire, nom_emetteur, date_emission,
             statut, description
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            chequeData.user_id,
            chequeData.project_id,
            chequeData.sale_id,
            chequeData.type_cheque,
            chequeData.montant,
            chequeData.numero_cheque,
            chequeData.nom_beneficiaire,
            chequeData.nom_emetteur,
            chequeData.date_emission,
            chequeData.statut,
            `${chequeData.description} - Banque: ${chequeData.banque || 'Non spécifiée'}`
          ]
        );
      }
    } else {
      // Créer un chèque automatique seulement si aucun détail n'est fourni
      const chequeData = {
        user_id: req.user!.userId,
        project_id: validatedData.project_id,
        sale_id: sale.id,
        type_cheque: 'recu',
        montant: validatedData.avance_cheque,
        numero_cheque: `CHQ-${sale.id}-001`, // Numéro automatique seulement en dernier recours
        nom_beneficiaire: 'Promoteur',
        nom_emetteur: validatedData.client_nom,
        date_emission: new Date().toISOString().split('T')[0],
        statut: 'emis',
        description: `Chèque d'avance pour la vente de ${validatedData.unite_numero}`
      };

      await query(
        `INSERT INTO checks (
           user_id, project_id, sale_id, type_cheque, montant,
           numero_cheque, nom_beneficiaire, nom_emetteur, date_emission,
           statut, description
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          chequeData.user_id,
          chequeData.project_id,
          chequeData.sale_id,
          chequeData.type_cheque,
          chequeData.montant,
          chequeData.numero_cheque,
          chequeData.nom_beneficiaire,
          chequeData.nom_emetteur,
          chequeData.date_emission,
          chequeData.statut,
          chequeData.description
        ]
      );
    }
  }

  const response: ApiResponse = {
    success: true,
    data: sale,
    message: 'Vente créée avec succès'
  };

  res.status(201).json(response);
}));

// Mettre à jour une vente
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Vérifier que la vente appartient à l'utilisateur
  const existingSale = await query(
    'SELECT id, project_id FROM sales WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (existingSale.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  // Construire la requête de mise à jour dynamiquement
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'client_nom', 'client_telephone', 'client_email', 'client_adresse',
    'surface', 'prix_total', 'description', 'statut', 'mode_paiement',
    'avance_declare', 'avance_non_declare', 'avance_cheque', 'avance_espece'
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
    `UPDATE sales
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Vente mise à jour avec succès'
  };

  res.json(response);
}));

// Supprimer une vente
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM sales WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Vente supprimée avec succès'
  };

  res.json(response);
}));

export default router;
