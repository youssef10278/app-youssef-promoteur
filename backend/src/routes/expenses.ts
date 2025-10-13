import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createExpenseSchema, createSimpleExpenseSchema, createExpensePaymentSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, Expense } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir toutes les dépenses de l'utilisateur
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('🔍 GET / - userId:', req.user!.userId);

  const result = await query(
    `SELECT ewt.*, p.nom as project_nom, ewt.methode_paiement as mode_paiement
     FROM expenses_with_totals ewt
     LEFT JOIN projects p ON ewt.project_id = p.id
     WHERE ewt.user_id = $1
     ORDER BY ewt.created_at DESC`,
    [req.user!.userId]
  );

  console.log('🔍 Dépenses récupérées:', result.rows.length);
  if (result.rows.length > 0) {
    console.log('🔍 Première dépense:', {
      id: result.rows[0].id,
      nom: result.rows[0].nom,
      project_id: result.rows[0].project_id,
      project_nom: result.rows[0].project_nom
    });
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Obtenir les dépenses d'un projet spécifique
router.get('/project/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const result = await query(
    `SELECT ewt.*, p.nom as project_nom, ewt.methode_paiement as mode_paiement
     FROM expenses_with_totals ewt
     LEFT JOIN projects p ON ewt.project_id = p.id
     WHERE ewt.project_id = $1 AND ewt.user_id = $2
     ORDER BY ewt.created_at DESC`,
    [projectId, req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// ==================== ROUTES SPÉCIFIQUES (AVANT LES PARAMÈTRES) ====================

// Route de debug temporaire
router.get('/debug', asyncHandler(async (req: Request, res: Response) => {
  console.log('🔍 DEBUG - userId:', req.user!.userId);

  const expensesResult = await query(
    `SELECT e.id, e.nom, e.project_id, e.montant_declare, e.montant_non_declare, p.nom as project_nom
     FROM expenses e
     LEFT JOIN projects p ON e.project_id = p.id
     WHERE e.user_id = $1`,
    [req.user!.userId]
  );

  const projectsResult = await query(
    `SELECT id, nom FROM projects WHERE user_id = $1`,
    [req.user!.userId]
  );

  console.log('🔍 DEBUG - Dépenses:', expensesResult.rows);
  console.log('🔍 DEBUG - Projets:', projectsResult.rows);

  res.json({
    success: true,
    data: {
      expenses: expensesResult.rows,
      projects: projectsResult.rows
    }
  });
}));

// Obtenir les statistiques globales des dépenses avec filtres de date
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
       COUNT(*) as total_expenses,
       COALESCE(SUM(montant_declare + montant_non_declare), 0) as total_amount,
       COALESCE(SUM(montant_declare), 0) as declared_amount,
       COALESCE(SUM(montant_non_declare), 0) as undeclared_amount
     FROM expenses
     ${whereClause}`,
    params
  );

  const stats = result.rows[0];
  const response: ApiResponse = {
    success: true,
    data: {
      totalExpenses: parseInt(stats.total_expenses),
      totalAmount: parseFloat(stats.total_amount),
      declaredAmount: parseFloat(stats.declared_amount),
      undeclaredAmount: parseFloat(stats.undeclared_amount),
      byPaymentMode: {} // TODO: Implémenter si nécessaire
    }
  };

  res.json(response);
}));

// Obtenir les analytics complètes des dépenses
router.get('/analytics', asyncHandler(async (req: Request, res: Response) => {
  console.log('🔍 Route /analytics appelée pour user:', req.user?.userId);

  try {
    // Récupérer toutes les dépenses de l'utilisateur
    console.log('🔍 Analytics globales - userId:', req.user!.userId);

    const expensesResult = await query(
      `SELECT e.*, p.nom as project_nom, e.methode_paiement as mode_paiement
       FROM expenses e
       LEFT JOIN projects p ON e.project_id = p.id
       WHERE e.user_id = $1`,
      [req.user!.userId]
    );

    const expenses = expensesResult.rows;
    console.log('🔍 Total dépenses trouvées:', expenses.length);
    if (expenses.length > 0) {
      console.log('🔍 Exemple de dépense:', {
        id: expenses[0].id,
        nom: expenses[0].nom,
        project_id: expenses[0].project_id,
        project_nom: expenses[0].project_nom,
        montant_declare: expenses[0].montant_declare,
        montant_non_declare: expenses[0].montant_non_declare
      });
    }

    // Calculer les analytics
    const totalExpenses = expenses.length;
    const montantDeclareTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.montant_declare) || 0), 0);
    const montantNonDeclareTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.montant_non_declare) || 0), 0);
    const montantTotalDepenses = montantDeclareTotal + montantNonDeclareTotal;

    // Calculer les pourcentages
    const pourcentageDeclare = montantTotalDepenses > 0 ? (montantDeclareTotal / montantTotalDepenses) * 100 : 0;
    const pourcentageNonDeclare = montantTotalDepenses > 0 ? (montantNonDeclareTotal / montantTotalDepenses) * 100 : 0;

    // Calculer les modes de paiement
    const modesPaiement: Record<string, { nombre: number; montant: number; pourcentage: number }> = {
      espece: { nombre: 0, montant: 0, pourcentage: 0 },
      cheque: { nombre: 0, montant: 0, pourcentage: 0 },
      cheque_espece: { nombre: 0, montant: 0, pourcentage: 0 },
      virement: { nombre: 0, montant: 0, pourcentage: 0 }
    };

    // Calculer les statistiques temporelles
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let depensesCeMois = 0;
    let montantCeMois = 0;
    let depensesCetteAnnee = 0;
    let montantCetteAnnee = 0;

    // Calculer la répartition par projet
    const projetsMap = new Map();

    expenses.forEach(exp => {
      const montant = (parseFloat(exp.montant_declare) || 0) + (parseFloat(exp.montant_non_declare) || 0);
      const methode = exp.methode_paiement || 'espece';
      const dateCreation = new Date(exp.created_at);

      // Modes de paiement
      if (modesPaiement[methode]) {
        modesPaiement[methode].nombre++;
        modesPaiement[methode].montant += montant;
      }

      // Statistiques temporelles
      if (dateCreation.getMonth() === currentMonth && dateCreation.getFullYear() === currentYear) {
        depensesCeMois++;
        montantCeMois += montant;
      }

      if (dateCreation.getFullYear() === currentYear) {
        depensesCetteAnnee++;
        montantCetteAnnee += montant;
      }

      // Répartition par projet
      const projectId = exp.project_id;
      const projectNom = exp.project_nom || 'Projet inconnu';
      
      if (!projetsMap.has(projectId)) {
        projetsMap.set(projectId, {
          project_id: projectId,
          project_nom: projectNom,
          nombre_depenses: 0,
          montant_total: 0,
          montant_declare: 0,
          montant_non_declare: 0,
          pourcentage_du_total: 0
        });
      }

      const projet = projetsMap.get(projectId);
      projet.nombre_depenses++;
      projet.montant_total += montant;
      projet.montant_declare += parseFloat(exp.montant_declare) || 0;
      projet.montant_non_declare += parseFloat(exp.montant_non_declare) || 0;
    });

    // Calculer les pourcentages des modes de paiement
    Object.keys(modesPaiement).forEach(mode => {
      modesPaiement[mode].pourcentage = montantTotalDepenses > 0
        ? Math.round((modesPaiement[mode].montant / montantTotalDepenses) * 100 * 100) / 100
        : 0;
    });

    // Calculer les pourcentages pour les projets
    const parProjet = Array.from(projetsMap.values()).map(projet => ({
      ...projet,
      pourcentage_du_total: montantTotalDepenses > 0 
        ? Math.round((projet.montant_total / montantTotalDepenses) * 100 * 100) / 100
        : 0
    })).sort((a, b) => b.montant_total - a.montant_total);

    // Calculer les moyennes
    const montantMoyenParDepense = totalExpenses > 0 
      ? Math.round((montantTotalDepenses / totalExpenses) * 100) / 100 
      : 0;
    const montantMoyenParProjet = parProjet.length > 0 
      ? Math.round((montantTotalDepenses / parProjet.length) * 100) / 100 
      : 0;

    const response: ApiResponse = {
      success: true,
      data: {
        total_depenses: totalExpenses,
        montant_total_depenses: montantTotalDepenses,
        montant_declare_total: montantDeclareTotal,
        montant_non_declare_total: montantNonDeclareTotal,
        pourcentage_declare: Math.round(pourcentageDeclare * 100) / 100,
        pourcentage_non_declare: Math.round(pourcentageNonDeclare * 100) / 100,
        modes_paiement: modesPaiement,
        par_projet: parProjet,
        depenses_ce_mois: depensesCeMois,
        montant_ce_mois: montantCeMois,
        depenses_cette_annee: depensesCetteAnnee,
        montant_cette_annee: montantCetteAnnee,
        montant_moyen_par_depense: montantMoyenParDepense,
        montant_moyen_par_projet: montantMoyenParProjet
      }
    };

    console.log('✅ Analytics calculées:', response.data);
    res.json(response);
  } catch (error) {
    console.error('❌ Erreur dans /analytics:', error);
    throw error;
  }
}));

// Obtenir les analytics des dépenses par projet
router.get('/analytics/project/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  // Récupérer les dépenses du projet spécifique
  console.log('🔍 Analytics par projet - Paramètres:', {
    userId: req.user!.userId,
    projectId: projectId,
    projectIdType: typeof projectId
  });
  // Récupérer les dépenses du projet
  const expensesResult = await query(
    `SELECT e.*, p.nom as project_nom
     FROM expenses e
     LEFT JOIN projects p ON e.project_id = p.id
     WHERE e.user_id = $1 AND e.project_id = $2`,
    [req.user!.userId, projectId]
  );

  // Calculer les analytics pour ce projet
  const analyticsQuery = `
    SELECT
      COUNT(*) AS total_depenses,
      COALESCE(SUM(montant_declare), 0) AS montant_declare_total,
      COALESCE(SUM(montant_non_declare), 0) AS montant_non_declare_total,
      COALESCE(SUM(montant_declare + montant_non_declare), 0) AS montant_total_depenses,

      COUNT(CASE WHEN date_part('month', created_at) = date_part('month', CURRENT_DATE) AND date_part('year', created_at) = date_part('year', CURRENT_DATE) THEN 1 END) AS depenses_ce_mois,
      COALESCE(SUM(CASE WHEN date_part('month', created_at) = date_part('month', CURRENT_DATE) AND date_part('year', created_at) = date_part('year', CURRENT_DATE) THEN montant_declare + montant_non_declare ELSE 0 END), 0) AS montant_ce_mois,

      COUNT(CASE WHEN date_part('year', created_at) = date_part('year', CURRENT_DATE) THEN 1 END) AS depenses_cette_annee,
      COALESCE(SUM(CASE WHEN date_part('year', created_at) = date_part('year', CURRENT_DATE) THEN montant_declare + montant_non_declare ELSE 0 END), 0) AS montant_cette_annee
    FROM expenses
    WHERE user_id = $1 AND project_id = $2
  `;

  const analyticsResult = await query(analyticsQuery,
    [req.user!.userId, projectId]
  );

  const expenses = expensesResult.rows;
  console.log('🔍 Dépenses trouvées pour le projet:', expenses.length);
  const stats = analyticsResult.rows[0];

  // Utiliser les données calculées par la base de données
  const totalExpenses = parseInt(stats.total_depenses);
  const montantDeclareTotal = parseFloat(stats.montant_declare_total);
  const montantNonDeclareTotal = parseFloat(stats.montant_non_declare_total);
  const montantTotalDepenses = parseFloat(stats.montant_total_depenses);

  // Calculer les pourcentages
  const pourcentageDeclare = montantTotalDepenses > 0 ? (montantDeclareTotal / montantTotalDepenses) * 100 : 0;
  const pourcentageNonDeclare = montantTotalDepenses > 0 ? (montantNonDeclareTotal / montantTotalDepenses) * 100 : 0;

  // Calculer les modes de paiement
  const modesPaiement: Record<string, { nombre: number; montant: number; pourcentage: number }> = {
    espece: { nombre: 0, montant: 0, pourcentage: 0 },
    cheque: { nombre: 0, montant: 0, pourcentage: 0 },
    cheque_espece: { nombre: 0, montant: 0, pourcentage: 0 },
    virement: { nombre: 0, montant: 0, pourcentage: 0 }
  };

  // Calculer les statistiques temporelles
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  let depensesCeMois = 0;
  let montantCeMois = 0;
  let depensesCetteAnnee = 0;
  let montantCetteAnnee = 0;

  expenses.forEach(exp => {
    const montant = (parseFloat(exp.montant_declare) || 0) + (parseFloat(exp.montant_non_declare) || 0);
    const methode = exp.methode_paiement || 'espece';
    const dateCreation = new Date(exp.created_at);

    // Modes de paiement
    if (modesPaiement[methode]) {
      modesPaiement[methode].nombre++;
      modesPaiement[methode].montant += montant;
    }

    // Statistiques temporelles
    if (dateCreation.getMonth() === currentMonth && dateCreation.getFullYear() === currentYear) {
      depensesCeMois++;
      montantCeMois += montant;
    }

    if (dateCreation.getFullYear() === currentYear) {
      depensesCetteAnnee++;
      montantCetteAnnee += montant;
    }
  });

  // Calculer les pourcentages des modes de paiement
  Object.keys(modesPaiement).forEach(mode => {
    modesPaiement[mode].pourcentage = montantTotalDepenses > 0
      ? Math.round((modesPaiement[mode].montant / montantTotalDepenses) * 100 * 100) / 100
      : 0;
  });

  // Calculer la moyenne par dépense
  const montantMoyenParDepense = totalExpenses > 0
    ? Math.round((montantTotalDepenses / totalExpenses) * 100) / 100
    : 0;

  const response: ApiResponse = {
    success: true,
    data: {
      total_depenses: totalExpenses,
      montant_total_depenses: montantTotalDepenses,
      montant_declare_total: montantDeclareTotal,
      montant_non_declare_total: montantNonDeclareTotal,
      pourcentage_declare: Math.round(pourcentageDeclare * 100) / 100,
      pourcentage_non_declare: Math.round(pourcentageNonDeclare * 100) / 100,
      modes_paiement: modesPaiement,
      depenses_ce_mois: parseInt(stats.depenses_ce_mois),
      montant_ce_mois: parseFloat(stats.montant_ce_mois),
      depenses_cette_annee: parseInt(stats.depenses_cette_annee),
      montant_cette_annee: parseFloat(stats.montant_cette_annee),
      montant_moyen_par_depense: montantMoyenParDepense
    }
  };

  console.log('✅ Analytics par projet calculées:', response.data);
  res.json(response);
}));

// ==================== ROUTES AVEC PARAMÈTRES ====================

// Obtenir les statistiques des dépenses par projet
router.get('/stats/project/:projectId', asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const result = await query(
    `SELECT
       COUNT(*) as total_depenses,
       COALESCE(SUM(montant_declare), 0) as total_declare,
       COALESCE(SUM(montant_non_declare), 0) as total_non_declare,
       COALESCE(SUM(montant_declare + montant_non_declare), 0) as total_general,
       COUNT(CASE WHEN methode_paiement = 'espece' THEN 1 END) as paiements_espece,
       COUNT(CASE WHEN methode_paiement = 'cheque' THEN 1 END) as paiements_cheque,
       COUNT(CASE WHEN methode_paiement = 'cheque_et_espece' THEN 1 END) as paiements_mixtes
     FROM expenses
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Obtenir une dépense spécifique
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT e.*, p.nom as project_nom, e.methode_paiement as mode_paiement
     FROM expenses e
     LEFT JOIN projects p ON e.project_id = p.id
     WHERE e.id = $1 AND e.user_id = $2`,
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// Créer une nouvelle dépense
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createExpenseSchema, req.body);

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [validatedData.project_id, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const result = await query(
    `INSERT INTO expenses (
       project_id, user_id, nom, montant_declare, montant_non_declare, 
       methode_paiement, description
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      validatedData.project_id,
      req.user!.userId,
      validatedData.nom,
      validatedData.montant_declare,
      validatedData.montant_non_declare,
      validatedData.mode_paiement, // Utiliser mode_paiement du frontend
      validatedData.description
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Dépense créée avec succès'
  };

  res.status(201).json(response);
}));

