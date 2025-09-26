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

export interface Expense {
  id: string;
  nom: string;
  montant_declare: number;
  montant_non_declare: number;
  montant_total: number;
  montant_cheque: number;
  montant_espece: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  description: string;
  created_at: string;
  project_id: string;
  user_id: string;
  projects: { nom: string };
  cheques?: CheckData[];
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
