import { apiClient } from '@/integrations/api/client';

export interface ProjectFilters {
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minSurface?: number;
  maxSurface?: number;
  minLots?: number;
  maxLots?: number;
}

export interface Project {
  id: string;
  nom: string;
  localisation: string;
  societe: string;
  surface_totale: number;
  nombre_lots: number;
  nombre_appartements: number;
  nombre_garages: number;
  created_at: string;
  user_id: string;
}

export class ProjectService {
  /**
   * Récupérer tous les projets avec filtres
   */
  static async getFilteredProjects(filters: ProjectFilters): Promise<Project[]> {
    try {
      // Utilisation de la nouvelle API
      const response = await apiClient.get('/projects', {
        search: filters.searchTerm,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minSurface: filters.minSurface,
        maxSurface: filters.maxSurface,
        minLots: filters.minLots,
        maxLots: filters.maxLots
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des projets filtrés:', error);
      throw error;
    }
  }

  /**
   * Convertir le nom de tri en colonne de base de données
   */
  private static getSortColumn(sortBy: string): string {
    switch (sortBy) {
      case 'nom':
        return 'nom';
      case 'localisation':
        return 'localisation';
      case 'societe':
        return 'societe';
      case 'surface':
        return 'surface_totale';
      case 'lots':
        return 'nombre_lots';
      case 'date':
      default:
        return 'created_at';
    }
  }

  /**
   * Supprimer un projet
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des projets
   */
  static async getProjectStats(): Promise<{
    totalProjects: number;
    totalSurface: number;
    totalLots: number;
    averageSurface: number;
  }> {
    try {
      // Utilisation de la nouvelle API
      const response = await apiClient.get('/projects/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
