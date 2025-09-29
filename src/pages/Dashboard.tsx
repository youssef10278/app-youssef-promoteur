import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/components/layout/AppLayout';
import { PWAStatus } from '@/components/pwa/PWAStatus';
import DashboardDateFilter, { DateFilterValue } from '@/components/dashboard/DashboardDateFilter';
import { DashboardService, DashboardStats } from '@/services/dashboardService';

import {
  Building2,
  TrendingUp,
  DollarSign,
  FileCheck,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  Calendar,
  Target
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalRevenue: 0,
    pendingChecks: 0,
    completedSales: 0,
    monthlyGrowth: 0,
    activeClients: 0,
    upcomingDeadlines: 0,
    totalExpenses: 0,
    netProfit: 0,
    averageProjectValue: 0,
    salesConversionRate: 0,
    pendingPayments: 0
  });
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    period: 'all'
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user, dateFilter]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      // Le profil utilisateur est déjà disponible via l'API d'auth
      const response = await apiClient.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      setIsLoadingStats(true);

      // Construire les paramètres de filtre
      const params: Record<string, any> = {};
      if (dateFilter.period !== 'all') {
        params.period = dateFilter.period;
        if (dateFilter.startDate) {
          params.startDate = dateFilter.startDate.toISOString();
        }
        if (dateFilter.endDate) {
          params.endDate = dateFilter.endDate.toISOString();
        }
      }

      console.log('🔍 Fetching stats with params:', params);

      // Récupérer les statistiques directement
      const [projectsResponse, salesResponse, checksResponse, expensesResponse, paymentsResponse] = await Promise.all([
        apiClient.get('/projects/stats', params).catch(err => {
          console.error('❌ Projects stats error:', err);
          console.error('❌ Projects stats full error:', err.response?.data || err.message);
          return { data: { totalProjects: 0, totalSurface: 0, totalLots: 0, averageSurface: 0 } };
        }),
        apiClient.get('/sales/stats', params).catch(err => {
          console.error('❌ Sales stats error:', err);
          console.error('❌ Sales stats full error:', err.response?.data || err.message);
          return { data: { chiffreAffairesTotal: 0, ventesFinalisees: 0, monthlyGrowth: 0, totalVentes: 0 } };
        }),
        apiClient.get('/checks/stats/summary', params).catch(err => {
          console.error('❌ Checks stats error:', err);
          console.error('❌ Checks stats full error:', err.response?.data || err.message);
          return { data: { total_cheques: "0", cheques_recus: "0", cheques_donnes: "0" } };
        }),
        apiClient.get('/expenses/stats', params).catch(err => {
          console.error('❌ Expenses stats error:', err);
          console.error('❌ Expenses stats full error:', err.response?.data || err.message);
          return { data: { totalExpenses: 0, totalAmount: 0 } };
        }),
        apiClient.get('/payments/stats', params).catch(err => {
          console.error('❌ Payments stats error:', err);
          console.error('❌ Payments stats full error:', err.response?.data || err.message);
          return { data: { upcomingDeadlines: 0, pendingPayments: 0 } };
        })
      ]);

      console.log('📊 API Responses RAW:', {
        projects: projectsResponse,
        sales: salesResponse,
        checks: checksResponse,
        expenses: expensesResponse,
        payments: paymentsResponse
      });

      console.log('📊 API Responses DATA:', {
        projects: projectsResponse.data,
        sales: salesResponse.data,
        checks: checksResponse.data,
        expenses: expensesResponse.data,
        payments: paymentsResponse.data
      });

      // Calculer les métriques
      const totalRevenue = salesResponse.data?.chiffreAffairesTotal || 0;
      const totalExpenses = expensesResponse.data?.totalAmount || 0;
      const netProfit = totalRevenue - totalExpenses;

      console.log('🔍 Extracted Values:', {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalProjects: projectsResponse.data?.totalProjects,
        pendingChecks: checksResponse.data?.total_cheques,
        completedSales: salesResponse.data?.ventesFinalisees
      });

      setStats({
        totalProjects: projectsResponse.data?.totalProjects || 0,
        totalRevenue,
        pendingChecks: parseInt(checksResponse.data?.total_cheques) || 0,
        completedSales: salesResponse.data?.ventesFinalisees || 0,
        monthlyGrowth: salesResponse.data?.monthlyGrowth || 0,
        activeClients: salesResponse.data?.activeClients || 0,
        upcomingDeadlines: paymentsResponse.data?.upcomingDeadlines || 0,
        totalExpenses,
        netProfit,
        averageProjectValue: projectsResponse.data?.totalProjects > 0 ? totalRevenue / projectsResponse.data.totalProjects : 0,
        salesConversionRate: salesResponse.data?.conversionRate || 0,
        pendingPayments: paymentsResponse.data?.pendingPayments || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleDateFilterChange = (newFilter: DateFilterValue) => {
    setDateFilter(newFilter);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const headerActions = null;

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Bienvenue, ${profile?.nom || 'Promoteur'}`}
      actions={headerActions}
    >
      {/* Filtre de date */}
      <DashboardDateFilter
        value={dateFilter}
        onChange={handleDateFilterChange}
        className="mb-6"
      />

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Total Projects */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-foreground-secondary">
              Projets Actifs
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  {stats.totalProjects}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 w-fit">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth.toFixed(1)}%
                  </Badge>
                  <p className="text-xs text-foreground-secondary">vs période précédente</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-foreground-secondary">
              Chiffre d'Affaires
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  {stats.totalRevenue.toLocaleString()} DH
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 w-fit">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth.toFixed(1)}%
                  </Badge>
                  <p className="text-xs text-foreground-secondary">croissance</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Bénéfice net: {stats.netProfit.toLocaleString()} DH
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Checks */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-foreground-secondary">
              Chèques en Attente
            </CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg flex-shrink-0">
              <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  {stats.pendingChecks}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 w-fit">
                    <Activity className="h-3 w-3 mr-1" />
                    {stats.upcomingDeadlines > 0 ? 'Urgent' : 'Normal'}
                  </Badge>
                  <p className="text-xs text-foreground-secondary">
                    {stats.upcomingDeadlines} échéances cette semaine
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Completed Sales */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm sm:text-base font-medium text-foreground-secondary">
              Ventes Finalisées
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  {stats.completedSales}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 w-fit">
                    <Target className="h-3 w-3 mr-1" />
                    {stats.salesConversionRate.toFixed(1)}%
                  </Badge>
                  <p className="text-xs text-foreground-secondary">taux de conversion</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {stats.activeClients} clients actifs
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link to="/create-project">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                  <Plus className="h-5 w-5 flex-shrink-0" />
                  Nouveau Projet
                </CardTitle>
                <CardDescription className="text-sm">
                  Créer un nouveau projet immobilier
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full btn-hero text-sm sm:text-base">
                  Créer un Projet
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/expenses">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                  <DollarSign className="h-5 w-5 flex-shrink-0" />
                  Gérer les Dépenses
                </CardTitle>
                <CardDescription className="text-sm">
                  Ajouter et suivre les dépenses par projet
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full text-sm sm:text-base" variant="outline">
                  Voir les Dépenses
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/checks">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                  <FileCheck className="h-5 w-5 flex-shrink-0" />
                  Suivi des Chèques
                </CardTitle>
                <CardDescription className="text-sm">
                  Gérer les chèques reçus et donnés
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full text-sm sm:text-base" variant="outline">
                  Voir les Chèques
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projects">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                  <Building2 className="h-5 w-5 flex-shrink-0" />
                  Mes Projets
                </CardTitle>
                <CardDescription className="text-sm">
                  Voir et gérer tous vos projets
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full text-sm sm:text-base" variant="outline">
                  Voir les Projets
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sales">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-base sm:text-lg">
                  <TrendingUp className="h-5 w-5 flex-shrink-0" />
                  Gestion des Ventes
                </CardTitle>
                <CardDescription className="text-sm">
                  Suivre les ventes et avances reçues
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full text-sm sm:text-base" variant="outline">
                  Voir les Ventes
                </Button>
              </CardContent>
            </Card>
          </Link>

          <PWAStatus />
        </div>
    </AppLayout>
  );
};

export default Dashboard;