// Créer une dépense simple (sans montant initial)
router.post('/create-simple', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createSimpleExpenseSchema, req.body);

  // Vérifier que le projet appartient à l'utilisateur
  const projectCheck = await query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [validatedData.project_id, req.user!.userId]
  );

  if (projectCheck.rows.length === 0) {
    throw createError('Projet non trouvé', 404);
  }

  const result = await query(
    `INSERT INTO expenses (
       project_id, user_id, nom, description, statut,
       montant_declare, montant_non_declare, montant_total,
       methode_paiement
     )
     VALUES ($1, $2, $3, $4, 'actif', 0, 0, 0, 'espece')
     RETURNING *`,
    [
      validatedData.project_id,
      req.user!.userId,
      validatedData.nom,
      validatedData.description || ''
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Dépense créée avec succès'
  };

  res.status(201).json(response);
}));

// Récupérer une dépense avec ses paiements
router.get('/:id/with-payments', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  // Récupérer la dépense avec les totaux calculés
  const expenseResult = await query(
    `SELECT * FROM expenses_with_totals WHERE id = $1`,
    [id]
  );

  // Récupérer les paiements
  const paymentsResult = await query(
    `SELECT * FROM expense_payments
     WHERE expense_id = $1
     ORDER BY date_paiement DESC, created_at DESC`,
    [id]
  );

  const expenseWithPayments = {
    ...expenseResult.rows[0],
    payments: paymentsResult.rows
  };

  const response: ApiResponse = {
    success: true,
    data: expenseWithPayments
  };

  res.json(response);
}));

