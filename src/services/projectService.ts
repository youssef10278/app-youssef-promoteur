import { supabase } from '@/integrations/supabase/client';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Filtrage par terme de recherche
      if (filters.searchTerm) {
        query = query.or(`nom.ilike.%${filters.searchTerm}%,localisation.ilike.%${filters.searchTerm}%,societe.ilike.%${filters.searchTerm}%`);
      }

      // Filtrage par surface
      if (filters.minSurface !== undefined && filters.minSurface > 0) {
        query = query.gte('surface_totale', filters.minSurface);
      }
      if (filters.maxSurface !== undefined && filters.maxSurface > 0) {
        query = query.lte('surface_totale', filters.maxSurface);
      }

      // Filtrage par nombre de lots
      if (filters.minLots !== undefined && filters.minLots > 0) {
        query = query.gte('nombre_lots', filters.minLots);
      }
      if (filters.maxLots !== undefined && filters.maxLots > 0) {
        query = query.lte('nombre_lots', filters.maxLots);
      }

      // Tri
      const sortColumn = this.getSortColumn(filters.sortBy);
      query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('projects')
        .select('surface_totale, nombre_lots')
        .eq('user_id', user.id);

      if (error) throw error;

      const projects = data || [];
      const totalProjects = projects.length;
      const totalSurface = projects.reduce((sum, p) => sum + (p.surface_totale || 0), 0);
      const totalLots = projects.reduce((sum, p) => sum + (p.nombre_lots || 0), 0);
      const averageSurface = totalProjects > 0 ? totalSurface / totalProjects : 0;

      return {
        totalProjects,
        totalSurface,
        totalLots,
        averageSurface
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
