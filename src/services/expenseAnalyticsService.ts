import { supabase } from '@/integrations/supabase/client';

export interface ExpenseAnalytics {
  // Totaux généraux
  total_depenses: number;
  montant_total_depenses: number;
  
  // Montants principal vs autre montant
  montant_declare_total: number;
  montant_non_declare_total: number;
  pourcentage_declare: number;
  pourcentage_non_declare: number;

  // Répartition par mode de paiement
  modes_paiement: {
    espece: {
      nombre: number;
      montant: number;
      pourcentage: number;
    };
    cheque: {
      nombre: number;
      montant: number;
      pourcentage: number;
    };
    cheque_espece: {
      nombre: number;
      montant: number;
      pourcentage: number;
    };
    virement: {
      nombre: number;
      montant: number;
      pourcentage: number;
    };
  };

  // Répartition par projet
  par_projet: Array<{
    project_id: string;
    project_nom: string;
    nombre_depenses: number;
    montant_total: number;
    montant_declare: number;
    montant_non_declare: number;
    pourcentage_du_total: number;
  }>;

  // Statistiques temporelles
  depenses_ce_mois: number;
  montant_ce_mois: number;
  depenses_cette_annee: number;
  montant_cette_annee: number;

  // Moyennes
  montant_moyen_par_depense: number;
  montant_moyen_par_projet: number;
}

export class ExpenseAnalyticsService {
  /**
   * Récupérer les analytics des dépenses pour un projet spécifique
   */
  static async getProjectExpenseAnalytics(projectId: string): Promise<ExpenseAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer toutes les dépenses du projet
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Récupérer les informations du projet
      let projectInfo = null;
      if (expenses && expenses.length > 0) {
        const { data: project } = await supabase
          .from('projects')
          .select('nom')
          .eq('id', projectId)
          .single();
        projectInfo = project;
      }

