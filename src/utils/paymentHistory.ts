import { Sale, PaymentPlan } from '@/types/sale-new';

/**
 * Génère un payment_plan virtuel pour l'avance initiale si elle n'existe pas déjà
 */
export function createVirtualInitialPaymentPlan(sale: Sale): PaymentPlan | null {
  const totalAvance = (sale.avance_declare || 0) + (sale.avance_non_declare || 0);

  // Si pas d'avance, pas de payment_plan virtuel
  if (totalAvance <= 0) {
    return null;
  }

  // Créer un payment_plan virtuel pour l'avance initiale
  return {
    id: `virtual-initial-${sale.id}`,
    sale_id: sale.id,
    user_id: sale.user_id,
    numero_echeance: 1,
    description: 'Avance initiale (premier paiement)',
    montant_prevu: totalAvance,
    montant_paye: totalAvance, // L'avance est déjà payée
    montant_declare: sale.avance_declare || 0, // ✅ CORRECTION: Ajouter montant principal
    montant_non_declare: sale.avance_non_declare || 0, // ✅ CORRECTION: Ajouter autre montant
    date_prevue: sale.created_at.split('T')[0], // Date de création de la vente
    date_paiement: sale.created_at, // Date de création de la vente
    mode_paiement: sale.mode_paiement,
    montant_espece: sale.avance_espece || 0,
    montant_cheque: sale.avance_cheque || 0,
    statut: 'paye' as const,
    notes: 'Avance payée lors de la signature',
    created_at: sale.created_at,
    updated_at: sale.updated_at || sale.created_at
  };
}

/**
 * Enrichit les payment_plans d'une vente avec l'avance initiale virtuelle si nécessaire
 */
export function enrichPaymentPlansWithInitialAdvance(sale: Sale, paymentPlans: PaymentPlan[] = []): PaymentPlan[] {
  // Vérifier si un payment_plan pour l'avance initiale existe déjà
  const hasInitialPaymentPlan = paymentPlans.some(plan => 
    plan.numero_echeance === 1 && plan.description?.includes('Avance initiale')
  );
  
  // Si l'avance initiale existe déjà dans les payment_plans, retourner tel quel
  if (hasInitialPaymentPlan) {
    return paymentPlans;
  }
  
  // Créer un payment_plan virtuel pour l'avance initiale
  const virtualInitialPlan = createVirtualInitialPaymentPlan(sale);
  
  // Si pas d'avance, retourner les payment_plans existants
  if (!virtualInitialPlan) {
    return paymentPlans;
  }
  
  // Renuméroter les payment_plans existants pour faire de la place au premier
  const renumberedPlans = paymentPlans.map(plan => ({
    ...plan,
    numero_echeance: plan.numero_echeance + 1
  }));
  
  // Retourner l'avance initiale + les autres payment_plans
  return [virtualInitialPlan, ...renumberedPlans];
}

/**
 * Calcule les totaux de paiement en utilisant la logique unifiée
 */
export function calculateUnifiedPaymentTotals(sale: Sale, paymentPlans: PaymentPlan[] = []) {
  const enrichedPlans = enrichPaymentPlansWithInitialAdvance(sale, paymentPlans);

  // Calculer les totaux en gérant les cas où les montants détaillés ne sont pas définis
  let totalPaid = 0;
  let totalDeclare = 0;
  let totalNonDeclare = 0;

  enrichedPlans.forEach(plan => {
    const montantPaye = plan.montant_paye || 0;
    totalPaid += montantPaye;

    let montantDeclare = plan.montant_declare || 0;
    let montantNonDeclare = plan.montant_non_declare || 0;

    // Si les montants détaillés ne sont pas définis, les calculer automatiquement
    if (montantDeclare === 0 && montantNonDeclare === 0 && montantPaye > 0) {
      // Répartition par défaut : 70% principal, 30% autre montant
      montantDeclare = Math.round(montantPaye * 0.7 * 100) / 100;
      montantNonDeclare = Math.round((montantPaye - montantDeclare) * 100) / 100;
    }

    totalDeclare += montantDeclare;
    totalNonDeclare += montantNonDeclare;
  });

  const totalDue = sale.prix_total;
  const remainingAmount = totalDue - totalPaid;
  const percentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return {
    totalPaid,
    totalDeclare,
    totalNonDeclare,
    totalDue,
    remainingAmount,
    percentage,
    enrichedPaymentPlans: enrichedPlans
  };
}

/**
 * Vérifie si un payment_plan est virtuel (généré à la volée)
 */
export function isVirtualPaymentPlan(plan: PaymentPlan): boolean {
  return plan.id.startsWith('virtual-initial-');
}

/**
 * Convertit un payment_plan virtuel en données pour création en base
 */
export function convertVirtualPlanToCreateData(virtualPlan: PaymentPlan) {
  return {
    montant_paye: virtualPlan.montant_paye,
    montant_declare: virtualPlan.montant_paye * 0.7, // Par défaut 70% déclaré
    montant_non_declare: virtualPlan.montant_paye * 0.3, // Par défaut 30% non déclaré
    date_paiement: virtualPlan.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
    mode_paiement: virtualPlan.mode_paiement || 'espece',
    montant_espece: virtualPlan.montant_espece || 0,
    montant_cheque: virtualPlan.montant_cheque || 0,
    notes: virtualPlan.notes || 'Avance initiale convertie'
  };
}
