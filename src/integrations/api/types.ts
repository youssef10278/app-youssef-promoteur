// Types pour l'API client
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  telephone?: string;
  societe?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface Project {
  id: string;
  nom: string;
  description?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  prix_total: number;
  nombre_lots: number;
  date_debut?: string;
  date_fin_prevue?: string;
  statut: 'planification' | 'en_cours' | 'termine' | 'suspendu';
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  projet_id: string;
  client_nom: string;
  client_prenom: string;
  client_telephone?: string;
  client_email?: string;
  client_adresse?: string;
  lot_numero: string;
  prix_vente: number;
  date_vente: string;
  statut: 'en_cours' | 'finalise' | 'annule';
  notes?: string;
  created_at: string;
  updated_at: string;
  projet?: Project;
}

export interface PaymentPlan {
  id: string;
  vente_id: string;
  montant_total: number;
  nombre_echeances: number;
  montant_echeance: number;
  date_premiere_echeance: string;
  frequence: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  statut: 'actif' | 'termine' | 'suspendu';
  created_at: string;
  updated_at: string;
  vente?: Sale;
}

export interface Payment {
  id: string;
  plan_paiement_id: string;
  numero_echeance: number;
  montant: number;
  date_prevue: string;
  date_paiement?: string;
  statut: 'en_attente' | 'paye' | 'en_retard' | 'annule';
  mode_paiement?: 'especes' | 'cheque' | 'virement' | 'carte';
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  plan_paiement?: PaymentPlan;
}

export interface Expense {
  id: string;
  projet_id: string;
  description: string;
  montant: number;
  date_depense: string;
  categorie: 'materiel' | 'main_oeuvre' | 'transport' | 'administratif' | 'autre';
  fournisseur?: string;
  numero_facture?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  projet?: Project;
}

export interface Check {
  id: string;
  vente_id?: string;
  numero_cheque: string;
  montant: number;
  date_emission: string;
  date_encaissement?: string;
  banque: string;
  emetteur_nom: string;
  emetteur_prenom?: string;
  statut: 'en_attente' | 'encaisse' | 'rejete' | 'annule';
  notes?: string;
  created_at: string;
  updated_at: string;
  vente?: Sale;
}

export interface ProjectStats {
  total_ventes: number;
  montant_total_ventes: number;
  lots_vendus: number;
  lots_disponibles: number;
  total_depenses: number;
  benefice_brut: number;
  taux_completion: number;
}

export interface PaymentStats {
  total_attendu: number;
  total_recu: number;
  total_en_retard: number;
  nombre_echeances_en_retard: number;
  prochaines_echeances: Payment[];
}

export interface CheckStats {
  total_en_attente: number;
  total_encaisse: number;
  montant_en_attente: number;
  montant_encaisse: number;
  cheques_a_encaisser: Check[];
}

export interface DashboardStats {
  projets: {
    total: number;
    en_cours: number;
    termines: number;
  };
  ventes: {
    total: number;
    montant_total: number;
    ce_mois: number;
    montant_ce_mois: number;
  };
  paiements: PaymentStats;
  cheques: CheckStats;
  benefices: {
    total: number;
    ce_mois: number;
    evolution: number;
  };
}

// Types pour les filtres
export interface SaleFilters {
  projet_id?: string;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  client_nom?: string;
  page?: number;
  limit?: number;
}

export interface CheckFilters {
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  banque?: string;
  emetteur?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseFilters {
  projet_id?: string;
  categorie?: string;
  date_debut?: string;
  date_fin?: string;
  fournisseur?: string;
  page?: number;
  limit?: number;
}

// Types pour les formulaires
export interface CreateProjectData {
  nom: string;
  description?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  prix_total: number;
  nombre_lots: number;
  date_debut?: string;
  date_fin_prevue?: string;
}

export interface CreateSaleData {
  projet_id: string;
  client_nom: string;
  client_prenom: string;
  client_telephone?: string;
  client_email?: string;
  client_adresse?: string;
  lot_numero: string;
  prix_vente: number;
  date_vente: string;
  notes?: string;
}

export interface CreatePaymentPlanData {
  vente_id: string;
  montant_total: number;
  nombre_echeances: number;
  date_premiere_echeance: string;
  frequence: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
}

export interface CreateExpenseData {
  projet_id: string;
  description: string;
  montant: number;
  date_depense: string;
  categorie: 'materiel' | 'main_oeuvre' | 'transport' | 'administratif' | 'autre';
  fournisseur?: string;
  numero_facture?: string;
  notes?: string;
}

export interface CreateCheckData {
  vente_id?: string;
  numero_cheque: string;
  montant: number;
  date_emission: string;
  banque: string;
  emetteur_nom: string;
  emetteur_prenom?: string;
  notes?: string;
}

export interface RecordPaymentData {
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte';
  reference?: string;
  notes?: string;
}

// Types d'erreur
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class ApiClientError extends Error {
  public code?: string;
  public details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
  }
}
