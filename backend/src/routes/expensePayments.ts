import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createPaymentSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir tous les plans de paiement d'une dépense
router.get('/plans/expense/:expenseId', asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;

  console.log('🔍 [GET /plans/expense/:expenseId] START');
  console.log('🔍 Expense ID:', expenseId);
  console.log('🔍 User ID:', req.user!.userId);

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT id, nom, montant_total FROM expenses WHERE id = $1 AND user_id = $2',
    [expenseId, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const result = await query(
    `SELECT * FROM expense_payment_plans 
     WHERE expense_id = $1 AND user_id = $2 
     ORDER BY numero_echeance ASC`,
    [expenseId, req.user!.userId]
  );

  console.log('🔍 Plans de paiement trouvés:', result.rows.length);

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Créer un nouveau plan de paiement pour une dépense
router.post('/plans', asyncHandler(async (req: Request, res: Response) => {
  const paymentData = req.body;

  console.log('🔧 [POST /plans] START');
  console.log('🔧 User ID:', req.user!.userId);
  console.log('🔧 Payment Data:', JSON.stringify(paymentData, null, 2));

  // Vérifier que la dépense appartient à l'utilisateur
  const expenseCheck = await query(
    'SELECT id, nom, montant_total FROM expenses WHERE id = $1 AND user_id = $2',
    [paymentData.expense_id, req.user!.userId]
  );

  if (expenseCheck.rows.length === 0) {
    throw createError('Dépense non trouvée', 404);
  }

  const expense = expenseCheck.rows[0];

  // Calculer le prochain numéro d'échéance
  const existingPlansResult = await query(
    'SELECT COUNT(*) as count FROM expense_payment_plans WHERE expense_id = $1 AND user_id = $2',
    [paymentData.expense_id, req.user!.userId]
  );

  const nextEcheanceNumber = parseInt(existingPlansResult.rows[0].count) + 1;

  // Créer le plan de paiement
  const planResult = await query(
    `INSERT INTO expense_payment_plans (expense_id, user_id, numero_echeance, date_prevue, montant_prevu, 
                               montant_declare, montant_non_declare, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      paymentData.expense_id,
      req.user!.userId,
      nextEcheanceNumber,
      paymentData.date_paiement,
      paymentData.montant_paye,
      paymentData.montant_declare || 0,
      paymentData.montant_non_declare || 0,
      paymentData.notes || `Paiement #${nextEcheanceNumber} - ${expense.nom}`
    ]
  );

  const paymentPlan = planResult.rows[0];

  // Marquer le plan comme payé et mettre à jour les détails
  const updateResult = await query(
    `UPDATE expense_payment_plans 
     SET montant_paye = $1, 
         montant_declare = $2, 
         montant_non_declare = $3,
         date_paiement = $4,
         mode_paiement = $5,
         montant_espece = $6,
         montant_cheque = $7,
         statut = 'paye'
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [
      paymentData.montant_paye,
      paymentData.montant_declare || 0,
      paymentData.montant_non_declare || 0,
      paymentData.date_paiement,
      paymentData.mode_paiement,
      paymentData.montant_espece || 0,
      paymentData.montant_cheque || 0,
      paymentPlan.id,
      req.user!.userId
    ]
  );

  console.log('✅ [POST /plans] Plan de paiement créé:', updateResult.rows[0].id);

  // Créer les chèques associés si nécessaire
  if (paymentData.cheques && paymentData.cheques.length > 0) {
    console.log('🔧 [POST /plans] Création des chèques associés:', paymentData.cheques.length);

    for (const cheque of paymentData.cheques) {
      await query(
        `INSERT INTO checks (
          user_id, project_id, expense_id, type_cheque, montant, numero_cheque,
          nom_beneficiaire, nom_emetteur, date_emission, date_encaissement,
          statut, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          req.user!.userId,
          expense.project_id || null,
          paymentData.expense_id,
          'donne', // Chèque donné pour une dépense
          cheque.montant,
          cheque.numero_cheque,
          cheque.nom_beneficiaire,
          cheque.nom_emetteur,
          cheque.date_emission,
          cheque.date_encaissement || null,
          cheque.statut || 'emis',
          cheque.description || `Chèque pour ${expense.nom} - Paiement #${nextEcheanceNumber}`
        ]
      );
    }

    console.log('✅ [POST /plans] Chèques créés avec succès');
  }

  const response: ApiResponse = {
    success: true,
    data: updateResult.rows[0],
    message: 'Plan de paiement créé avec succès'
  };

  res.status(201).json(response);
}));

