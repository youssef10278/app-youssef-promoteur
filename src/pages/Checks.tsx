import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, ArrowLeft, Building2, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CheckFilters as CheckFiltersComponent, CheckFiltersState } from '@/components/checks/CheckFilters';
import { ProjectSelector } from '@/components/common/ProjectSelector';
import { CheckService, CheckFilters, Check as CheckType } from '@/services/checkService';
import { eventBus, EVENTS } from '@/utils/eventBus';

interface Project {
  id: string;
  nom: string;
}

interface CheckRecord extends CheckType {
  // Champs spécifiques aux chèques de paiement (pour compatibilité)
  payment_plan_id?: string;
  unite_numero?: string;
  banque?: string;
}

const Checks = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  // États pour les filtres
  const [filters, setFilters] = useState<CheckFiltersState>({
    searchTerm: '',
    type_cheque: 'all',
    date_debut: null,
    date_fin: null,
    montant_min: null,
    montant_max: null,
    statut: 'all',
    nom_beneficiaire: '',
    nom_emetteur: '',
    numero_cheque: ''
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fetchProjects = useCallback(async () => {
    try {
      const response = await apiClient.get('/projects');
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    }
  }, []);

  // Charger les projets au montage du composant
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchChecks = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      
      if (selectedProject && selectedProject !== 'all') {
        queryParams.append('project_id', selectedProject);
      }

      // Convertir les filtres avec les bons noms de paramètres pour le backend
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined && value !== 'all') {
          // Convertir type_cheque en type pour le backend
          const backendKey = key === 'type_cheque' ? 'type' : key;
          queryParams.append(backendKey, value.toString());
        }
      });

      const response = await CheckService.getChecks(queryParams.toString());
      if (response.success) {
        setChecks(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chèques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les chèques",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, filters, toast]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleFiltersChange = (newFilters: CheckFiltersState) => {
    setFilters(newFilters);
  };

  const handleMigrateProjectIds = async () => {
    setIsMigrating(true);
    try {
      const result = await CheckService.migrateProjectIds();
      
      toast({
        title: "Migration terminée",
        description: `${result.updated_checks} chèques mis à jour avec succès`,
      });

      // Recharger les chèques pour voir les changements
      fetchChecks();
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      toast({
        title: "Erreur de migration",
        description: "Impossible de migrer les project_id des chèques",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const checkData = {
        type_cheque: formData.get('type_cheque') as string,
        montant: parseFloat(formData.get('montant') as string),
        numero_cheque: formData.get('numero_cheque') as string,
        nom_beneficiaire: formData.get('nom_beneficiaire') as string,
        nom_emetteur: formData.get('nom_emetteur') as string,
        date_emission: formData.get('date_emission') as string,
        date_encaissement: formData.get('date_encaissement') as string || null,
        description: formData.get('description') as string,
        project_id: formData.get('project_id') === 'none' ? null : formData.get('project_id') as string,
      };

      const response = await CheckService.createCheck(checkData);
      
      if (response.success) {
        toast({
          title: "Chèque ajouté",
          description: "Le chèque a été ajouté avec succès",
        });
        
        setIsDialogOpen(false);
        fetchChecks();
        
        // Reset form
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du chèque:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le chèque",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchChecks();
  }, [fetchProjects, fetchChecks]);

  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.CHECK_CREATED, () => {
      console.log('🔄 [EVENT] Chèque créé, rechargement de la liste');
      fetchChecks();
    });

    // Écouter l'événement d'invalidation du cache
    const handleCacheInvalidation = () => {
      console.log('🔄 [CACHE] Événement d\'invalidation reçu, rechargement des chèques');
      fetchChecks();
    };

    window.addEventListener('checks-cache-invalidated', handleCacheInvalidation);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('checks-cache-invalidated', handleCacheInvalidation);
    };
  }, [fetchChecks]);

  // Filtrer les chèques par type
  const receivedChecks = checks.filter(check => check.type_cheque === 'recu');
  const givenChecks = checks.filter(check => check.type_cheque === 'donne');

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'emis': { label: 'Émis', variant: 'secondary' as const },
      'encaisse': { label: 'Encaissé', variant: 'default' as const },
      'annule': { label: 'Annulé', variant: 'destructive' as const },
      'en_attente': { label: 'En attente', variant: 'outline' as const },
    };
    
    const config = statusConfig[statut as keyof typeof statusConfig] || { label: statut, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderCheckCard = (check: CheckRecord) => (
    <Card key={check.id} className="card-premium">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Chèque #{check.numero_cheque || 'N/A'}
            </CardTitle>
            <CardDescription>
              {check.project_nom || check.projects?.nom || 'Général'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatAmount(check.montant)}
            </div>
            {getStatusBadge(check.statut)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Bénéficiaire:</span>
            <p className="text-muted-foreground">{check.nom_beneficiaire || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium">Émetteur:</span>
            <p className="text-muted-foreground">{check.nom_emetteur || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium">Date d'émission:</span>
            <p className="text-muted-foreground">{formatDate(check.date_emission)}</p>
          </div>
          {check.date_encaissement && (
            <div>
              <span className="font-medium">Date d'encaissement:</span>
              <p className="text-muted-foreground">{formatDate(check.date_encaissement)}</p>
            </div>
          )}
        </div>
        {check.description && (
          <div className="mt-3 pt-3 border-t">
            <span className="font-medium text-sm">Description:</span>
            <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gestion des Chèques</h1>
                <p className="text-primary-foreground/80">
                  Gérez vos chèques reçus et donnés
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleMigrateProjectIds}
                disabled={isMigrating}
                variant="secondary"
                size="sm"
                className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migration...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Migrer Projets
                  </>
                )}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-secondary-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Chèque
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouveau Chèque</DialogTitle>
                    <DialogDescription>
                      Enregistrer un nouveau chèque
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type_cheque">Type de chèque *</Label>
                      <Select name="type_cheque" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recu">Chèque Reçu</SelectItem>
                          <SelectItem value="donne">Chèque Donné</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project_id">Projet (optionnel)</Label>
                      <Select name="project_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun projet</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="montant">Montant (DH) *</Label>
                        <Input
                          id="montant"
                          name="montant"
                          type="number"
                          step="0.01"
                          placeholder="50000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_cheque">Numéro de chèque</Label>
                        <Input
                          id="numero_cheque"
                          name="numero_cheque"
                          placeholder="123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nom_beneficiaire">Nom du bénéficiaire</Label>
                      <Input
                        id="nom_beneficiaire"
                        name="nom_beneficiaire"
                        placeholder="Nom de la personne/société"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nom_emetteur">Nom de l'émetteur</Label>
                      <Input
                        id="nom_emetteur"
                        name="nom_emetteur"
                        placeholder="Nom de la personne/société"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_emission">Date d'émission *</Label>
                        <Input
                          id="date_emission"
                          name="date_emission"
                          type="date"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_encaissement">Date d'encaissement</Label>
                        <Input
                          id="date_encaissement"
                          name="date_encaissement"
                          type="date"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="Détails du chèque"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        Annuler
                      </Button>
                      <Button type="submit" className="flex-1 btn-hero" disabled={isSubmitting}>
                        {isSubmitting ? "Ajout..." : "Ajouter"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-4 items-center mb-6">
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject}
              onProjectChange={handleProjectChange}
              placeholder="Filtrer par projet"
              showAllOption={true}
              allOptionLabel="Tous les projets"
              className="w-[300px]"
            />
          </div>

          <CheckFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            resultCount={checks.length}
          />
        </div>

        {/* Tabs Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received">Chèques Reçus ({receivedChecks.length})</TabsTrigger>
              <TabsTrigger value="given">Chèques Donnés ({givenChecks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {receivedChecks.length === 0 ? (
                <Card className="card-premium text-center py-12">
                  <CardContent>
                    <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun chèque reçu</h3>
                    <p className="text-muted-foreground">
                      Les chèques reçus de vos clients apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {receivedChecks.map(renderCheckCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="given" className="space-y-4">
              {givenChecks.length === 0 ? (
                <Card className="card-premium text-center py-12">
                  <CardContent>
                    <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun chèque donné</h3>
                    <p className="text-muted-foreground">
                      Les chèques que vous avez donnés apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {givenChecks.map(renderCheckCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Checks;
