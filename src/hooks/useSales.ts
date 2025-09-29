import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Sale, CreateSaleData, SaleFilters } from '@/integrations/api/types';
import { useToast } from '@/hooks/use-toast';

interface UseSalesReturn {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  createSale: (saleData: CreateSaleData) => Promise<Sale>;
  updateSale: (id: string, saleData: Partial<CreateSaleData>) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
  refreshSales: () => Promise<void>;
  loadSales: (filters?: SaleFilters) => Promise<void>;
}

export const useSales = (initialFilters?: SaleFilters): UseSalesReturn => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SaleFilters | undefined>(initialFilters);
  const { toast } = useToast();

  const clearError = () => setError(null);

  // Charger les ventes avec filtres
  const loadSales = useCallback(async (filters?: SaleFilters) => {
    try {
      setIsLoading(true);
      clearError();

      const filtersToUse = filters || currentFilters;
      setCurrentFilters(filtersToUse);

      const response = await apiClient.getSales(filtersToUse);
      
      if (response.success && response.data) {
        setSales(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des ventes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des ventes';
      setError(errorMessage);
      console.error('Erreur lors du chargement des ventes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // Créer une nouvelle vente
  const createSale = useCallback(async (saleData: CreateSaleData): Promise<Sale> => {
    try {
      clearError();

      const response = await apiClient.createSale(saleData);
      
      if (response.success && response.data) {
        const newSale = response.data;
        setSales(prev => [...prev, newSale]);
        
        toast({
          title: "Vente créée",
          description: `La vente pour ${newSale.client_prenom} ${newSale.client_nom} a été créée avec succès.`,
          variant: "default",
        });

        return newSale;
      } else {
        throw new Error(response.error || 'Erreur lors de la création de la vente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la vente';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Mettre à jour une vente
  const updateSale = useCallback(async (id: string, saleData: Partial<CreateSaleData>): Promise<Sale> => {
    try {
      clearError();

      const response = await apiClient.updateSale(id, saleData);
      
      if (response.success && response.data) {
        const updatedSale = response.data;
        setSales(prev => prev.map(s => s.id === id ? updatedSale : s));
        
        toast({
          title: "Vente modifiée",
          description: `La vente pour ${updatedSale.client_prenom} ${updatedSale.client_nom} a été modifiée avec succès.`,
          variant: "default",
        });

        return updatedSale;
      } else {
        throw new Error(response.error || 'Erreur lors de la modification de la vente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la vente';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Supprimer une vente
  const deleteSale = useCallback(async (id: string): Promise<void> => {
    try {
      clearError();

      const saleToDelete = sales.find(s => s.id === id);
      
      const response = await apiClient.deleteSale(id);
      
      if (response.success) {
        setSales(prev => prev.filter(s => s.id !== id));
        
        toast({
          title: "Vente supprimée",
          description: `La vente pour ${saleToDelete?.client_prenom || ''} ${saleToDelete?.client_nom || 'inconnu'} a été supprimée avec succès.`,
          variant: "default",
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression de la vente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la vente';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [sales, toast]);

  // Rafraîchir la liste des ventes
  const refreshSales = useCallback(async () => {
    await loadSales();
  }, [loadSales]);

  // Charger les ventes au montage du composant
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    isLoading,
    error,
    createSale,
    updateSale,
    deleteSale,
    refreshSales,
    loadSales,
  };
};

// Hook pour les ventes d'un projet spécifique
export const useSalesByProject = (projectId: string, filters?: SaleFilters) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getSalesByProject(projectId, filters);
      
      if (response.success && response.data) {
        setSales(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des ventes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des ventes';
      setError(errorMessage);
      console.error('Erreur lors du chargement des ventes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    isLoading,
    error,
    refreshSales: loadSales,
  };
};

// Hook pour une vente spécifique
export const useSale = (id: string) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSale = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getSale(id);
      
      if (response.success && response.data) {
        setSale(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement de la vente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la vente';
      setError(errorMessage);
      console.error('Erreur lors du chargement de la vente:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  return {
    sale,
    isLoading,
    error,
    refreshSale: loadSale,
  };
};
