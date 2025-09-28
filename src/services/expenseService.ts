import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseFilters } from '@/types/expense';

export class ExpenseService {
  /**
   * Récupérer toutes les dépenses avec filtres
   */
  static async getExpenses(projectId?: string, filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      let query = supabase
        .from('expenses')
        .select(`
          *,
          projects!inner(nom, user_id)
        `)
        .eq('projects.user_id', user.id);

      // Filtrer par projet si spécifié
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      // Appliquer les filtres de recherche
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        query = query.or(`nom.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Filtrer par mode de paiement
      if (filters?.mode_paiement) {
        query = query.eq('mode_paiement', filters.mode_paiement);
      }

      // Filtrer par date de début
      if (filters?.date_debut) {
        query = query.gte('created_at', filters.date_debut);
      }

      // Filtrer par date de fin
      if (filters?.date_fin) {
        // Ajouter 23:59:59 pour inclure toute la journée
        const endDate = new Date(filters.date_fin);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Filtrer par montant minimum
      if (filters?.montant_min !== undefined && filters.montant_min !== null) {
        query = query.gte('montant_total', filters.montant_min);
      }

      // Filtrer par montant maximum
      if (filters?.montant_max !== undefined && filters.montant_max !== null) {
        query = query.lte('montant_total', filters.montant_max);
      }

      // Appliquer le tri
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      const ascending = sortOrder === 'asc';

      query = query.order(sortBy, { ascending });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          ...expenseData,
          user_id: user.id
        }])
        .select(`
          *,
          projects!inner(nom)
        `)
        .single();

      if (error) throw error;

      return data;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .select(`
          *,
          projects!inner(nom)
        `)
        .single();

      if (error) throw error;

      return data;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) throw error;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          projects!inner(nom)
        `)
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Dépense non trouvée
        }
        throw error;
      }

      return data;
    } catch (error) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);

      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      const stats = {
        total_expenses: expenses?.length || 0,
        total_amount: 0,
        declared_amount: 0,
        undeclared_amount: 0,
        by_payment_mode: {} as Record<string, { count: number; amount: number }>
      };

      expenses?.forEach(expense => {
        stats.total_amount += expense.montant_total;
        stats.declared_amount += expense.montant_declare;
        stats.undeclared_amount += expense.montant_non_declare;

        if (!stats.by_payment_mode[expense.mode_paiement]) {
          stats.by_payment_mode[expense.mode_paiement] = { count: 0, amount: 0 };
        }
        stats.by_payment_mode[expense.mode_paiement].count++;
        stats.by_payment_mode[expense.mode_paiement].amount += expense.montant_total;
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