// Ajouter un paiement à une dépense
router.post('/:id/payments', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = validate(createExpensePaymentSchema, req.body);

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT id, statut FROM expenses WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const expense = expenseCheck.rows[0];

  // Vérifier que la dépense est active
  if (expense.statut === 'annule') {
    throw createError('Impossible d\'ajouter un paiement à une dépense annulée', 400);
  }

  // Créer le paiement
  const result = await query(
    `INSERT INTO expense_payments (
       expense_id, user_id, montant_paye, montant_declare, montant_non_declare,
       date_paiement, mode_paiement, description, reference_paiement
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      req.user!.userId,
      validatedData.montant_paye,
      validatedData.montant_declare,
      validatedData.montant_non_declare,
      validatedData.date_paiement,
      validatedData.mode_paiement,
      validatedData.description || '',
      validatedData.reference_paiement || null
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Paiement ajouté avec succès'
  };

  res.status(201).json(response);
}));

// Récupérer les paiements d'une dépense
router.get('/:id/payments', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const result = await query(
    `SELECT * FROM expense_payments
     WHERE expense_id = $1
     ORDER BY date_paiement DESC, created_at DESC`,
    [id]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Modifier un paiement de dépense
router.put('/payments/:paymentId', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const validatedData = validate(createExpensePaymentSchema, req.body);

  // Vérifier que le paiement appartient à l'utilisateur
  const paymentCheck = await query(
    `SELECT ep.*, e.statut as expense_statut
     FROM expense_payments ep
     JOIN expenses e ON ep.expense_id = e.id
     WHERE ep.id = $1 AND ep.user_id = $2`,
    [paymentId, req.user!.userId]
  );

  if (paymentCheck.rows.length === 0) {
    throw createError('Paiement non trouvé', 404);
  }

  const payment = paymentCheck.rows[0];

  // Vérifier que la dépense n'est pas annulée
  if (payment.expense_statut === 'annule') {
    throw createError('Impossible de modifier un paiement d\'une dépense annulée', 400);
  }

  // Mettre à jour le paiement
  const result = await query(
    `UPDATE expense_payments
     SET montant_paye = $1, montant_declare = $2, montant_non_declare = $3,
         date_paiement = $4, mode_paiement = $5, description = $6,
         reference_paiement = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      validatedData.montant_paye,
      validatedData.montant_declare,
      validatedData.montant_non_declare,
      validatedData.date_paiement,
      validatedData.mode_paiement,
      validatedData.description || '',
      validatedData.reference_paiement || null,
      paymentId
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Paiement modifié avec succès'
  };

  res.json(response);
}));

