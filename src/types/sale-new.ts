// Nouveaux types pour le système de ventes refactorisé

export interface Project {
  id: string;
  nom: string;
  localisation?: string;
  societe: string;
  surface_totale?: number;
  nombre_lots?: number;
  nombre_appartements?: number;
  nombre_garages?: number;
  prix_m2?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Sale {
  id: string;
  project_id: string;
  client_nom: string;
  client_telephone?: string;
  client_email?: string;
  client_adresse?: string;
  unite_numero: string;
  unite_disponible: boolean;
  description: string;
  surface: number;
  prix_total: number;
  type_propriete: PropertyType;
  statut: SaleStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Champs d'avance initiale
  mode_paiement?: PaymentMode;
  avance_declare?: number;
  avance_non_declare?: number;
  avance_cheque?: number;
  avance_espece?: number;
  // Relations
  projects?: Project;
  payment_plans?: PaymentPlan[];
}

export interface PaymentPlan {
  id: string;
  sale_id: string;
  user_id: string;
  numero_echeance: number;
  description?: string;
  montant_prevu: number;
  montant_paye: number;
  montant_declare?: number;
  montant_non_declare?: number;
  date_prevue: string;
  date_paiement?: string;
  statut: PaymentPlanStatus;
  mode_paiement?: PaymentMode;
  montant_espece?: number;
  montant_cheque?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  payment_checks?: PaymentCheck[];
}

export interface PaymentCheck {
  id: string;
  payment_plan_id: string;
  user_id: string;
  numero_cheque: string;
  montant: number;
  banque?: string;
  date_emission?: string;
  date_encaissement?: string;
  statut: CheckStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les formulaires
export interface SaleFormData {
  project_id: string;
  client_nom: string;
  client_telephone: string;
  client_email: string;
  client_adresse: string;
  unite_numero: string;
  type_propriete: PropertyType;
  description: string;
  surface: number;
  prix_total: number;
  premier_paiement: {
    montant: number;
    montant_declare: number;
    montant_non_declare: number;
    date_paiement: string;
    mode_paiement: PaymentMode;
    montant_espece?: number;
    montant_cheque?: number;
    cheques?: Array<{
      numero: string;
      banque: string;
      montant: number;
      date_echeance: string;
    }>;
    reference_virement?: string;
    notes?: string;
  };
  payment_plans?: PaymentPlanFormData[];
}

export interface PaymentPlanFormData {
  numero_echeance: number;
  description: string;
  montant_prevu: number;
  date_prevue: string;
  notes?: string;
}

export interface PaymentFormData {
  payment_plan_id: string;
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: PaymentMode;
  montant_espece: number;
  montant_cheque: number;
  notes?: string;
  cheques: PaymentCheckFormData[];
}

export interface PaymentCheckFormData {
  numero_cheque: string;
  montant: number;
  banque: string;
  date_emission: string;
  date_encaissement?: string;
  notes?: string;
}

// Types enum
export type PropertyType = 'appartement' | 'garage';
export type SaleStatus = 'en_cours' | 'termine' | 'annule';
export type PaymentPlanStatus = 'planifie' | 'recu' | 'en_retard' | 'annule';
export type PaymentMode = 'espece' | 'cheque' | 'cheque_espece' | 'virement';
export type CheckStatus = 'emis' | 'encaisse' | 'annule';

// Constantes pour les labels
export const PROPERTY_TYPES = {
  appartement: 'Appartement',
  garage: 'Garage'
} as const;

export const SALE_STATUS = {
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé'
} as const;

export const PAYMENT_PLAN_STATUS = {
  planifie: 'Planifié',
  recu: 'Reçu',
  en_retard: 'En retard',
  annule: 'Annulé'
} as const;

export const PAYMENT_MODES = {
  espece: 'Espèces',
  cheque: 'Chèque',
  cheque_espece: 'Chèque + Espèces',
  virement: 'Virement'
} as const;

export const CHECK_STATUS = {
  emis: 'Émis',
  encaisse: 'Encaissé',
  annule: 'Annulé'
} as const;

// Types pour l'inventaire
export interface ProjectInventory {
  project_id: string;
  project_nom: string;
  appartements: {
    total: number;
    vendus: number;
    disponibles: string[]; // Liste des numéros disponibles
  };
  garages: {
    total: number;
    vendus: number;
    disponibles: string[];
  };
  villas: {
    total: number;
    vendus: number;
    disponibles: string[];
  };
  terrains: {
    total: number;
    vendus: number;
    disponibles: string[];
  };
  locaux_commerciaux: {
    total: number;
    vendus: number;
    disponibles: string[];
  };
}

// Types pour les statistiques
export interface SalesStats {
  total_ventes: number;
  total_ca: number;
  total_encaisse: number;
  total_en_attente: number;
  echeances_en_retard: number;
  echeances_cette_semaine: number;
  progression_paiements: number; // Pourcentage
}

// Types pour les filtres
export interface SalesFilters {
  project_id?: string;
  searchTerm?: string;
  statut?: SaleStatus;
  client_nom?: string;
  unite_numero?: string;
  type_propriete?: PropertyType;
  mode_paiement?: PaymentMode;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  sortBy?: 'created_at' | 'client_nom' | 'prix_total' | 'unite_numero' | 'progression';
  sortOrder?: 'asc' | 'desc';
}
