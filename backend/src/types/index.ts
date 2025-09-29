// Types pour l'authentification
export interface User {
  id: string;
  email: string;
  nom: string;
  telephone?: string;
  societe?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  nom: string;
  telephone?: string;
  societe?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Types pour les projets
export interface Project {
  id: string;
  user_id: string;
  nom: string;
  localisation: string;
  societe: string;
  surface_totale: number;
  nombre_lots: number;
  nombre_appartements: number;
  nombre_garages: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectRequest {
  nom: string;
  localisation: string;
  societe: string;
  surface_totale: number;
  nombre_lots: number;
  nombre_appartements: number;
  nombre_garages: number;
  description?: string;
}

// Types pour les ventes
export type PropertyType = 'appartement' | 'garage';
export type SaleStatus = 'en_cours' | 'termine' | 'annule';
export type PaymentMode = 'espece' | 'cheque' | 'cheque_espece' | 'virement';

export interface Sale {
  id: string;
  project_id: string;
  user_id: string;
  type_propriete: PropertyType;
  unite_numero: string;
  client_nom: string;
  client_telephone?: string;
  client_email?: string;
  client_adresse?: string;
  surface: number;
  prix_total: number;
  description: string;
  statut: SaleStatus;
  mode_paiement: PaymentMode;
  avance_declare: number;
  avance_non_declare: number;
  avance_cheque: number;
  avance_espece: number;
  avance_total: number;
  unite_disponible: boolean;
  created_at: Date;
  updated_at: Date;
}

// Types pour les paiements
export type PaymentPlanStatus = 'en_attente' | 'paye' | 'en_retard' | 'annule';

export interface PaymentPlan {
  id: string;
  sale_id: string;
  user_id: string;
  numero_echeance: number;
  date_prevue: Date;
  montant_prevu: number;
  montant_paye: number;
  date_paiement?: Date;
  mode_paiement?: PaymentMode;
  montant_espece?: number;
  montant_cheque?: number;
  statut: PaymentPlanStatus;
  description?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Types pour les dépenses
export type ExpensePaymentMethod = 'cheque' | 'espece' | 'cheque_et_espece';

export interface Expense {
  id: string;
  project_id: string;
  user_id: string;
  nom: string;
  montant_declare: number;
  montant_non_declare: number;
  montant_total: number;
  methode_paiement: ExpensePaymentMethod;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Types pour les chèques
export type CheckType = 'recu' | 'donne';
export type CheckStatus = 'emis' | 'encaisse' | 'annule';

export interface Check {
  id: string;
  user_id: string;
  project_id?: string;
  sale_id?: string;
  expense_id?: string;
  type_cheque: CheckType;
  montant: number;
  numero_cheque?: string;
  nom_beneficiaire?: string;
  nom_emetteur?: string;
  date_emission: Date;
  date_encaissement?: Date;
  statut: CheckStatus;
  facture_recue: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les filtres et recherche
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface SalesFilters extends BaseFilters {
  statut?: SaleStatus;
  type_propriete?: PropertyType;
  mode_paiement?: PaymentMode;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
}
