import { supabase } from '@/integrations/supabase/client';

export interface CheckFilters {
  searchTerm?: string;
  type_cheque?: 'recu' | 'donne' | '';
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  statut?: string;
  sortBy?: 'created_at' | 'montant' | 'date_emission' | 'numero_cheque';
  sortOrder?: 'asc' | 'desc';
}

export interface CheckRecord {
  id: string;
  type_cheque: string;
  montant: number;
  numero_cheque: string;
  nom_beneficiaire: string;
  nom_emetteur: string;
  date_emission: string;
  date_encaissement: string;
  facture_recue: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  projects?: { nom: string } | null;
  expenses?: { nom: string; montant_total: number } | null;
  sales?: { description: string; avance_total: number } | null;
  // Champs spécifiques aux chèques de paiement
  payment_plan_id?: string;
  client_nom?: string;
  unite_numero?: string;
  banque?: string;
  statut?: string;
}

export class CheckService {
  static async getChecks(userId: string, projectId?: string, filters?: CheckFilters): Promise<CheckRecord[]> {
    try {
      // Récupérer les chèques manuels (table checks)
      let manualQuery = supabase
        .from('checks')
        .select(`
          *,
          projects(nom),
          expenses(nom, montant_total),
          sales(description, avance_total)
        `)
        .eq('user_id', userId);

      // Filtrer par projet si spécifié
      if (projectId && projectId !== 'all') {
        manualQuery = manualQuery.eq('project_id', projectId);
      }

      // Appliquer les filtres de recherche
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        manualQuery = manualQuery.or(`numero_cheque.ilike.%${searchTerm}%,nom_beneficiaire.ilike.%${searchTerm}%,nom_emetteur.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filters?.type_cheque) {
        manualQuery = manualQuery.eq('type_cheque', filters.type_cheque);
      }

      if (filters?.date_debut) {
        manualQuery = manualQuery.gte('date_emission', filters.date_debut);
      }

      if (filters?.date_fin) {
        manualQuery = manualQuery.lte('date_emission', filters.date_fin);
      }

      if (filters?.montant_min !== undefined && filters?.montant_min !== null) {
        manualQuery = manualQuery.gte('montant', filters.montant_min);
      }

      if (filters?.montant_max !== undefined && filters?.montant_max !== null) {
        manualQuery = manualQuery.lte('montant', filters.montant_max);
      }

      // Tri
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      manualQuery = manualQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: manualChecks, error: manualError } = await manualQuery;

      if (manualError) throw manualError;

      // Récupérer les chèques des paiements (table payment_checks)
      let paymentQuery = supabase
        .from('payment_checks')
        .select(`
          *,
          payment_plans(
            sale_id,
            numero_echeance,
            description,
            montant_prevu,
            date_prevue,
            statut,
            sales(
              client_nom,
              unite_numero,
              description,
              project_id,
              projects(nom)
            )
          )
        `)
        .eq('user_id', userId);

      const { data: paymentChecks, error: paymentError } = await paymentQuery;

      if (paymentError) {
        console.error('Erreur lors de la récupération des chèques de paiement:', paymentError);
      }

      // Transformer les chèques de paiement pour correspondre au format attendu
      const transformedPaymentChecks = (paymentChecks || []).map(check => {
        const sale = check.payment_plans?.sales;
        const project = sale?.projects;

        return {
          id: check.id,
          user_id: check.user_id,
          project_id: sale?.project_id,
          type_cheque: 'recu' as const,
          montant: check.montant,
          numero_cheque: check.numero_cheque,
          nom_beneficiaire: null,
          nom_emetteur: sale?.client_nom || 'Client',
          date_emission: check.date_emission,
          date_encaissement: check.date_encaissement,
          description: `Chèque de paiement - ${sale?.description || 'Vente'} (${sale?.unite_numero || 'N/A'})`,
          facture_recue: false,
          created_at: check.created_at,
          updated_at: check.updated_at,
          projects: project ? { nom: project.nom } : null,
          expenses: null,
          sales: sale ? {
            description: sale.description,
            avance_total: null
          } : null,
          payment_plan_id: check.payment_plan_id,
          client_nom: sale?.client_nom,
          unite_numero: sale?.unite_numero,
          banque: check.banque,
          statut: check.statut
        };
      });

      // Filtrer les chèques de paiement par projet si nécessaire
      let filteredPaymentChecks = transformedPaymentChecks;
      if (projectId && projectId !== 'all') {
        filteredPaymentChecks = transformedPaymentChecks.filter(check => check.project_id === projectId);
      }

      // Appliquer les filtres aux chèques de paiement
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.numero_cheque?.toLowerCase().includes(searchTerm) ||
          check.nom_emetteur?.toLowerCase().includes(searchTerm) ||
          check.client_nom?.toLowerCase().includes(searchTerm) ||
          check.description?.toLowerCase().includes(searchTerm) ||
          check.unite_numero?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.type_cheque && filters.type_cheque !== 'recu') {
        filteredPaymentChecks = []; // Les chèques de paiement sont toujours reçus
      }

      if (filters?.date_debut) {
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.date_emission >= filters.date_debut!
        );
      }

      if (filters?.date_fin) {
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.date_emission <= filters.date_fin!
        );
      }

      if (filters?.montant_min !== undefined && filters?.montant_min !== null) {
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.montant >= filters.montant_min!
        );
      }

      if (filters?.montant_max !== undefined && filters?.montant_max !== null) {
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.montant <= filters.montant_max!
        );
      }

      if (filters?.statut) {
        filteredPaymentChecks = filteredPaymentChecks.filter(check =>
          check.statut === filters.statut
        );
      }

      // Combiner les deux types de chèques
      const allChecks = [...(manualChecks || []), ...filteredPaymentChecks];

      // Trier le résultat final
      const finalSortBy = filters?.sortBy || 'created_at';
      const finalSortOrder = filters?.sortOrder || 'desc';

      allChecks.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (finalSortBy) {
          case 'montant':
            aValue = a.montant;
            bValue = b.montant;
            break;
          case 'date_emission':
            aValue = new Date(a.date_emission).getTime();
            bValue = new Date(b.date_emission).getTime();
            break;
          case 'numero_cheque':
            aValue = a.numero_cheque || '';
            bValue = b.numero_cheque || '';
            break;
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (finalSortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      return allChecks;
    } catch (error) {
      console.error('Erreur lors de la récupération des chèques:', error);
      throw error;
    }
  }
}
