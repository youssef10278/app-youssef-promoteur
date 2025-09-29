import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { validate, createPaymentPlanSchema, createPaymentSchema } from '../utils/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse, PaymentPlan } from '../types';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// ==================== PAIEMENTS OPTIMISÉS ====================

// Créer un paiement complet avec chèques en une seule requête
router.post('/complete-payment', asyncHandler(async (req: Request, res: Response) => {
  const { saleId, paymentData, cheques = [] } = req.body;

  // Vérifier que la vente appartient à l'utilisateur
  const saleCheck = await query(
    'SELECT id, project_id FROM sales WHERE id = $1 AND user_id = $2',
    [saleId, req.user!.userId]
  );

  if (saleCheck.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const sale = saleCheck.rows[0];

  // Obtenir le prochain numéro d'échéance
  const existingPlansResult = await query(
    'SELECT COUNT(*) as count FROM payment_plans WHERE sale_id = $1',
    [saleId]
  );
  const nextEcheanceNumber = parseInt(existingPlansResult.rows[0].count) + 1;

  // Créer le plan de paiement
  const planResult = await query(
    `INSERT INTO payment_plans (sale_id, user_id, numero_echeance, date_prevue, montant_prevu, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      saleId,
      req.user!.userId,
      nextEcheanceNumber,
      paymentData.date_paiement,
      paymentData.montant_paye,
      paymentData.notes || `Paiement #${nextEcheanceNumber}`
    ]
  );

  const paymentPlan = planResult.rows[0];

  // Créer les chèques si fournis
  const createdCheques = [];
  for (const cheque of cheques) {
    const chequeResult = await query(
      `INSERT INTO checks (user_id, project_id, sale_id, type_cheque, montant, numero_cheque, 
                          nom_beneficiaire, nom_emetteur, date_emission, date_encaissement, 
                          statut, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user!.userId,
        sale.project_id,
        saleId,
        'recu',
        cheque.montant,
        cheque.numero,
        paymentData.nom_beneficiaire || 'Promoteur',
        paymentData.nom_emetteur || 'Client',
        cheque.date_emission || paymentData.date_paiement,
        cheque.date_encaissement,
        'emis',
        cheque.notes || `Chèque pour paiement #${nextEcheanceNumber}`
      ]
    );
    createdCheques.push(chequeResult.rows[0]);
  }

  // Enregistrer le paiement
  await query(
    `UPDATE payment_plans 
     SET montant_paye = $1, date_paiement = $2, mode_paiement = $3, 
         montant_espece = $4, montant_cheque = $5, statut = 'paye'
     WHERE id = $6`,
    [
      paymentData.montant_paye,
      paymentData.date_paiement,
      paymentData.mode_paiement,
      paymentData.montant_espece || 0,
      paymentData.montant_cheque || 0,
      paymentPlan.id
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: {
      paymentPlan: {
        ...paymentPlan,
        montant_prevu: parseFloat(paymentPlan.montant_prevu || 0),
        montant_paye: parseFloat(paymentData.montant_paye || 0),
        montant_espece: parseFloat(paymentData.montant_espece || 0),
        montant_cheque: parseFloat(paymentData.montant_cheque || 0)
      },
      cheques: createdCheques
    },
    message: 'Paiement créé avec succès'
  };

  res.status(201).json(response);
}));

// ==================== PLANS DE PAIEMENT ====================

