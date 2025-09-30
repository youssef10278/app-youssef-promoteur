import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createProjectSchema, updateProjectSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Project, CreateProjectRequest } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir les statistiques globales des projets avec filtres de date
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
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
       COUNT(*) as total_projects,
       COALESCE(SUM(surface_totale), 0) as total_surface,
       COALESCE(SUM(nombre_lots), 0) as total_lots,
       COALESCE(AVG(surface_totale), 0) as average_surface
     FROM projects
     ${whereClause}`,
    params
  );

  const stats = result.rows[0];
  const response: ApiResponse = {
    success: true,
    data: {
      totalProjects: parseInt(stats.total_projects),
      totalSurface: parseFloat(stats.total_surface),
      totalLots: parseInt(stats.total_lots),
      averageSurface: parseFloat(stats.average_surface)
    }
  };

  res.json(response);
}));

// Obtenir tous les projets de l'utilisateur
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, user_id, nom, localisation, societe, surface_totale, 
            nombre_lots, nombre_appartements, nombre_garages, description,
            created_at, updated_at
     FROM projects 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Obtenir un projet spécifique
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT id, user_id, nom, localisation, societe, surface_totale, 
            nombre_lots, nombre_appartements, nombre_garages, description,
            created_at, updated_at
     FROM projects 
     WHERE id = $1 AND user_id = $2`,
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Créer un nouveau projet
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createProjectSchema, req.body) as CreateProjectRequest;

  const result = await query(
    `INSERT INTO projects (user_id, nom, localisation, societe, surface_totale, 
                          nombre_lots, nombre_appartements, nombre_garages, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, user_id, nom, localisation, societe, surface_totale, 
               nombre_lots, nombre_appartements, nombre_garages, description,
               created_at, updated_at`,
    [
      req.user!.userId,
      validatedData.nom,
      validatedData.localisation,
      validatedData.societe,
      validatedData.surface_totale,
      validatedData.nombre_lots,
      validatedData.nombre_appartements,
      validatedData.nombre_garages,
      validatedData.description
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Projet créé avec succès'
  };

  res.status(201).json(response);
}));

// Mettre à jour un projet
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = validate(updateProjectSchema, req.body);

  // Vérifier que le projet appartient à l'utilisateur et récupérer les données actuelles
  const existingProject = await query(
    'SELECT id, nombre_lots, nombre_appartements, nombre_garages FROM projects WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (existingProject.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const currentProject = existingProject.rows[0];

  // Vérifier s'il y a des modifications des nombres d'unités
  const hasUnitChanges = 
    (validatedData.nombre_lots !== undefined && validatedData.nombre_lots !== currentProject.nombre_lots) ||
    (validatedData.nombre_appartements !== undefined && validatedData.nombre_appartements !== currentProject.nombre_appartements) ||
    (validatedData.nombre_garages !== undefined && validatedData.nombre_garages !== currentProject.nombre_garages);

  if (hasUnitChanges) {
    // Vérifier s'il y a des ventes existantes pour ce projet
    const salesCheck = await query(
      'SELECT COUNT(*) as total_sales FROM sales WHERE project_id = $1',
      [id]
    );

    const totalSales = parseInt(salesCheck.rows[0].total_sales);

    if (totalSales > 0) {
      // Récupérer les détails des ventes pour un message d'erreur plus informatif
      const salesDetails = await query(
        `SELECT 
           COUNT(CASE WHEN type_propriete = 'appartement' THEN 1 END) as appartements_vendus,
           COUNT(CASE WHEN type_propriete = 'garage' THEN 1 END) as garages_vendus
         FROM sales 
         WHERE project_id = $1`,
        [id]
      );

      const sales = salesDetails.rows[0];
      const appartementsVendus = parseInt(sales.appartements_vendus);
      const garagesVendus = parseInt(sales.garages_vendus);

      // Vérifier les incohérences spécifiques
      const newAppartements = validatedData.nombre_appartements !== undefined ? validatedData.nombre_appartements : currentProject.nombre_appartements;
      const newGarages = validatedData.nombre_garages !== undefined ? validatedData.nombre_garages : currentProject.nombre_garages;
      const newLots = validatedData.nombre_lots !== undefined ? validatedData.nombre_lots : currentProject.nombre_lots;

      let errorMessage = 'Impossible de modifier le nombre d\'unités car des ventes existent déjà :\n';
      let hasInconsistency = false;

      if (appartementsVendus > 0 && newAppartements < appartementsVendus) {
        errorMessage += `• ${appartementsVendus} appartement(s) vendu(s) mais seulement ${newAppartements} disponible(s)\n`;
        hasInconsistency = true;
      }

      if (garagesVendus > 0 && newGarages < garagesVendus) {
        errorMessage += `• ${garagesVendus} garage(s) vendu(s) mais seulement ${newGarages} disponible(s)\n`;
        hasInconsistency = true;
      }

      if (hasInconsistency) {
        errorMessage += '\nSolutions possibles :\n';
        errorMessage += '• Annuler les ventes concernées avant de modifier le projet\n';
        errorMessage += '• Créer un nouveau projet avec la nouvelle configuration\n';
        errorMessage += '• Augmenter le nombre d\'unités au lieu de le diminuer';

        throw createError(errorMessage, 400);
      }
    }
  }

  // Construire la requête de mise à jour dynamiquement
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(validatedData)) {
    if (value !== undefined) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw createError('Aucune donnée à mettre à jour', 400);
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(id, req.user!.userId);

  const result = await query(
    `UPDATE projects 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING id, user_id, nom, localisation, societe, surface_totale, 
               nombre_lots, nombre_appartements, nombre_garages, description,
               created_at, updated_at`,
    values
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Projet mis à jour avec succès'
  };

  res.json(response);
}));

// Supprimer un projet
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que le projet appartient à l'utilisateur
  const result = await query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Projet supprimé avec succès'
  };

  res.json(response);
}));

// Obtenir les statistiques d'un projet
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  // Obtenir les statistiques des ventes
  const salesStats = await query(
    `SELECT 
       COUNT(*) as total_ventes,
       COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as ventes_en_cours,
       COUNT(CASE WHEN statut = 'termine' THEN 1 END) as ventes_terminees,
       COALESCE(SUM(prix_total), 0) as chiffre_affaires_total,
       COALESCE(SUM(avance_total), 0) as avances_recues
     FROM sales 
     WHERE project_id = $1`,
    [id]
  );

  // Obtenir les statistiques des dépenses
  const expensesStats = await query(
    `SELECT 
       COUNT(*) as total_depenses,
       COALESCE(SUM(montant_declare), 0) as montant_declare_total,
       COALESCE(SUM(montant_non_declare), 0) as montant_non_declare_total,
       COALESCE(SUM(montant_declare + montant_non_declare), 0) as montant_total
     FROM expenses 
     WHERE project_id = $1`,
    [id]
  );

  const response: ApiResponse = {
    success: true,
    data: {
      ventes: salesStats.rows[0],
      depenses: expensesStats.rows[0]
    }
  };

  res.json(response);
}));

export default router;
