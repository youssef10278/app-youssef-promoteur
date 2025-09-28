export interface Project {
  id: string;
  nom: string;
}

export interface Sale {
  id: string;
  description: string;
  surface: number;
  prix_total: number;
  avance_declare: number;
  avance_non_declare: number;
  avance_total: number;
  avance_cheque: number;
  avance_espece: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  type_propriete: 'appartement' | 'villa' | 'terrain' | 'local_commercial' | 'garage';
  statut: 'en_cours' | 'termine' | 'annule';
  created_at: string;
  project_id: string;
  user_id: string;
  projects: { nom: string };
  payment_plans?: PaymentPlan[];
}

export interface PaymentPlan {
  id: string;
  sale_id: string;
  user_id: string;
  numero_echeance: number;
  description: string;
  montant_prevu: number;
  montant_declare: number;
  montant_non_declare: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_cheque: number;
  montant_espece: number;
  date_prevue: string;
  statut: 'planifie' | 'recu' | 'en_retard' | 'annule';
  notes?: string;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
  sale?: Sale;
  cheques?: CheckData[];
}

export interface Payment {
  id: string;
  payment_plan_id: string;
  user_id: string;
  montant_recu: number;
  date_reception: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  reference?: string;
  notes?: string;
  statut: 'recu' | 'encaisse' | 'rejete';
  created_at: string;
  updated_at: string;
  payment_plan?: PaymentPlan;
}

export interface PaymentPlanFormData {
  numero_echeance: number;
  description: string;
  montant_prevu: number;
  montant_declare: number;
  montant_non_declare: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_cheque: number;
  montant_espece: number;
  date_prevue: string;
  notes?: string;
  cheques: CheckData[];
}

export interface CheckData {
  id?: string;
  numero_cheque: string;
  nom_beneficiaire: string;
  nom_emetteur: string;
  date_emission: string;
  date_encaissement: string;
  montant: number;
  description: string;
  statut: 'emis' | 'encaisse' | 'rejete';
}

export interface PaymentFormData {
  montant_recu: number;
  date_reception: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  reference?: string;
  notes?: string;
}

export interface SalePaymentSummary {
  sale_id: string;
  sale_description: string;
  prix_total: number;
  sale_statut: 'en_cours' | 'termine' | 'annule';
  total_echeances: number;
  echeances_payees: number;
  echeances_en_retard: number;
  montant_total_prevu: number;
  montant_total_recu: number;
  montant_restant: number;
  prochaine_echeance?: string;
}

export const PAYMENT_PLAN_STATUS = {
  planifie: 'Planifié',
  recu: 'Reçu',
  en_retard: 'En retard',
  annule: 'Annulé'
} as const;

export const PAYMENT_STATUS = {
  recu: 'Reçu',
  encaisse: 'Encaissé',
  rejete: 'Rejeté'
} as const;

export const SALE_STATUS = {
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé'
} as const;

export const PAYMENT_MODES = {
  espece: 'Espèces',
  cheque: 'Chèque',
  cheque_espece: 'Chèque et Espèces',
  virement: 'Virement'
} as const;

export const PROPERTY_TYPES = {
  appartement: 'Appartement',
  garage: 'Garage'
} as const;

// Types pour les templates d'échéancier prédéfinis
export interface PaymentTemplate {
  id: string;
  name: string;
  description: string;
  echeances: PaymentTemplateEcheance[];
}

export interface PaymentTemplateEcheance {
  numero: number;
  description: string;
  pourcentage: number; // Pourcentage du prix total
  pourcentage_declare: number; // Pourcentage déclaré (du montant de l'échéance)
  pourcentage_non_declare: number; // Pourcentage non déclaré (du montant de l'échéance)
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  jours_apres_signature: number; // Nombre de jours après la signature
}