      return this.calculateAnalytics(expenses || [], projectInfo);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics de dépenses:', error);
      throw error;
    }
  }

  /**
   * Récupérer les analytics des dépenses pour tous les projets
   */
  static async getAllExpenseAnalytics(): Promise<ExpenseAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer toutes les dépenses de l'utilisateur
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Récupérer les informations des projets
      const projectIds = [...new Set(expenses?.map(e => e.project_id) || [])];
      const projectsMap = new Map();

      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, nom')
          .in('id', projectIds);

        if (projects) {
          projects.forEach(project => {
            projectsMap.set(project.id, project);
          });
        }
      }

      return this.calculateAnalytics(expenses || [], null, projectsMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics globales de dépenses:', error);
      throw error;
    }
  }

  /**
   * Calculer les analytics à partir des données de dépenses
   */
  private static calculateAnalytics(expenses: any[], projectInfo?: any, projectsMap?: Map<string, any>): ExpenseAnalytics {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Initialiser les compteurs
    let montant_total_depenses = 0;
    let montant_declare_total = 0;
    let montant_non_declare_total = 0;
    let depenses_ce_mois = 0;
    let montant_ce_mois = 0;
    let depenses_cette_annee = 0;
    let montant_cette_annee = 0;

    // Compteurs par mode de paiement
    const modes_paiement = {
      espece: { nombre: 0, montant: 0, pourcentage: 0 },
      cheque: { nombre: 0, montant: 0, pourcentage: 0 },
      cheque_espece: { nombre: 0, montant: 0, pourcentage: 0 },
      virement: { nombre: 0, montant: 0, pourcentage: 0 }
    };

    // Compteurs par projet
    const projetsMap = new Map();

    // Analyser chaque dépense
    expenses.forEach(expense => {
      const montantTotal = expense.montant_total || 0;
      const montantDeclare = expense.montant_declare || 0;
      const montantNonDeclare = expense.montant_non_declare || 0;
      const dateCreation = new Date(expense.created_at);

      // Totaux généraux
      montant_total_depenses += montantTotal;
      montant_declare_total += montantDeclare;
      montant_non_declare_total += montantNonDeclare;

      // Statistiques temporelles
      if (dateCreation.getMonth() === currentMonth && dateCreation.getFullYear() === currentYear) {
        depenses_ce_mois++;
        montant_ce_mois += montantTotal;
      }

      if (dateCreation.getFullYear() === currentYear) {
        depenses_cette_annee++;
        montant_cette_annee += montantTotal;
      }

      // Modes de paiement
      const mode = expense.mode_paiement;
      if (modes_paiement[mode]) {
        modes_paiement[mode].nombre++;
        modes_paiement[mode].montant += montantTotal;
      }

      // Par projet
      const projectId = expense.project_id;
      const projectNom = projectInfo?.nom || projectsMap?.get(projectId)?.nom || 'Projet inconnu';
      
      if (!projetsMap.has(projectId)) {
        projetsMap.set(projectId, {
          project_id: projectId,
          project_nom: projectNom,
          nombre_depenses: 0,
          montant_total: 0,
          montant_declare: 0,
          montant_non_declare: 0,
          pourcentage_du_total: 0
        });
      }

      const projet = projetsMap.get(projectId);
      projet.nombre_depenses++;
      projet.montant_total += montantTotal;
      projet.montant_declare += montantDeclare;
      projet.montant_non_declare += montantNonDeclare;
    });

    // Calculer les pourcentages pour les modes de paiement
    Object.keys(modes_paiement).forEach(mode => {
      if (montant_total_depenses > 0) {
        modes_paiement[mode].pourcentage = Math.round(
          (modes_paiement[mode].montant / montant_total_depenses) * 100 * 100
        ) / 100;
      }
    });

    // Calculer les pourcentages pour les projets
    const par_projet = Array.from(projetsMap.values()).map(projet => ({
      ...projet,
      pourcentage_du_total: montant_total_depenses > 0 
        ? Math.round((projet.montant_total / montant_total_depenses) * 100 * 100) / 100
        : 0
    })).sort((a, b) => b.montant_total - a.montant_total);

    // Calculer les pourcentages principal/autre montant
    const total_montant = montant_declare_total + montant_non_declare_total;
    const pourcentage_declare = total_montant > 0 
      ? Math.round((montant_declare_total / total_montant) * 100 * 100) / 100 
      : 0;
    const pourcentage_non_declare = total_montant > 0 
      ? Math.round((montant_non_declare_total / total_montant) * 100 * 100) / 100 
      : 0;

    // Calculer les moyennes
    const montant_moyen_par_depense = expenses.length > 0 
      ? Math.round((montant_total_depenses / expenses.length) * 100) / 100 
      : 0;
    const montant_moyen_par_projet = par_projet.length > 0 
      ? Math.round((montant_total_depenses / par_projet.length) * 100) / 100 
      : 0;

    return {
      total_depenses: expenses.length,
      montant_total_depenses,
      
      montant_declare_total,
      montant_non_declare_total,
      pourcentage_declare,
      pourcentage_non_declare,

      modes_paiement,
      par_projet,

      depenses_ce_mois,
      montant_ce_mois,
      depenses_cette_annee,
      montant_cette_annee,

      montant_moyen_par_depense,
      montant_moyen_par_projet
    };
  }

  /**
   * Récupérer les analytics des dépenses par période
   */
  static async getExpenseAnalyticsByPeriod(
    projectId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExpenseAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: expenses, error } = await query;

      if (error) throw error;

      // Récupérer les informations des projets
      const projectIds = [...new Set(expenses?.map(e => e.project_id) || [])];
      const projectsMap = new Map();

      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, nom')
          .in('id', projectIds);

        if (projects) {
          projects.forEach(project => {
            projectsMap.set(project.id, project);
          });
        }
      }

      return this.calculateAnalytics(expenses || [], null, projectsMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics par période:', error);
      throw error;
    }
  }
}
