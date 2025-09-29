import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/integrations/api/client';
import { 
  PaymentPlan, 
  Payment, 
  CreatePaymentPlanData, 
  RecordPaymentData,
  PaymentStats 
} from '@/integrations/api/types';
import { useToast } from '@/hooks/use-toast';

interface UsePaymentPlansReturn {
  paymentPlans: PaymentPlan[];
  isLoading: boolean;
  error: string | null;
  createPaymentPlan: (planData: CreatePaymentPlanData) => Promise<PaymentPlan>;
  updatePaymentPlan: (id: string, planData: Partial<CreatePaymentPlanData>) => Promise<PaymentPlan>;
  deletePaymentPlan: (id: string) => Promise<void>;
  recordPayment: (planId: string, paymentData: RecordPaymentData) => Promise<Payment>;
  refreshPaymentPlans: () => Promise<void>;
}

export const usePaymentPlans = (saleId?: string): UsePaymentPlansReturn => {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = () => setError(null);

  // Charger les plans de paiement
  const loadPaymentPlans = useCallback(async () => {
    if (!saleId) {
      setPaymentPlans([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.getPaymentPlans(saleId);
      
      if (response.success && response.data) {
        setPaymentPlans(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des plans de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des plans de paiement';
      setError(errorMessage);
      console.error('Erreur lors du chargement des plans de paiement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  // Créer un nouveau plan de paiement
  const createPaymentPlan = useCallback(async (planData: CreatePaymentPlanData): Promise<PaymentPlan> => {
    try {
      clearError();

      const response = await apiClient.createPaymentPlan(planData);
      
      if (response.success && response.data) {
        const newPlan = response.data;
        setPaymentPlans(prev => [...prev, newPlan]);
        
        toast({
          title: "Plan de paiement créé",
          description: `Plan de ${newPlan.nombre_echeances} échéances créé avec succès.`,
          variant: "default",
        });

        return newPlan;
      } else {
        throw new Error(response.error || 'Erreur lors de la création du plan de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du plan de paiement';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Mettre à jour un plan de paiement
  const updatePaymentPlan = useCallback(async (id: string, planData: Partial<CreatePaymentPlanData>): Promise<PaymentPlan> => {
    try {
      clearError();

      const response = await apiClient.updatePaymentPlan(id, planData);
      
      if (response.success && response.data) {
        const updatedPlan = response.data;
        setPaymentPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
        
        toast({
          title: "Plan de paiement modifié",
          description: "Le plan de paiement a été modifié avec succès.",
          variant: "default",
        });

        return updatedPlan;
      } else {
        throw new Error(response.error || 'Erreur lors de la modification du plan de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du plan de paiement';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Supprimer un plan de paiement
  const deletePaymentPlan = useCallback(async (id: string): Promise<void> => {
    try {
      clearError();

      const response = await apiClient.deletePaymentPlan(id);
      
      if (response.success) {
        setPaymentPlans(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Plan de paiement supprimé",
          description: "Le plan de paiement a été supprimé avec succès.",
          variant: "default",
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression du plan de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du plan de paiement';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Enregistrer un paiement
  const recordPayment = useCallback(async (planId: string, paymentData: RecordPaymentData): Promise<Payment> => {
    try {
      clearError();

      const response = await apiClient.recordPayment(planId, paymentData);
      
      if (response.success && response.data) {
        const newPayment = response.data;
        
        toast({
          title: "Paiement enregistré",
          description: `Paiement de ${paymentData.montant}€ enregistré avec succès.`,
          variant: "default",
        });

        // Recharger les plans de paiement pour mettre à jour les statuts
        await loadPaymentPlans();

        return newPayment;
      } else {
        throw new Error(response.error || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du paiement';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast, loadPaymentPlans]);

  // Rafraîchir les plans de paiement
  const refreshPaymentPlans = useCallback(async () => {
    await loadPaymentPlans();
  }, [loadPaymentPlans]);

  // Charger les plans de paiement au montage du composant
  useEffect(() => {
    loadPaymentPlans();
  }, [loadPaymentPlans]);

  return {
    paymentPlans,
    isLoading,
    error,
    createPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    recordPayment,
    refreshPaymentPlans,
  };
};

// Hook pour l'historique des paiements d'une vente
export const usePaymentHistory = (saleId: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentHistory = useCallback(async () => {
    if (!saleId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getPaymentHistory(saleId);
      
      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement de l\'historique des paiements');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique des paiements';
      setError(errorMessage);
      console.error('Erreur lors du chargement de l\'historique des paiements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    loadPaymentHistory();
  }, [loadPaymentHistory]);

  return {
    payments,
    isLoading,
    error,
    refreshPaymentHistory: loadPaymentHistory,
  };
};

// Hook pour les statistiques de paiement
export const usePaymentStats = () => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getPaymentStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des statistiques de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques de paiement';
      setError(errorMessage);
      console.error('Erreur lors du chargement des statistiques de paiement:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentStats();
  }, [loadPaymentStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: loadPaymentStats,
  };
};
