import { PaymentPlan, PaymentPlanStatus, SalesStats } from '@/types/sale-new';

/**
 * Calcule le statut d'une échéance en fonction de la date
 */
export function calculatePaymentPlanStatus(
  plan: PaymentPlan,
  currentDate: Date = new Date()
): PaymentPlanStatus {
  if (plan.statut === 'annule') {
    return 'annule';
  }

  if (plan.montant_paye >= plan.montant_prevu) {
    return 'recu';
  }

  const datePrevue = new Date(plan.date_prevue);
  const diffDays = Math.floor((currentDate.getTime() - datePrevue.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return 'en_retard';
  }

  return 'planifie';
}

/**
 * Calcule les statistiques de paiement pour une vente
 */
export function calculateSalePaymentStats(paymentPlans: PaymentPlan[]) {
  const totalPrevu = paymentPlans.reduce((sum, plan) => sum + plan.montant_prevu, 0);
  const totalPaye = paymentPlans.reduce((sum, plan) => sum + plan.montant_paye, 0);
  const totalRestant = totalPrevu - totalPaye;
  
  const echeancesPayees = paymentPlans.filter(plan => plan.montant_paye >= plan.montant_prevu).length;
  const totalEcheances = paymentPlans.length;
  
  const progression = totalPrevu > 0 ? (totalPaye / totalPrevu) * 100 : 0;

  // Prochaine échéance
  const prochaineEcheance = paymentPlans
    .filter(plan => plan.montant_paye < plan.montant_prevu && plan.statut !== 'annule')
    .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())[0];

  // Échéances en retard
  const currentDate = new Date();
  const echeancesEnRetard = paymentPlans.filter(plan => {
    const datePrevue = new Date(plan.date_prevue);
    return plan.montant_paye < plan.montant_prevu && 
           datePrevue < currentDate && 
           plan.statut !== 'annule';
  }).length;

  return {
    totalPrevu,
    totalPaye,
    totalRestant,
    echeancesPayees,
    totalEcheances,
    progression: Math.round(progression * 100) / 100,
    prochaineEcheance,
    echeancesEnRetard
  };
}

/**
 * Calcule les statistiques globales des ventes
 */
export function calculateGlobalSalesStats(
  sales: Array<{ prix_total: number; payment_plans?: PaymentPlan[] }>
): SalesStats {
  let total_ca = 0;
  let total_encaisse = 0;
  let echeances_en_retard = 0;
  let echeances_cette_semaine = 0;

  const currentDate = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(currentDate.getDate() + 7);

  sales.forEach(sale => {
    total_ca += sale.prix_total;

    if (sale.payment_plans) {
      sale.payment_plans.forEach(plan => {
        total_encaisse += plan.montant_paye;

        // Vérifier si en retard
        const datePrevue = new Date(plan.date_prevue);
        if (plan.montant_paye < plan.montant_prevu && 
            datePrevue < currentDate && 
            plan.statut !== 'annule') {
          echeances_en_retard++;
        }

        // Vérifier si échéance cette semaine
        if (plan.montant_paye < plan.montant_prevu &&
            datePrevue >= currentDate &&
            datePrevue <= weekFromNow &&
            plan.statut !== 'annule') {
          echeances_cette_semaine++;
        }
      });
    }
  });

  const total_en_attente = total_ca - total_encaisse;
  const progression_paiements = total_ca > 0 ? (total_encaisse / total_ca) * 100 : 0;

  return {
    total_ventes: sales.length,
    total_ca,
    total_encaisse,
    total_en_attente,
    echeances_en_retard,
    echeances_cette_semaine,
    progression_paiements: Math.round(progression_paiements * 100) / 100
  };
}

/**
 * Valide un paiement selon le mode choisi
 */
