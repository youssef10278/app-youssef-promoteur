import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Home, Plus, ArrowLeft, Building2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Project, Sale, SaleWithPayments, SalesFilters } from '@/types/sale-new';
import { NewSaleModal } from '@/components/sales/NewSaleModal';
import { SalesList } from '@/components/sales/SalesList';
import { AddPaymentModal } from '@/components/sales/AddPaymentModal';
import { SaleDetailsModal } from '@/components/sales/SaleDetailsModal';
import { SalesFilters as SalesFiltersComponent, SalesFiltersState } from '@/components/sales/SalesFilters';
import { ProjectAnalyticsComponent } from '@/components/sales/ProjectAnalytics';
import { ProjectSelector } from '@/components/common/ProjectSelector';
import { SalesService } from '@/services/salesService';

const Sales = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // États principaux
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sales, setSales] = useState<SaleWithPayments[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleWithPayments[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<SaleWithPayments | null>(null);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<SaleWithPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // États pour les filtres
  const [filters, setFilters] = useState<SalesFiltersState>({
    searchTerm: '',
    statut: '',
    type_propriete: '',
    mode_paiement: '',
    date_debut: null,
    date_fin: null,
    montant_min: null,
    montant_max: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Chargement des projets
  useEffect(() => {
    if (!user?.id) return;

    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);

        // Sélectionner le premier projet par défaut
        if (data && data.length > 0) {
          setSelectedProject(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id, toast]);

  // Charger les ventes du projet sélectionné
  useEffect(() => {
    if (!selectedProject || !user?.id) return;

    const fetchSales = async () => {
      setIsLoadingSales(true);
      try {
        // Convertir les filtres au format attendu par le service
        const salesFilters: SalesFilters = {
          searchTerm: filters.searchTerm || undefined,
          statut: filters.statut || undefined,
          type_propriete: filters.type_propriete || undefined,
          mode_paiement: filters.mode_paiement || undefined,
          date_debut: filters.date_debut?.toISOString() || undefined,
          date_fin: filters.date_fin?.toISOString() || undefined,
          montant_min: filters.montant_min || undefined,
          montant_max: filters.montant_max || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        };

        // Charger les ventes depuis la base de données
        const salesData = await SalesService.getSalesWithPayments(selectedProject, salesFilters);
        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les ventes",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSales(false);
      }
    };

    fetchSales();
  }, [selectedProject, user?.id, filters, toast]);

  // Handler pour les changements de filtres
  const handleFiltersChange = (newFilters: SalesFiltersState) => {
    setFilters(newFilters);
  };

  // Handlers pour les modals
  const handleSaleCreated = async () => {
    setIsDialogOpen(false);
    // Recharger les ventes
    if (selectedProject && user?.id) {
      try {
        const salesFilters: SalesFilters = {
          searchTerm: filters.searchTerm || undefined,
          statut: filters.statut || undefined,
          type_propriete: filters.type_propriete || undefined,
          mode_paiement: filters.mode_paiement || undefined,
          date_debut: filters.date_debut?.toISOString() || undefined,
          date_fin: filters.date_fin?.toISOString() || undefined,
          montant_min: filters.montant_min || undefined,
          montant_max: filters.montant_max || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        };
        const salesData = await SalesService.getSalesWithPayments(selectedProject, salesFilters);
        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        console.error('Error reloading sales:', error);
      }
    }
  };

  const handlePaymentAdded = async () => {
    setSelectedSaleForPayment(null);
    // Recharger les ventes
    if (selectedProject && user?.id) {
      try {
        const salesFilters: SalesFilters = {
          searchTerm: filters.searchTerm || undefined,
          statut: filters.statut || undefined,
          type_propriete: filters.type_propriete || undefined,
          mode_paiement: filters.mode_paiement || undefined,
          date_debut: filters.date_debut?.toISOString() || undefined,
          date_fin: filters.date_fin?.toISOString() || undefined,
          montant_min: filters.montant_min || undefined,
          montant_max: filters.montant_max || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        };
        const salesData = await SalesService.getSalesWithPayments(selectedProject, salesFilters);
        setSales(salesData);
        setFilteredSales(salesData);
      } catch (error) {
        console.error('Error reloading sales:', error);
      }
    }
  };

  // Redirection si non authentifié
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement des projets...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 gap-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-primary" />
                <h1 className="text-lg sm:text-xl font-bold">Gestion des Ventes</h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Sélection du projet */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-sm font-medium whitespace-nowrap">Projet :</span>
                <ProjectSelector
                  projects={projects}
                  selectedProject={selectedProject}
                  onProjectChange={setSelectedProject}
                  placeholder="Sélectionner un projet"
                  showAllOption={false}
                  className="w-full sm:w-[200px]"
                />
              </div>

              {/* Bouton Nouvelle Vente */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-secondary-gradient w-full sm:w-auto" disabled={!selectedProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Vente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <NewSaleModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    selectedProject={projects.find(p => p.id === selectedProject) || null}
                    onSaleCreated={handleSaleCreated}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="sales-page">
        {selectedProject ? (
          <div className="space-y-8">
            {/* Section Analytics */}
            <ProjectAnalyticsComponent
              projectId={selectedProject}
              projectName={projects.find(p => p.id === selectedProject)?.nom || ''}
            />

            {/* Section Ventes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    Ventes du Projet
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Liste des ventes et suivi des paiements
                  </p>
                </div>
              </div>

              {/* Composant de filtres et recherche */}
              <SalesFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                totalResults={filteredSales.length}
                isLoading={isLoadingSales}
              />

              {isLoadingSales ? (
                <Card className="card-premium text-center py-12">
                  <CardContent>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Chargement des ventes...</p>
                  </CardContent>
                </Card>
              ) : (
                <SalesList
                  sales={filteredSales}
                  onAddPayment={(sale) => setSelectedSaleForPayment(sale)}
                  onViewDetails={(sale) => setSelectedSaleForDetails(sale)}
                />
              )}
            </div>
          </div>
        ) : (
          <Card className="card-premium">
            <CardContent className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun projet sélectionné</h3>
              <p className="text-muted-foreground mb-4">
                Veuillez sélectionner un projet pour voir les ventes et l'inventaire
              </p>
              <Link to="/projects">
                <Button className="btn-hero">
                  <Building2 className="h-4 w-4 mr-2" />
                  Voir les projets
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal pour ajouter un paiement */}
      <Dialog open={!!selectedSaleForPayment} onOpenChange={() => setSelectedSaleForPayment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSaleForPayment && (
            <AddPaymentModal
              sale={selectedSaleForPayment}
              onClose={() => setSelectedSaleForPayment(null)}
              onPaymentAdded={handlePaymentAdded}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal pour voir les détails d'une vente */}
      <Dialog open={!!selectedSaleForDetails} onOpenChange={() => setSelectedSaleForDetails(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedSaleForDetails && (
            <SaleDetailsModal
              sale={selectedSaleForDetails}
              onClose={() => setSelectedSaleForDetails(null)}
              onAddPayment={() => {
                setSelectedSaleForDetails(null);
                setSelectedSaleForPayment(selectedSaleForDetails);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