// Obtenir les plans de paiement d'une vente
router.get('/plans/sale/:saleId', asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;

  // Vérifier que la vente appartient à l'utilisateur
  const saleCheck = await query(
    'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
    [saleId, req.user!.userId]
  );

  if (saleCheck.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const result = await query(
    `SELECT pp.*, s.client_nom, s.unite_numero, p.nom as project_nom
     FROM payment_plans pp
     LEFT JOIN sales s ON pp.sale_id = s.id
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE pp.sale_id = $1 AND pp.user_id = $2
     ORDER BY pp.numero_echeance ASC`,
    [saleId, req.user!.userId]
  );

  // Convertir les valeurs numériques des plans de paiement
  const plansWithConvertedNumbers = result.rows.map(plan => ({
    ...plan,
    montant_prevu: parseFloat(plan.montant_prevu || 0),
    montant_paye: parseFloat(plan.montant_paye || 0),
    montant_espece: parseFloat(plan.montant_espece || 0),
    montant_cheque: parseFloat(plan.montant_cheque || 0)
  }));

  const response: ApiResponse = {
    success: true,
    data: plansWithConvertedNumbers
  };

  res.json(response);
}));

// Créer un plan de paiement
router.post('/plans', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validate(createPaymentPlanSchema, req.body);

  // Vérifier que la vente appartient à l'utilisateur
  const saleCheck = await query(
    'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
    [validatedData.sale_id, req.user!.userId]
  );

  if (saleCheck.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const result = await query(
    `INSERT INTO payment_plans (
       sale_id, user_id, numero_echeance, date_prevue, montant_prevu, description
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      validatedData.sale_id,
      req.user!.userId,
      validatedData.numero_echeance,
      validatedData.date_prevue,
      validatedData.montant_prevu,
      validatedData.description
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Plan de paiement créé avec succès'
  };

  res.status(201).json(response);
}));

// Obtenir les plans de paiement d'une vente spécifique
router.get('/plans/sale/:saleId', asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;

  // Vérifier que la vente appartient à l'utilisateur
  const saleCheck = await query(
    'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
    [saleId, req.user!.userId]
  );

  if (saleCheck.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const result = await query(
    `SELECT pp.*, s.client_nom, s.unite_numero, p.nom as project_nom
     FROM payment_plans pp
     LEFT JOIN sales s ON pp.sale_id = s.id
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE pp.sale_id = $1 AND pp.user_id = $2
     ORDER BY pp.numero_echeance ASC`,
    [saleId, req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Mettre à jour un plan de paiement (métadonnées uniquement)
router.put('/plans/:id/metadata', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Vérifier que le plan appartient à l'utilisateur
  const existingPlan = await query(
    'SELECT id FROM payment_plans WHERE id = $1 AND user_id = $2',
    [id, req.user!.userId]
  );

  if (existingPlan.rows.length === 0) {
    throw createError('Plan de paiement non trouvé', 404);
  }

  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'numero_echeance', 'date_prevue', 'montant_prevu', 'description', 'notes'
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
    `UPDATE payment_plans
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Plan de paiement mis à jour avec succès'
  };

  res.json(response);
}));

// Modifier un paiement existant (NOUVEAU) - SUPPRIMÉ (remplacé par l'endpoint plus complet ci-dessous)

// ==================== PAIEMENTS ====================