// Modifier un plan de paiement existant
router.put('/plans/:planId', asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.params;
  const paymentData = req.body;

  console.log('🔧 [PUT /plans/:planId] START');
  console.log('🔧 Plan ID:', planId);
  console.log('🔧 User ID:', req.user!.userId);
  console.log('🔧 Payment Data:', JSON.stringify(paymentData, null, 2));

  // Vérifier que le plan appartient à l'utilisateur et récupérer les infos de la dépense
  const planCheck = await query(
    `SELECT epp.id, epp.expense_id, epp.montant_paye as current_montant_paye,
            e.montant_total
     FROM expense_payment_plans epp
     LEFT JOIN expenses e ON epp.expense_id = e.id
     WHERE epp.id = $1 AND epp.user_id = $2`,
    [planId, req.user!.userId]
  );

  if (planCheck.rows.length === 0) {
    throw createError('Plan de paiement non trouvé', 404);
  }

  const plan = planCheck.rows[0];

  // Mettre à jour le plan de paiement
  const updateResult = await query(
    `UPDATE expense_payment_plans 
     SET montant_paye = $1, 
         montant_declare = $2, 
         montant_non_declare = $3,
         date_paiement = $4,
         mode_paiement = $5,
         montant_espece = $6,
         montant_cheque = $7,
         statut = 'paye',
         notes = $8,
         updated_at = NOW()
     WHERE id = $9 AND user_id = $10
     RETURNING *`,
    [
      paymentData.montant_paye,
      paymentData.montant_declare || 0,
      paymentData.montant_non_declare || 0,
      paymentData.date_paiement,
      paymentData.mode_paiement,
      paymentData.montant_espece || 0,
      paymentData.montant_cheque || 0,
      paymentData.notes || '',
      planId,
      req.user!.userId
    ]
  );

  console.log('✅ [PUT /plans/:planId] Plan de paiement mis à jour');

  const response: ApiResponse = {
    success: true,
    data: updateResult.rows[0],
    message: 'Plan de paiement mis à jour avec succès'
  };

  res.json(response);
}));

// Supprimer un plan de paiement avec logique intelligente
router.delete('/plans/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  console.log('🗑️ [DELETE /plans/:id] Suppression du paiement de dépense:', id);

  // Récupérer les informations du plan
  const planCheck = await query(
    'SELECT id, expense_id, numero_echeance FROM expense_payment_plans WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (planCheck.rows.length === 0) {
    throw createError('Plan de paiement non trouvé', 404);
  }

  const plan = planCheck.rows[0];
  console.log('🗑️ Plan trouvé:', plan);

  // Vérifier le nombre total de paiements pour cette dépense
  const allPaymentsResult = await query(
    'SELECT id, numero_echeance FROM expense_payment_plans WHERE expense_id = $1 AND user_id = $2 ORDER BY numero_echeance',
    [plan.expense_id, req.user!.userId]
  );

  const allPayments = allPaymentsResult.rows;
  console.log('🗑️ Nombre total de paiements pour cette dépense:', allPayments.length);

  if (allPayments.length === 1) {
    // CAS 1: Seul paiement → Supprimer toute la dépense
    console.log('🗑️ Suppression de toute la dépense (seul paiement)');

    // Supprimer les chèques associés à la dépense
    const checksDeleted = await query(
      'DELETE FROM checks WHERE expense_id = $1 AND user_id = $2 RETURNING id',
      [plan.expense_id, req.user!.userId]
    );

    console.log('🗑️ Chèques supprimés:', checksDeleted.rows.length);

    // Supprimer la dépense (cascade supprimera les plans de paiement)
    const expenseDeleted = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [plan.expense_id, req.user!.userId]
    );

    console.log('🗑️ Dépense supprimée:', expenseDeleted.rows.length > 0);

    res.json({
      success: true,
      message: `Dépense supprimée avec succès (dernier paiement)`,
      data: { expenseDeleted: true }
    });
  } else {
    // CAS 2: Plusieurs paiements → Supprimer le paiement et renuméroter
    console.log('🗑️ Suppression du paiement et renumérotation');

    // Supprimer les chèques pour ce paiement spécifique
    const checksDeleted = await query(
      `DELETE FROM checks WHERE expense_id = $1 AND user_id = $2 
       AND (description LIKE $3 OR description LIKE $4) RETURNING id`,
      [plan.expense_id, req.user!.userId, `%paiement #${plan.numero_echeance}%`, `%Paiement #${plan.numero_echeance}%`]
    );

    console.log('🗑️ Chèques supprimés pour ce paiement:', checksDeleted.rows.length);

    // Supprimer le plan de paiement
    const planDeleted = await query(
      'DELETE FROM expense_payment_plans WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user!.userId]
    );

    console.log('🗑️ Plan de paiement supprimé:', planDeleted.rows.length > 0);

    // Renuméroter les paiements suivants
    const paymentsToRenumber = allPayments.filter(p => p.numero_echeance > plan.numero_echeance);
    console.log('🗑️ Paiements à renuméroter:', paymentsToRenumber.length);

    for (const payment of paymentsToRenumber) {
      const newNumber = payment.numero_echeance - 1;
      await query(
        'UPDATE expense_payment_plans SET numero_echeance = $1 WHERE id = $2 AND user_id = $3',
        [newNumber, payment.id, req.user!.userId]
      );

      // Mettre à jour les descriptions des chèques associés
      await query(
        `UPDATE checks SET description = REPLACE(description, 'paiement #${payment.numero_echeance}', 'paiement #${newNumber}')
         WHERE expense_id = $1 AND user_id = $2 AND description LIKE '%paiement #${payment.numero_echeance}%'`,
        [plan.expense_id, req.user!.userId]
      );
    }

    res.json({
      success: true,
      message: `Paiement supprimé avec succès - Paiements renumérotés`,
      data: { expenseDeleted: false, paymentsRenumbered: paymentsToRenumber.length }
    });
  }
}));

export default router;
