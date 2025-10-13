import { apiClient } from '@/integrations/api/client';
import { Expense, ExpenseFilters, ExpenseWithPayments, SimpleExpenseFormData, ExpensePaymentFormData, ExpensePayment } from '@/types/expense';

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

  /**
   * Créer une dépense simple (sans montant initial)
   */
  static async createSimpleExpense(data: SimpleExpenseFormData): Promise<Expense> {
    try {
      const response = await apiClient.post('/expenses/create-simple', data);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la création de la dépense');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.createSimpleExpense:', error);
      throw error;
    }
  }

  /**
   * Récupérer une dépense avec ses paiements
   */
  static async getExpenseWithPayments(expenseId: string): Promise<ExpenseWithPayments> {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}/with-payments`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la récupération de la dépense');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.getExpenseWithPayments:', error);
      throw error;
    }
  }

  /**
   * Ajouter un paiement à une dépense
   */
  static async addExpensePayment(expenseId: string, data: ExpensePaymentFormData): Promise<ExpensePayment> {
    try {
      const response = await apiClient.post(`/expenses/${expenseId}/payments`, data);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de l\'ajout du paiement');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.addExpensePayment:', error);
      throw error;
    }
  }

  /**
   * Récupérer les paiements d'une dépense
   */
  static async getExpensePayments(expenseId: string): Promise<ExpensePayment[]> {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}/payments`);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la récupération des paiements');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.getExpensePayments:', error);
      throw error;
    }
  }

  /**
   * Modifier un paiement de dépense
   */
  static async updateExpensePayment(paymentId: string, data: ExpensePaymentFormData): Promise<ExpensePayment> {
    try {
      const response = await apiClient.put(`/expenses/payments/${paymentId}`, data);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la modification du paiement');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.updateExpensePayment:', error);
      throw error;
    }
  }

  /**
   * Supprimer un paiement de dépense
   */
  static async deleteExpensePayment(paymentId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/expenses/payments/${paymentId}`);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression du paiement');
      }
    } catch (error) {
      console.error('Erreur ExpenseService.deleteExpensePayment:', error);
      throw error;
    }
  }

  /**
   * Changer le statut d'une dépense
   */
  static async updateExpenseStatus(expenseId: string, statut: 'actif' | 'termine' | 'annule'): Promise<Expense> {
    try {
      const response = await apiClient.patch(`/expenses/${expenseId}/status`, { statut });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la mise à jour du statut');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur ExpenseService.updateExpenseStatus:', error);
      throw error;
    }
  }
}
