import { apiClient } from '@/integrations/api/client';
import { DateFilterValue } from '@/components/dashboard/DashboardDateFilter';

export interface DashboardStats {
  totalProjects: number;
  totalRevenue: number;
  pendingChecks: number;
  completedSales: number;
  monthlyGrowth: number;
  activeClients: number;
  upcomingDeadlines: number;
  totalExpenses: number;
  netProfit: number;
  averageProjectValue: number;
  salesConversionRate: number;
  pendingPayments: number;
}

export interface DashboardFilters {
  dateFilter: DateFilterValue;
}

export class DashboardService {
  /**
   * Récupérer les statistiques du dashboard avec filtres
   */
  static async getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
    try {
      const params: Record<string, any> = {};
      
      // Ajouter les filtres de date
      if (filters.dateFilter.period !== 'all') {
        params.period = filters.dateFilter.period;
        if (filters.dateFilter.startDate) {
          params.startDate = filters.dateFilter.startDate.toISOString();
        }
        if (filters.dateFilter.endDate) {
          params.endDate = filters.dateFilter.endDate.toISOString();
        }
      }

      // Récupérer les statistiques des projets
      const projectsResponse = await apiClient.get('/projects/stats', params);
      const projectsStats = projectsResponse.data;

      // Récupérer les statistiques des ventes
      const salesResponse = await apiClient.get('/sales/stats', params);
      const salesStats = salesResponse.data;

      // Récupérer les statistiques des chèques
      const checksResponse = await apiClient.get('/checks/stats', params);
      const checksStats = checksResponse.data;

      // Récupérer les statistiques des dépenses
      const expensesResponse = await apiClient.get('/expenses/stats', params);
      const expensesStats = expensesResponse.data;

      // Récupérer les statistiques des paiements
      const paymentsResponse = await apiClient.get('/payments/stats', params);
      const paymentsStats = paymentsResponse.data;

      // Calculer les métriques dérivées
      const totalRevenue = salesStats.chiffreAffairesTotal || 0;
      const totalExpenses = expensesStats.totalExpenses || 0;
      const netProfit = totalRevenue - totalExpenses;
      const averageProjectValue = projectsStats.totalProjects > 0 
        ? totalRevenue / projectsStats.totalProjects 
        : 0;

      return {
        totalProjects: projectsStats.totalProjects || 0,
        totalRevenue,
        pendingChecks: checksStats.pendingChecks || 0,
        completedSales: salesStats.ventesFinalisees || 0,
        monthlyGrowth: salesStats.monthlyGrowth || 0,
        activeClients: salesStats.activeClients || 0,
        upcomingDeadlines: paymentsStats.upcomingDeadlines || 0,
        totalExpenses,
        netProfit,
        averageProjectValue,
        salesConversionRate: salesStats.conversionRate || 0,
        pendingPayments: paymentsStats.pendingPayments || 0,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
      throw error;
    }
  }

  /**
   * Récupérer les données pour les graphiques du dashboard
   */
  static async getDashboardCharts(filters: DashboardFilters) {
    try {
      const params: Record<string, any> = {};
      
      // Ajouter les filtres de date
      if (filters.dateFilter.period !== 'all') {
        params.period = filters.dateFilter.period;
        if (filters.dateFilter.startDate) {
          params.startDate = filters.dateFilter.startDate.toISOString();
        }
        if (filters.dateFilter.endDate) {
          params.endDate = filters.dateFilter.endDate.toISOString();
        }
      }

      // Récupérer les données des graphiques
      const [
        revenueChartResponse,
        salesChartResponse,
        expensesChartResponse,
        paymentsChartResponse
      ] = await Promise.all([
        apiClient.get('/sales/charts/revenue', params),
        apiClient.get('/sales/charts/sales', params),
        apiClient.get('/expenses/charts/expenses', params),
        apiClient.get('/payments/charts/payments', params)
      ]);

      return {
        revenueChart: revenueChartResponse.data,
        salesChart: salesChartResponse.data,
        expensesChart: expensesChartResponse.data,
        paymentsChart: paymentsChartResponse.data,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des graphiques du dashboard:', error);
      throw error;
    }
  }

  /**
   * Récupérer les activités récentes
   */
  static async getRecentActivities(filters: DashboardFilters) {
    try {
      const params: Record<string, any> = {
        limit: 10 // Limiter à 10 activités récentes
      };
      
      // Ajouter les filtres de date
      if (filters.dateFilter.period !== 'all') {
        params.period = filters.dateFilter.period;
        if (filters.dateFilter.startDate) {
          params.startDate = filters.dateFilter.startDate.toISOString();
        }
        if (filters.dateFilter.endDate) {
          params.endDate = filters.dateFilter.endDate.toISOString();
        }
      }

      const response = await apiClient.get('/dashboard/activities', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des activités récentes:', error);
      throw error;
    }
  }

  /**
   * Récupérer les alertes et notifications
   */
  static async getDashboardAlerts(filters: DashboardFilters) {
    try {
      const params: Record<string, any> = {};
      
      // Ajouter les filtres de date pour les échéances
      if (filters.dateFilter.period !== 'all') {
        params.period = filters.dateFilter.period;
        if (filters.dateFilter.startDate) {
          params.startDate = filters.dateFilter.startDate.toISOString();
        }
        if (filters.dateFilter.endDate) {
          params.endDate = filters.dateFilter.endDate.toISOString();
        }
      }

      const response = await apiClient.get('/dashboard/alerts', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }

  /**
   * Comparer les performances avec la période précédente
   */
  static async getPerformanceComparison(filters: DashboardFilters) {
    try {
      const params: Record<string, any> = {};
      
      // Ajouter les filtres de date
      if (filters.dateFilter.period !== 'all') {
        params.period = filters.dateFilter.period;
        if (filters.dateFilter.startDate) {
          params.startDate = filters.dateFilter.startDate.toISOString();
        }
        if (filters.dateFilter.endDate) {
          params.endDate = filters.dateFilter.endDate.toISOString();
        }
      }

      const response = await apiClient.get('/dashboard/comparison', params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la comparaison des performances:', error);
      throw error;
    }
  }
}

export default DashboardService;
