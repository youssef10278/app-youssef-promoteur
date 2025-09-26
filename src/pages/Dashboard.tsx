import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, DollarSign, FileCheck, LogOut, Plus } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalRevenue: 0,
    pendingChecks: 0,
    completedSales: 0
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
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestion Immobilière Pro</h1>
                <p className="text-primary-foreground/80">
                  Bienvenue, {profile?.nom || 'Promoteur'}
                </p>
              </div>
            </div>
            <Button 
              onClick={signOut} 
              variant="outline" 
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-stats hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Total des projets</p>
            </CardContent>
          </Card>

          <Card className="card-stats hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.totalRevenue.toLocaleString()} DH</div>
              <p className="text-xs text-muted-foreground">Revenus totaux</p>
            </CardContent>
          </Card>

          <Card className="card-stats hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chèques en Attente</CardTitle>
              <DollarSign className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pendingChecks}</div>
              <p className="text-xs text-muted-foreground">Factures non reçues</p>
            </CardContent>
          </Card>

          <Card className="card-stats hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes Finalisées</CardTitle>
              <FileCheck className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{stats.completedSales}</div>
              <p className="text-xs text-muted-foreground">Transactions complètes</p>
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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;