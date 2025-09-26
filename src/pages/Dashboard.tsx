import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/components/layout/AppLayout';
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
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalRevenue: 0,
    pendingChecks: 0,
    completedSales: 0,
    monthlyGrowth: 12.5,
    activeClients: 24,
    upcomingDeadlines: 3
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const fetchStats = async () => {
    if (!user) return;
    
    // Fetch projects count
    const { count: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch pending checks count
    const { count: checksCount } = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('facture_recue', false);

    setStats(prev => ({
      ...prev,
      totalProjects: projectsCount || 0,
      pendingChecks: checksCount || 0
    }));
  };

  if (loading) {
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

  const headerActions = (
    <div className="flex items-center space-x-3">
      <Button size="sm" className="btn-premium">
        <Plus className="h-4 w-4 mr-2" />
        Nouveau Projet
      </Button>
      <Button variant="outline" size="sm">
        <FileCheck className="h-4 w-4 mr-2" />
        Rapports
      </Button>
    </div>
  );

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Bienvenue, ${profile?.nom || 'Promoteur'}`}
      actions={headerActions}
    >

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Projets Actifs
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalProjects}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12%
              </Badge>
              <p className="text-xs text-foreground-secondary">vs mois dernier</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Chiffre d'Affaires
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalRevenue.toLocaleString()} DH
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{stats.monthlyGrowth}%
              </Badge>
              <p className="text-xs text-foreground-secondary">croissance mensuelle</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Checks */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Chèques en Attente
            </CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <FileCheck className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.pendingChecks}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                <Activity className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
              <p className="text-xs text-foreground-secondary">nécessitent attention</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Sales */}
        <Card className="card-premium hover-float">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground-secondary">
              Ventes Finalisées
            </CardTitle>
            <div className="p-2 bg-secondary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.completedSales}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                <Target className="h-3 w-3 mr-1" />
                85%
              </Badge>
              <p className="text-xs text-foreground-secondary">de l'objectif mensuel</p>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/create-project">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Plus className="h-5 w-5" />
                  Nouveau Projet
                </CardTitle>
                <CardDescription>
                  Créer un nouveau projet immobilier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full btn-hero">
                  Créer un Projet
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/expenses">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <DollarSign className="h-5 w-5" />
                  Gérer les Dépenses
                </CardTitle>
                <CardDescription>
                  Ajouter et suivre les dépenses par projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Voir les Dépenses
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/checks">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileCheck className="h-5 w-5" />
                  Suivi des Chèques
                </CardTitle>
                <CardDescription>
                  Gérer les chèques reçus et donnés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Voir les Chèques
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/projects">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="h-5 w-5" />
                  Mes Projets
                </CardTitle>
                <CardDescription>
                  Voir et gérer tous vos projets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Voir les Projets
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/sales">
            <Card className="card-premium hover-lift cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <TrendingUp className="h-5 w-5" />
                  Gestion des Ventes
                </CardTitle>
                <CardDescription>
                  Suivre les ventes et avances reçues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Voir les Ventes
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="card-premium hover-lift cursor-pointer group border-dashed border-2 border-border hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 group-hover:text-primary transition-colors text-foreground-secondary">
                <Plus className="h-5 w-5" />
                Plus d'outils
              </CardTitle>
              <CardDescription>
                Découvrir d'autres fonctionnalités premium
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
    </AppLayout>
  );
};

export default Dashboard;