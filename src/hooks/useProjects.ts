import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Project, CreateProjectData, ProjectStats } from '@/integrations/api/types';
import { useToast } from '@/hooks/use-toast';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (projectData: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, projectData: Partial<CreateProjectData>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProjectStats: (id: string) => Promise<ProjectStats>;
  refreshProjects: () => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = () => setError(null);

  // Charger tous les projets
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      const response = await apiClient.getProjects();
      
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des projets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des projets';
      setError(errorMessage);
      console.error('Erreur lors du chargement des projets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Créer un nouveau projet
  const createProject = useCallback(async (projectData: CreateProjectData): Promise<Project> => {
    try {
      clearError();

      const response = await apiClient.createProject(projectData);
      
      if (response.success && response.data) {
        const newProject = response.data;
        setProjects(prev => [...prev, newProject]);
        
        toast({
          title: "Projet créé",
          description: `Le projet "${newProject.nom}" a été créé avec succès.`,
          variant: "default",
        });

        return newProject;
      } else {
        throw new Error(response.error || 'Erreur lors de la création du projet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du projet';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Mettre à jour un projet
  const updateProject = useCallback(async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
    try {
      clearError();

      const response = await apiClient.updateProject(id, projectData);
      
      if (response.success && response.data) {
        const updatedProject = response.data;
        setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        
        toast({
          title: "Projet modifié",
          description: `Le projet "${updatedProject.nom}" a été modifié avec succès.`,
          variant: "default",
        });

        return updatedProject;
      } else {
        throw new Error(response.error || 'Erreur lors de la modification du projet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du projet';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Supprimer un projet
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      clearError();

      const projectToDelete = projects.find(p => p.id === id);
      
      const response = await apiClient.deleteProject(id);
      
      if (response.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Projet supprimé",
          description: `Le projet "${projectToDelete?.nom || 'inconnu'}" a été supprimé avec succès.`,
          variant: "default",
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la suppression du projet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du projet';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [projects, toast]);

  // Obtenir les statistiques d'un projet
  const getProjectStats = useCallback(async (id: string): Promise<ProjectStats> => {
    try {
      clearError();

      const response = await apiClient.getProjectStats(id);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    }
  }, [toast]);

  // Rafraîchir la liste des projets
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  // Charger les projets au montage du composant
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
    refreshProjects,
  };
};

// Hook pour un projet spécifique
export const useProject = (id: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getProject(id);
      
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        throw new Error(response.error || 'Erreur lors du chargement du projet');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du projet';
      setError(errorMessage);
      console.error('Erreur lors du chargement du projet:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return {
    project,
    isLoading,
    error,
    refreshProject: loadProject,
  };
};