export function validatePayment(
  montantPrevu: number,
  montantPaye: number,
  modePaiement: string,
  montantEspece: number = 0,
  montantCheque: number = 0,
  cheques: Array<{ montant: number }> = []
): string[] {
  const errors: string[] = [];

  // Validation du montant total
  if (montantPaye <= 0) {
    errors.push("Le montant payé doit être supérieur à 0");
  }

  if (montantPaye > montantPrevu) {
    errors.push("Le montant payé ne peut pas dépasser le montant prévu");
  }

  // Validation selon le mode de paiement
  switch (modePaiement) {
    case 'espece':
      if (montantEspece !== montantPaye) {
        errors.push("Le montant en espèces doit égaler le montant payé");
      }
      if (montantCheque !== 0) {
        errors.push("Le montant chèque doit être 0 pour un paiement en espèces");
      }
      break;

    case 'cheque':
      if (montantCheque !== montantPaye) {
        errors.push("Le montant en chèques doit égaler le montant payé");
      }
      if (montantEspece !== 0) {
        errors.push("Le montant espèces doit être 0 pour un paiement par chèque");
      }
      
      const totalCheques = cheques.reduce((sum, cheque) => sum + cheque.montant, 0);
      if (Math.abs(totalCheques - montantCheque) > 0.01) {
        errors.push("La somme des chèques doit égaler le montant chèque");
      }
      
      if (cheques.length === 0) {
        errors.push("Au moins un chèque est requis pour ce mode de paiement");
      }
      break;

    case 'cheque_espece':
      if (Math.abs(montantEspece + montantCheque - montantPaye) > 0.01) {
        errors.push("La somme espèces + chèques doit égaler le montant payé");
      }
      
      if (montantEspece <= 0) {
        errors.push("Le montant en espèces doit être supérieur à 0");
      }
      
      if (montantCheque <= 0) {
        errors.push("Le montant en chèques doit être supérieur à 0");
      }
      
      const totalChequesCombo = cheques.reduce((sum, cheque) => sum + cheque.montant, 0);
      if (Math.abs(totalChequesCombo - montantCheque) > 0.01) {
        errors.push("La somme des chèques doit égaler le montant chèque");
      }
      
      if (cheques.length === 0) {
        errors.push("Au moins un chèque est requis pour ce mode de paiement");
      }
      break;

    case 'virement':
      if (montantEspece !== 0 || montantCheque !== 0) {
        errors.push("Les montants espèces et chèques doivent être 0 pour un virement");
      }
      break;

    default:
      errors.push("Mode de paiement non valide");
  }

  return errors;
}

/**
 * Formate un montant en DH
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('MAD', 'DH');
}

/**
 * Calcule le nombre de jours de retard
 */
export function calculateDaysLate(datePrevue: string, currentDate: Date = new Date()): number {
  const datePrevueObj = new Date(datePrevue);
  const diffTime = currentDate.getTime() - datePrevueObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Détermine la couleur du badge selon le statut
 */
export function getStatusColor(status: PaymentPlanStatus): string {
  switch (status) {
    case 'recu':
      return 'bg-green-100 text-green-800';
    case 'planifie':
      return 'bg-blue-100 text-blue-800';
    case 'en_retard':
      return 'bg-red-100 text-red-800';
    case 'annule':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Génère un résumé textuel du paiement
 */
export function generatePaymentSummary(
  montantPaye: number,
  modePaiement: string,
  montantEspece: number = 0,
  montantCheque: number = 0,
  cheques: Array<{ numero_cheque: string }> = []
): string {
  switch (modePaiement) {
    case 'espece':
      return `${formatAmount(montantPaye)} en espèces`;
    
    case 'cheque':
      if (cheques.length === 1) {
        return `${formatAmount(montantPaye)} par chèque N°${cheques[0].numero_cheque}`;
      } else {
        return `${formatAmount(montantPaye)} par ${cheques.length} chèques`;
      }
    
    case 'cheque_espece':
      return `${formatAmount(montantEspece)} espèces + ${formatAmount(montantCheque)} chèques`;
    
    case 'virement':
      return `${formatAmount(montantPaye)} par virement`;
    
    default:
      return `${formatAmount(montantPaye)}`;
  }
}