export const PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: 'standard_3_tranches',
    name: '3 Tranches Standard',
    description: 'Avance + 2 tranches égales',
    echeances: [
      {
        numero: 1,
        description: 'Avance à la signature',
        pourcentage: 30,
        pourcentage_declare: 70,
        pourcentage_non_declare: 30,
        mode_paiement: 'cheque_espece',
        jours_apres_signature: 0
      },
      {
        numero: 2,
        description: '1ère tranche',
        pourcentage: 35,
        pourcentage_declare: 80,
        pourcentage_non_declare: 20,
        mode_paiement: 'cheque',
        jours_apres_signature: 90
      },
      {
        numero: 3,
        description: 'Solde à la livraison',
        pourcentage: 35,
        pourcentage_declare: 100,
        pourcentage_non_declare: 0,
        mode_paiement: 'virement',
        jours_apres_signature: 365
      }
    ]
  },
  {
    id: 'echelonne_6_mois',
    name: 'Échelonné 6 mois',
    description: 'Paiement étalé sur 6 mois',
    echeances: [
      {
        numero: 1,
        description: 'Avance à la signature',
        pourcentage: 20,
        pourcentage_declare: 60,
        pourcentage_non_declare: 40,
        mode_paiement: 'cheque_espece',
        jours_apres_signature: 0
      },
      {
        numero: 2,
        description: '1ère mensualité',
        pourcentage: 16,
        pourcentage_declare: 70,
        pourcentage_non_declare: 30,
        mode_paiement: 'cheque',
        jours_apres_signature: 30
      },
      {
        numero: 3,
        description: '2ème mensualité',
        pourcentage: 16,
        pourcentage_declare: 70,
        pourcentage_non_declare: 30,
        mode_paiement: 'cheque',
        jours_apres_signature: 60
      },
      {
        numero: 4,
        description: '3ème mensualité',
        pourcentage: 16,
        pourcentage_declare: 70,
        pourcentage_non_declare: 30,
        mode_paiement: 'cheque',
        jours_apres_signature: 90
      },
      {
        numero: 5,
        description: '4ème mensualité',
        pourcentage: 16,
        pourcentage_declare: 70,
        pourcentage_non_declare: 30,
        mode_paiement: 'cheque',
        jours_apres_signature: 120
      },
      {
        numero: 6,
        description: 'Solde final',
        pourcentage: 16,
        pourcentage_declare: 100,
        pourcentage_non_declare: 0,
        mode_paiement: 'virement',
        jours_apres_signature: 150
      }
    ]
  },
  {
    id: 'avance_solde',
    name: 'Avance + Solde',
    description: 'Avance importante + solde à la livraison',
    echeances: [
      {
        numero: 1,
        description: 'Avance à la signature',
        pourcentage: 60,
        pourcentage_declare: 50,
        pourcentage_non_declare: 50,
        mode_paiement: 'cheque_espece',
        jours_apres_signature: 0
      },
      {
        numero: 2,
        description: 'Solde à la livraison',
        pourcentage: 40,
        pourcentage_declare: 100,
        pourcentage_non_declare: 0,
        mode_paiement: 'virement',
        jours_apres_signature: 365
      }
    ]
  }
];

// Utilitaires pour les calculs
export const calculatePaymentProgress = (paymentPlan: PaymentPlan): number => {
  if (!paymentPlan.payments || paymentPlan.payments.length === 0) return 0;
  
  const totalReceived = paymentPlan.payments.reduce((sum, payment) => sum + payment.montant_recu, 0);
  return Math.min((totalReceived / paymentPlan.montant_prevu) * 100, 100);
};

export const calculateSaleProgress = (sale: Sale): number => {
  if (!sale.payment_plans || sale.payment_plans.length === 0) return 0;
  
  const totalPrevu = sale.payment_plans.reduce((sum, plan) => sum + plan.montant_prevu, 0);
  const totalRecu = sale.payment_plans.reduce((sum, plan) => {
    if (!plan.payments) return sum;
    return sum + plan.payments.reduce((paymentSum, payment) => paymentSum + payment.montant_recu, 0);
  }, 0);
  
  return totalPrevu > 0 ? Math.min((totalRecu / totalPrevu) * 100, 100) : 0;
};

export const getPaymentPlanStatusColor = (statut: PaymentPlan['statut']): string => {
  switch (statut) {
    case 'planifie': return 'text-blue-600 bg-blue-50';
    case 'recu': return 'text-green-600 bg-green-50';
    case 'en_retard': return 'text-red-600 bg-red-50';
    case 'annule': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const getPaymentStatusColor = (statut: Payment['statut']): string => {
  switch (statut) {
    case 'recu': return 'text-blue-600 bg-blue-50';
    case 'encaisse': return 'text-green-600 bg-green-50';
    case 'rejete': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const isPaymentPlanOverdue = (paymentPlan: PaymentPlan): boolean => {
  if (paymentPlan.statut !== 'planifie') return false;
  
  const today = new Date();
  const dueDate = new Date(paymentPlan.date_prevue);
  return dueDate < today;
};

export const getDaysUntilDue = (paymentPlan: PaymentPlan): number => {
  const today = new Date();
  const dueDate = new Date(paymentPlan.date_prevue);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