// Enregistrer un paiement
router.post('/pay/:planId', asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.params;
  const validatedData = validate(createPaymentSchema, { 
    ...req.body, 
    payment_plan_id: planId 
  });

  // Vérifier que le plan appartient à l'utilisateur
  const planCheck = await query(
    'SELECT id, montant_prevu, montant_paye, statut FROM payment_plans WHERE id = $1 AND user_id = $2',
    [planId, req.user!.userId]
  );

  if (planCheck.rows.length === 0) {
    throw createError('Plan de paiement non trouvé', 404);
  }

  const plan = planCheck.rows[0];

  // Vérifier que le plan n'est pas déjà payé
  if (plan.statut === 'paye') {
    throw createError('Ce plan de paiement est déjà payé', 400);
  }

  // Calculer le nouveau montant payé
  const nouveauMontantPaye = parseFloat(plan.montant_paye) + parseFloat(validatedData.montant_paye);
  const montantPrevu = parseFloat(plan.montant_prevu);

  // Déterminer le nouveau statut
  let nouveauStatut = 'en_attente';
  if (nouveauMontantPaye >= montantPrevu) {
    nouveauStatut = 'paye';
  } else if (nouveauMontantPaye > 0) {
    nouveauStatut = 'en_attente'; // Paiement partiel
  }

  // Mettre à jour le plan de paiement
  const result = await query(
    `UPDATE payment_plans 
     SET montant_paye = $1,
         date_paiement = NOW(),
         mode_paiement = $2,
         montant_espece = COALESCE(montant_espece, 0) + $3,
         montant_cheque = COALESCE(montant_cheque, 0) + $4,
         statut = $5,
         notes = COALESCE(notes, '') || CASE WHEN notes IS NOT NULL AND notes != '' THEN E'\n' ELSE '' END || $6,
         updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [
      nouveauMontantPaye,
      validatedData.mode_paiement,
      validatedData.montant_espece || 0,
      validatedData.montant_cheque || 0,
      nouveauStatut,
      validatedData.notes || `Paiement de ${validatedData.montant_paye} DH le ${new Date().toLocaleDateString()}`,
      planId,
      req.user!.userId
    ]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows[0],
    message: 'Paiement enregistré avec succès'
  };

  res.json(response);
}));

// Obtenir l'historique des paiements d'une vente
router.get('/history/sale/:saleId', asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;

  // Vérifier que la vente appartient à l'utilisateur
  const saleCheck = await query(
    'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
    [saleId, req.user!.userId]
  );

  if (saleCheck.rows.length === 0) {
    throw createError('Vente non trouvée', 404);
  }

  const result = await query(
    `SELECT pp.*, s.client_nom, s.unite_numero, p.nom as project_nom
     FROM payment_plans pp
     LEFT JOIN sales s ON pp.sale_id = s.id
     LEFT JOIN projects p ON s.project_id = p.id
     WHERE pp.sale_id = $1 AND pp.user_id = $2 AND pp.montant_paye > 0
     ORDER BY pp.date_paiement DESC`,
    [saleId, req.user!.userId]
  );

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// Obtenir les statistiques des paiements avec filtres de date
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
       COUNT(*) as total_plans,
       COUNT(CASE WHEN statut = 'paye' THEN 1 END) as plans_payes,
       COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as plans_en_attente,
       COUNT(CASE WHEN statut = 'en_retard' THEN 1 END) as plans_en_retard,
       COALESCE(SUM(montant_prevu), 0) as montant_total_prevu,
       COALESCE(SUM(montant_paye), 0) as montant_total_paye,
       COALESCE(SUM(montant_espece), 0) as total_especes,
       COALESCE(SUM(montant_cheque), 0) as total_cheques,
       COUNT(CASE WHEN date_prevue BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as upcoming_deadlines,
       COUNT(CASE WHEN statut = 'en_attente' AND date_prevue < CURRENT_DATE THEN 1 END) as pending_payments
     FROM payment_plans
     ${whereClause}`,
    params
  );

  const stats = result.rows[0];
  const response: ApiResponse = {
    success: true,
    data: {
      totalPlans: parseInt(stats.total_plans),
      paidPlans: parseInt(stats.plans_payes),
      pendingPlans: parseInt(stats.plans_en_attente),
      overduePlans: parseInt(stats.plans_en_retard),
      totalExpectedAmount: parseFloat(stats.montant_total_prevu),
      totalPaidAmount: parseFloat(stats.montant_total_paye),
      totalCashAmount: parseFloat(stats.total_especes),
      totalCheckAmount: parseFloat(stats.total_cheques),
      upcomingDeadlines: parseInt(stats.upcoming_deadlines),
      pendingPayments: parseInt(stats.pending_payments)
    }
  };

  res.json(response);
}));

// Supprimer un plan de paiement
router.delete('/plans/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM payment_plans WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, req.user!.userId]
  );

  if (result.rows.length === 0) {
    throw createError('Plan de paiement non trouvé', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Plan de paiement supprimé avec succès'
  };

  res.json(response);
}));

