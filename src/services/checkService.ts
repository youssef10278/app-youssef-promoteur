import { apiClient } from '@/integrations/api/client';

export interface Check {
  id: string;
  user_id: string;
  project_id?: string;
  sale_id?: string;
  expense_id?: string;
  type_cheque: 'recu' | 'donne';
  montant: number;
  numero_cheque?: string;
  nom_beneficiaire?: string;
  nom_emetteur?: string;
  date_emission: string;
  date_encaissement?: string;
  statut: 'emis' | 'encaisse' | 'annule';
  facture_recue: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  project_nom?: string;
  client_nom?: string;
  expense_nom?: string;
}

export interface CheckFilters {
  searchTerm?: string;
  type_cheque?: string;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  statut?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCheckData {
  project_id?: string;
  sale_id?: string;
  expense_id?: string;
  type_cheque: 'recu' | 'donne';
  montant: number;
  numero_cheque?: string;
  nom_beneficiaire?: string;
  nom_emetteur?: string;
  date_emission: string;
  date_encaissement?: string;
  statut?: 'emis' | 'encaisse' | 'annule';
  facture_recue?: boolean;
  description?: string;
}

export class CheckService {
  /**
   * Récupérer tous les chèques avec filtres
   */
  static async getChecks(filters: CheckFilters = {}): Promise<Check[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.type_cheque) params.append('type', filters.type_cheque);
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.searchTerm) {
        // Pour la recherche, on peut filtrer côté client ou ajouter un paramètre search
        // Pour l'instant, on laisse le filtrage côté client
      }

      const response = await apiClient.get(`/checks?${params.toString()}`);
      let checks = response.data || [];

      // Filtrage côté client pour les critères non supportés par l'API
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        checks = checks.filter((check: Check) => 
          check.numero_cheque?.toLowerCase().includes(searchTerm) ||
          check.nom_beneficiaire?.toLowerCase().includes(searchTerm) ||
          check.nom_emetteur?.toLowerCase().includes(searchTerm) ||
          check.description?.toLowerCase().includes(searchTerm) ||
          check.project_nom?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.date_debut) {
        checks = checks.filter((check: Check) => 
          new Date(check.date_emission) >= new Date(filters.date_debut!)
        );
      }

      if (filters.date_fin) {
        checks = checks.filter((check: Check) => 
          new Date(check.date_emission) <= new Date(filters.date_fin!)
        );
      }

      if (filters.montant_min) {
        checks = checks.filter((check: Check) => check.montant >= filters.montant_min!);
      }

      if (filters.montant_max) {
        checks = checks.filter((check: Check) => check.montant <= filters.montant_max!);
      }

      // Tri
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      
      checks.sort((a: Check, b: Check) => {
        const aValue = a[sortBy as keyof Check];
        const bValue = b[sortBy as keyof Check];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return checks;
    } catch (error) {
      console.error('Erreur lors de la récupération des chèques:', error);
      throw error;
    }
  }

  /**
   * Récupérer les chèques d'un projet spécifique
   */
  static async getChecksByProject(projectId: string, filters: CheckFilters = {}): Promise<Check[]> {
    try {
      const params = new URLSearchParams();
      params.append('project_id', projectId);
      
      if (filters.type_cheque) params.append('type', filters.type_cheque);
      if (filters.statut) params.append('statut', filters.statut);

      const response = await apiClient.get(`/checks?${params.toString()}`);
      let checks = response.data || [];

      // Appliquer les autres filtres côté client
      return this.applyClientFilters(checks, filters);
    } catch (error) {
      console.error('Erreur lors de la récupération des chèques du projet:', error);
      throw error;
    }
  }

  /**
   * Récupérer un chèque par ID
   */
  static async getCheckById(checkId: string): Promise<Check> {
    try {
      const response = await apiClient.get(`/checks/${checkId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du chèque:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau chèque
   */
  static async createCheck(checkData: CreateCheckData): Promise<Check> {
    try {
      const response = await apiClient.post('/checks', checkData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du chèque:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un chèque
   */
  static async updateCheck(checkId: string, updateData: Partial<CreateCheckData>): Promise<Check> {
    try {
      const response = await apiClient.put(`/checks/${checkId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du chèque:', error);
      throw error;
    }
  }

  /**
   * Supprimer un chèque
   */
  static async deleteCheck(checkId: string): Promise<void> {
    try {
      await apiClient.delete(`/checks/${checkId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du chèque:', error);
      throw error;
    }
  }

  /**
   * Marquer un chèque comme encaissé
   */
  static async markAsEncaisse(checkId: string, dateEncaissement?: string): Promise<Check> {
    try {
      const response = await apiClient.patch(`/checks/${checkId}/encaisser`, {
        date_encaissement: dateEncaissement || new Date().toISOString().split('T')[0]
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'encaissement du chèque:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des chèques
   */
  static async getCheckStats(): Promise<any> {
    try {
      const response = await apiClient.get('/checks/stats/summary');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Appliquer les filtres côté client
   */
  private static applyClientFilters(checks: Check[], filters: CheckFilters): Check[] {
    let filteredChecks = [...checks];

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredChecks = filteredChecks.filter(check => 
        check.numero_cheque?.toLowerCase().includes(searchTerm) ||
        check.nom_beneficiaire?.toLowerCase().includes(searchTerm) ||
        check.nom_emetteur?.toLowerCase().includes(searchTerm) ||
        check.description?.toLowerCase().includes(searchTerm) ||
        check.project_nom?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.date_debut) {
      filteredChecks = filteredChecks.filter(check => 
        new Date(check.date_emission) >= new Date(filters.date_debut!)
      );
    }

    if (filters.date_fin) {
      filteredChecks = filteredChecks.filter(check => 
        new Date(check.date_emission) <= new Date(filters.date_fin!)
      );
    }

    if (filters.montant_min) {
      filteredChecks = filteredChecks.filter(check => check.montant >= filters.montant_min!);
    }

    if (filters.montant_max) {
      filteredChecks = filteredChecks.filter(check => check.montant <= filters.montant_max!);
    }

    // Tri
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    
    filteredChecks.sort((a, b) => {
      const aValue = a[sortBy as keyof Check];
      const bValue = b[sortBy as keyof Check];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredChecks;
  }
}