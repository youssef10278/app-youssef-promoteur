import { useState, useEffect, useCallback } from 'react';
import { ExpenseService } from '@/services/expenseService';
import { 
  Expense, 
  ExpenseWithPayments, 
  ExpenseFilters, 
  SimpleExpenseFormData, 
  ExpensePaymentFormData,
  ExpensePayment 
} from '@/types/expense';
import { useToast } from '@/hooks/use-toast';

interface UseExpensesNewReturn {
  // États
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  
  // Actions CRUD dépenses
  createSimpleExpense: (data: SimpleExpenseFormData) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpenseStatus: (id: string, statut: 'actif' | 'termine' | 'annule') => Promise<Expense>;
  
  // Actions paiements
  getExpenseWithPayments: (id: string) => Promise<ExpenseWithPayments>;
  addExpensePayment: (expenseId: string, data: ExpensePaymentFormData) => Promise<ExpensePayment>;
  updateExpensePayment: (paymentId: string, data: ExpensePaymentFormData) => Promise<ExpensePayment>;
  deleteExpensePayment: (paymentId: string) => Promise<void>;
  
  // Utilitaires
  refreshExpenses: () => Promise<void>;
  loadExpenses: (projectId?: string, filters?: ExpenseFilters) => Promise<void>;
}

export const useExpensesNew = (initialProjectId?: string): UseExpensesNewReturn => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const showErrorToast = (message: string, error?: any) => {
    console.error(message, error);
    toast({
      title: "Erreur",
      description: message,
      variant: "destructive",
    });
  };

  const showSuccessToast = (message: string) => {
    toast({
      title: "Succès",
      description: message,
    });
  };

  // Charger les dépenses
  const loadExpenses = useCallback(async (projectId?: string, filters?: ExpenseFilters) => {
    try {
      setIsLoading(true);
      clearError();

      const data = await ExpenseService.getExpenses(projectId, filters);
      setExpenses(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des dépenses';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Rafraîchir les dépenses
  const refreshExpenses = useCallback(async () => {
    await loadExpenses(initialProjectId);
  }, [loadExpenses, initialProjectId]);

  // Créer une dépense simple
  const createSimpleExpense = useCallback(async (data: SimpleExpenseFormData): Promise<Expense> => {
    try {
      clearError();
      const newExpense = await ExpenseService.createSimpleExpense(data);
      
      // Ajouter la nouvelle dépense à la liste
      setExpenses(prev => [newExpense, ...prev]);
      
      showSuccessToast('Dépense créée avec succès');
      return newExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la dépense';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast]);

  // Mettre à jour une dépense
  const updateExpense = useCallback(async (id: string, data: Partial<Expense>): Promise<Expense> => {
    try {
      clearError();
      const updatedExpense = await ExpenseService.updateExpense(id, data);
      
      // Mettre à jour la dépense dans la liste
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ));
      
      showSuccessToast('Dépense modifiée avec succès');
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la dépense';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast]);

  // Supprimer une dépense
  const deleteExpense = useCallback(async (id: string): Promise<void> => {
    try {
      clearError();
      await ExpenseService.deleteExpense(id);
      
      // Retirer la dépense de la liste
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      showSuccessToast('Dépense supprimée avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la dépense';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast]);

  // Changer le statut d'une dépense
  const updateExpenseStatus = useCallback(async (id: string, statut: 'actif' | 'termine' | 'annule'): Promise<Expense> => {
    try {
      clearError();
      const updatedExpense = await ExpenseService.updateExpenseStatus(id, statut);
      
      // Mettre à jour la dépense dans la liste
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ));
      
      const statusLabels = { actif: 'active', termine: 'terminée', annule: 'annulée' };
      showSuccessToast(`Dépense marquée comme ${statusLabels[statut]}`);
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast]);

  // Récupérer une dépense avec ses paiements
  const getExpenseWithPayments = useCallback(async (id: string): Promise<ExpenseWithPayments> => {
    try {
      clearError();
      return await ExpenseService.getExpenseWithPayments(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la dépense';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast]);

  // Ajouter un paiement
  const addExpensePayment = useCallback(async (expenseId: string, data: ExpensePaymentFormData): Promise<ExpensePayment> => {
    try {
      clearError();
      const newPayment = await ExpenseService.addExpensePayment(expenseId, data);
      
      // Rafraîchir les dépenses pour mettre à jour les totaux
      await refreshExpenses();
      
      showSuccessToast('Paiement ajouté avec succès');
      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du paiement';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast, refreshExpenses]);

  // Modifier un paiement
  const updateExpensePayment = useCallback(async (paymentId: string, data: ExpensePaymentFormData): Promise<ExpensePayment> => {
    try {
      clearError();
      const updatedPayment = await ExpenseService.updateExpensePayment(paymentId, data);
      
      // Rafraîchir les dépenses pour mettre à jour les totaux
      await refreshExpenses();
      
      showSuccessToast('Paiement modifié avec succès');
      return updatedPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du paiement';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast, refreshExpenses]);

  // Supprimer un paiement
  const deleteExpensePayment = useCallback(async (paymentId: string): Promise<void> => {
    try {
      clearError();
      await ExpenseService.deleteExpensePayment(paymentId);
      
      // Rafraîchir les dépenses pour mettre à jour les totaux
      await refreshExpenses();
      
      showSuccessToast('Paiement supprimé avec succès');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du paiement';
      setError(errorMessage);
      showErrorToast(errorMessage, err);
      throw err;
    }
  }, [toast, refreshExpenses]);

  // Charger les dépenses au montage du composant
  useEffect(() => {
    if (initialProjectId) {
      loadExpenses(initialProjectId);
    }
  }, [loadExpenses, initialProjectId]);

  return {
    // États
    expenses,
    isLoading,
    error,
    
    // Actions CRUD dépenses
    createSimpleExpense,
    updateExpense,
    deleteExpense,
    updateExpenseStatus,
    
    // Actions paiements
    getExpenseWithPayments,
    addExpensePayment,
    updateExpensePayment,
    deleteExpensePayment,
    
    // Utilitaires
    refreshExpenses,
    loadExpenses,
  };
};