// Supprimer un paiement de dépense
router.delete('/payments/:paymentId', asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = req.params;

  // Vérifier que le paiement appartient à l'utilisateur
  const paymentCheck = await query(
    `SELECT ep.*, e.statut as expense_statut
     FROM expense_payments ep
     JOIN expenses e ON ep.expense_id = e.id
     WHERE ep.id = $1 AND ep.user_id = $2`,
    [paymentId, req.user!.userId]
  );

  if (paymentCheck.rows.length === 0) {
    throw createError('Paiement non trouvé', 404);
  }

  const payment = paymentCheck.rows[0];

  // Vérifier que la dépense n'est pas annulée
  if (payment.expense_statut === 'annule') {
    throw createError('Impossible de supprimer un paiement d\'une dépense annulée', 400);
  }

  // Supprimer le paiement
  await query('DELETE FROM expense_payments WHERE id = $1', [paymentId]);

  const response: ApiResponse = {
    success: true,
    message: 'Paiement supprimé avec succès'
  };

  res.json(response);
}));

// Changer le statut d'une dépense
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { statut } = req.body;

  // Valider le statut
  if (!['actif', 'termine', 'annule'].includes(statut)) {
    throw createError('Statut invalide', 400);
  }

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  // Mettre à jour le statut
  const result = await query(
    'UPDATE expenses SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [statut, id]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: `Dépense marquée comme ${statut}`
  };

  res.json(response);
}));

// Mettre à jour une dépense
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Vérifier que la dépense appartient à l'utilisateur
  const existingExpense = await query(
    'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (existingExpense.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  // Construire la requête de mise à jour
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'nom', 'montant_declare', 'montant_non_declare', 'mode_paiement', 'description'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      // Mapper mode_paiement vers methode_paiement pour la base de données
      const dbField = field === 'mode_paiement' ? 'methode_paiement' : field;
      updateFields.push(`${dbField} = $${paramIndex}`);
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
    `UPDATE expenses 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Dépense mise à jour avec succès'
  };

  res.json(response);
}));

// Supprimer une dépense
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Dépense supprimée avec succès'
  };

  res.json(response);
}));

export default router;
