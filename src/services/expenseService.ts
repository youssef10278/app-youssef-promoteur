import { apiClient } from '@/integrations/api/client';
import { Expense, ExpenseFilters } from '@/types/expense';

export class ExpenseService {
  /**
   * Récupérer toutes les dépenses avec filtres
   */
  static async getExpenses(projectId?: string, filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      // Construire les paramètres de requête
      const params: Record<string, any> = {};

      if (projectId && projectId !== 'all') {
        params.projectId = projectId;
      }

      if (filters?.searchTerm) {
        params.search = filters.searchTerm;
      }

      if (filters?.mode_paiement) {
        params.mode_paiement = filters.mode_paiement;
      }

      if (filters?.date_debut) {
        params.date_debut = filters.date_debut;
      }

      if (filters?.date_fin) {
        params.date_fin = filters.date_fin;
      }

      if (filters?.montant_min !== undefined && filters.montant_min !== null) {
        params.montant_min = filters.montant_min;
      }

      if (filters?.montant_max !== undefined && filters.montant_max !== null) {
        params.montant_max = filters.montant_max;
      }

      if (filters?.sortBy) {
        params.sortBy = filters.sortBy;
      }

      if (filters?.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }

      // Appel à l'API
      const endpoint = projectId && projectId !== 'all'
        ? `/expenses/project/${projectId}`
        : '/expenses';

      const response = await apiClient.get(endpoint, params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle dépense
   */
  static async createExpense(expenseData: any): Promise<Expense> {
    try {
      const response = await apiClient.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une dépense
   */
  static async updateExpense(expenseId: string, expenseData: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiClient.put(`/expenses/${expenseId}`, expenseData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dépense:', error);
      throw error;
    }
  }

  /**
   * Supprimer une dépense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/${expenseId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la dépense:', error);
      throw error;
    }
  }

  /**
   * Récupérer une dépense par ID
   */
  static async getExpenseById(expenseId: string): Promise<Expense | null> {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Dépense non trouvée
      }
      console.error('Erreur lors de la récupération de la dépense:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des dépenses
   */
  static async getExpenseStats(projectId?: string): Promise<{
    total_expenses: number;
    total_amount: number;
    declared_amount: number;
    undeclared_amount: number;
    by_payment_mode: Record<string, { count: number; amount: number }>;
  }> {
    try {
      const endpoint = projectId && projectId !== 'all'
        ? `/expenses/stats/project/${projectId}`
        : '/expenses/stats';

      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
