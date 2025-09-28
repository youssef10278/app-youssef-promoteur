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

export interface Sale {
  id: string;
  description: string;
  surface: number;
  prix_total: number;

  avance_total: number;
  avance_cheque: number;
  avance_espece: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  type_propriete: 'appartement' | 'garage';
  created_at: string;
  project_id: string;
  user_id: string;
  projects: { nom: string };
  cheques?: CheckData[];
}

export interface SaleFormData {
  project_id: string;
  description: string;
  surface: number;
  prix_total: number;
  avance_total: number;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  avance_cheque: number;
  avance_espece: number;
  type_propriete: 'appartement' | 'garage';
  cheques: CheckData[];
}

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

export const CHECK_STATUS = {
  emis: 'Émis',
  encaisse: 'Encaissé',
  annule: 'Annulé'
} as const;
