export interface Project {
  id: string;
  nom: string;
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
  statut: 'emis' | 'encaisse' | 'annule';
}

export type PaymentMode = 'espece' | 'cheque' | 'cheque_espece' | 'virement';
export type ExpenseStatus = 'actif' | 'termine' | 'annule';

export interface Expense {
  id: string;
  nom: string;
  montant_declare: number;
  montant_non_declare: number;
  montant_total: number;
  montant_cheque: number;
  montant_espece: number;
  mode_paiement: PaymentMode;
  description: string;
  statut: ExpenseStatus;
  created_at: string;
  project_id: string;
  user_id: string;
  projects: { nom: string };
  cheques?: CheckData[];
  // Nouveaux champs pour les paiements progressifs
  statut_paiement?: 'non_paye' | 'partiellement_paye' | 'paye';
  montant_total_paye?: number;
  montant_restant?: number;
  expense_payment_plans?: ExpensePaymentPlan[];
  // Nouveaux champs calculés
  total_paye_calcule?: number;
  total_declare_calcule?: number;
  total_non_declare_calcule?: number;
  nombre_paiements?: number;
  payments?: ExpensePayment[];
}

// Nouveau type pour les paiements individuels de dépenses
export interface ExpensePayment {
  id: string;
  expense_id: string;
  user_id: string;
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: PaymentMode;
  description?: string;
  reference_paiement?: string;
  created_at: string;
  updated_at: string;
}

// Dépense avec ses paiements
export interface ExpenseWithPayments extends Expense {
  payments: ExpensePayment[];
  total_paye_calcule: number;
  total_declare_calcule: number;
  total_non_declare_calcule: number;
  nombre_paiements: number;
}

export interface ExpensePaymentPlan {
  id: string;
  expense_id: string;
  user_id: string;
  numero_echeance: number;
  date_prevue: string;
  montant_prevu: number;
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement?: string;
  mode_paiement?: PaymentMode;
  montant_espece: number;
  montant_cheque: number;
  statut: 'en_attente' | 'paye' | 'en_retard' | 'annule';
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFilters {
  searchTerm?: string;
  mode_paiement?: PaymentMode;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  sortBy?: 'created_at' | 'nom' | 'montant_total' | 'montant_declare' | 'montant_non_declare';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseFormData {
  project_id: string;
  nom: string;
  montant_declare: number;
  montant_non_declare: number;
  montant_total: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_cheque: number;
  montant_espece: number;
  description: string;
  cheques: CheckData[];
}

// Nouveau formulaire simplifié pour créer une dépense sans montant
export interface SimpleExpenseFormData {
  project_id: string;
  nom: string;
  description: string;
}

// Formulaire pour ajouter un paiement à une dépense
export interface ExpensePaymentFormData {
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: PaymentMode;
  description?: string;
  reference_paiement?: string;
  // Pour les chèques - informations complètes
  cheque_data?: {
    numero_cheque: string;
    nom_beneficiaire: string;
    nom_emetteur: string;
    date_emission: string;
    date_encaissement: string;
    banque_emettrice?: string;
  };
}

export const PAYMENT_MODES = {
  espece: 'Espèces',
  cheque: 'Chèque',
  cheque_espece: 'Chèque et Espèces',
  virement: 'Virement'
} as const;

export const CHECK_STATUS = {
  emis: 'Émis',
  encaisse: 'Encaissé',
  annule: 'Annulé'
} as const;

export const EXPENSE_STATUS = {
  actif: 'Active',
  termine: 'Terminée',
  annule: 'Annulée'
} as const;