// Modifier un plan de paiement existant
router.put('/plans/:planId', asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.params;
  const paymentData = req.body;

  console.log('🔧 [PUT /plans/:planId] START');
  console.log('🔧 Plan ID:', planId);
  console.log('🔧 User ID:', req.user!.userId);
  console.log('🔧 Payment Data:', JSON.stringify(paymentData, null, 2));

  // Vérifier que le plan appartient à l'utilisateur
  const planCheck = await query(
    'SELECT id, sale_id FROM payment_plans WHERE id = $1 AND user_id = $2',
    [planId, req.user!.userId]
  );

  console.log('🔧 Plan check result:', planCheck.rows);

  if (planCheck.rows.length === 0) {
    console.error('❌ Plan de paiement non trouvé');
    throw createError('Plan de paiement non trouvé', 404);
  }

  const plan = planCheck.rows[0];
  console.log('🔧 Plan found:', plan);

  // Mettre à jour le plan de paiement avec tous les champs nécessaires
  const updateParams = [
    paymentData.montant_prevu || paymentData.montant_paye,
    paymentData.montant_paye,
    paymentData.date_prevue || paymentData.date_paiement,
    paymentData.date_paiement,
    paymentData.mode_paiement,
    paymentData.montant_espece || 0,
    paymentData.montant_cheque || 0,
    paymentData.montant_declare || 0,
    paymentData.montant_non_declare || 0,
    paymentData.description || paymentData.notes,
    paymentData.notes,
    planId
  ];

  console.log('🔧 Update params:', updateParams);

  const updateResult = await query(
    `UPDATE payment_plans
     SET montant_prevu = $1, montant_paye = $2, date_prevue = $3, date_paiement = $4,
         mode_paiement = $5, montant_espece = $6, montant_cheque = $7,
         montant_declare = $8, montant_non_declare = $9,
         description = $10, notes = $11, statut = 'paye', updated_at = NOW()
     WHERE id = $12
     RETURNING *`,
    updateParams
  );

  console.log('🔧 Update result rowCount:', updateResult.rowCount);
  console.log('🔧 Update result rows:', updateResult.rows);

  if (updateResult.rowCount === 0) {
    console.error('❌ Aucune ligne mise à jour');
    throw createError('Échec de la mise à jour du paiement', 500);
  }

  const updatedPlan = updateResult.rows[0];
  console.log('✅ Plan updated:', updatedPlan);

  // Si c'est l'avance initiale (numero_echeance = 1), mettre à jour aussi les champs de la vente
  if (updatedPlan.numero_echeance === 1 && updatedPlan.description?.includes('Avance initiale')) {
    console.log('🔧 Updating sale initial advance...');
    const totalAvance = paymentData.montant_paye;
    await query(
      `UPDATE sales
       SET avance_declare = $1, avance_non_declare = $2,
           avance_espece = $3, avance_cheque = $4, mode_paiement = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [
        paymentData.montant_declare || totalAvance,
        paymentData.montant_non_declare || 0,
        paymentData.montant_espece || 0,
        paymentData.montant_cheque || 0,
        paymentData.mode_paiement,
        plan.sale_id
      ]
    );
    console.log('✅ Sale updated');
  }

  const response: ApiResponse = {
    success: true,
    data: {
      ...updatedPlan,
      montant_prevu: parseFloat(updatedPlan.montant_prevu || 0),
      montant_paye: parseFloat(updatedPlan.montant_paye || 0),
      montant_espece: parseFloat(updatedPlan.montant_espece || 0),
      montant_cheque: parseFloat(updatedPlan.montant_cheque || 0),
      montant_declare: parseFloat(updatedPlan.montant_declare || 0),
      montant_non_declare: parseFloat(updatedPlan.montant_non_declare || 0)
    },
    message: 'Plan de paiement modifié avec succès'
  };

  console.log('✅ [PUT /plans/:planId] SUCCESS - Sending response');
  console.log('🔧 Response data:', JSON.stringify(response.data, null, 2));

  res.json(response);
}));

export default router;
