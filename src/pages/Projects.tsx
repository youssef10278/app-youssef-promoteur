import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectService, Project, ProjectFilters } from '@/services/projectService';
import { ProjectFiltersComponent, ProjectFiltersState } from '@/components/projects/ProjectFilters';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectStats } from '@/components/projects/ProjectStats';

const Projects = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState<ProjectFiltersState>({
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    minSurface: undefined,
    maxSurface: undefined,
    minLots: undefined,
    maxLots: undefined,
  });
  const { toast } = useToast();

  // Charger les projets avec filtres
  const loadProjects = useCallback(async (currentFilters: ProjectFilters) => {
    try {
      setIsLoading(true);
      const data = await ProjectService.getFilteredProjects(currentFilters);
      setFilteredProjects(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des projets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Charger les projets au montage et quand les filtres changent
  useEffect(() => {
    if (user) {
      loadProjects(filters);
    }
  }, [user, filters, loadProjects]);

  // Gestionnaire de changement de filtres
  const handleFiltersChange = useCallback((newFilters: ProjectFiltersState) => {
    setFilters(newFilters);
  }, []);

  // Supprimer un projet
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    try {
      await ProjectService.deleteProject(projectId);

      // Recharger les projets et les stats
      loadProjects(filters);
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: "Succès",
        description: "Projet supprimé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
    }
  };

  // Éditer un projet (placeholder pour future fonctionnalité)
  const handleEditProject = (project: Project) => {
    // TODO: Implémenter la modal d'édition
    console.log('Éditer le projet:', project);
    toast({
      title: "Fonctionnalité à venir",
      description: "L'édition des projets sera bientôt disponible",
    });
  };

  if (loading || isLoading) {
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
                <h1 className="text-2xl font-bold">Gestion des Projets</h1>
                <p className="text-primary-foreground/80">
                  Gérez vos projets immobiliers
                </p>
              </div>
            </div>
            <Link to="/create-project">
              <Button className="btn-secondary-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Section Statistiques */}
          <ProjectStats refreshTrigger={refreshTrigger} />

          {/* Section Filtres */}
          <ProjectFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            totalResults={filteredProjects.length}
            isLoading={isLoading}
          />

          {/* Section Liste des Projets */}
          <ProjectList
            projects={filteredProjects}
            isLoading={isLoading}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />

          {/* Message si aucun projet */}
          {!isLoading && filteredProjects.length === 0 && filters.searchTerm === '' && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par créer votre premier projet immobilier
              </p>
              <Link to="/create-project">
                <Button className="btn-hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Projet
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;