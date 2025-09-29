import { apiClient } from '@/integrations/api/client';

export interface ProjectAnalytics {
  // Propriétés
  total_proprietes: number;
  proprietes_vendues: number;
  proprietes_restantes: number;
  taux_vente: number; // Pourcentage

  // Finances globales
  chiffre_affaires_total: number;
  montant_encaisse_total: number;
  montant_restant_total: number;
  progression_encaissement: number; // Pourcentage

  // Montants principal vs autre montant
  montant_declare_total: number;
  montant_non_declare_total: number;
  pourcentage_declare: number;
  pourcentage_non_declare: number;

  // Détails par type de propriété
  appartements: {
    total: number;
    vendus: number;
    restants: number;
    ca_total: number;
    ca_encaisse: number;
  };
  garages: {
    total: number;
    vendus: number;
    restants: number;
    ca_total: number;
    ca_encaisse: number;
  };

  // Échéances
  echeances_en_retard: number;
  echeances_cette_semaine: number;
  prochaine_echeance_date: string | null;
  prochaine_echeance_montant: number;
}

export class AnalyticsServiceNew {
  /**
   * Récupérer les analytics complètes d'un projet
   */
  static async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      // Récupérer les ventes du projet
      const salesResponse = await apiClient.get(`/sales/project/${projectId}`);
      const sales = salesResponse.data || [];

      // Récupérer les détails du projet pour obtenir les unités
      const projectResponse = await apiClient.get(`/projects/${projectId}`);
      const project = projectResponse.data;

      // Calculer les unités totales basées sur les données du projet avec conversion des types
      const projectUnits = [];
      if (project) {
        const nombreAppartements = parseInt(project.nombre_appartements?.toString() || '0');
        const nombreGarages = parseInt(project.nombre_garages?.toString() || '0');

        // Ajouter les appartements
        for (let i = 0; i < nombreAppartements; i++) {
          projectUnits.push({ type_propriete: 'appartement' });
        }
        // Ajouter les garages
        for (let i = 0; i < nombreGarages; i++) {
          projectUnits.push({ type_propriete: 'garage' });
        }
      }

      return this.calculateAnalytics(sales, projectUnits);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics:', error);
      throw error;
    }
  }

  /**
   * Calculer les analytics à partir des données
   */
  private static calculateAnalytics(
    sales: any[], 
    projectUnits: any[]
  ): ProjectAnalytics {
    const currentDate = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(currentDate.getDate() + 7);

    // Initialiser les compteurs
    let chiffre_affaires_total = 0;
    let montant_encaisse_total = 0;
    let montant_declare_total = 0;
    let montant_non_declare_total = 0;
    let echeances_en_retard = 0;
    let echeances_cette_semaine = 0;
    let prochaine_echeance_date: string | null = null;
    let prochaine_echeance_montant = 0;

    const appartements = { total: 0, vendus: 0, restants: 0, ca_total: 0, ca_encaisse: 0 };
    const garages = { total: 0, vendus: 0, restants: 0, ca_total: 0, ca_encaisse: 0 };

    // Compter les unités totales par type
    projectUnits.forEach(unit => {
      if (unit.type_propriete === 'appartement') {
        appartements.total++;
      } else if (unit.type_propriete === 'garage') {
        garages.total++;
      }
    });

    // Analyser les ventes avec conversion explicite des types
    sales.forEach(sale => {
      // CORRECTION: Convertir explicitement les valeurs string en number
      const prixTotal = parseFloat(sale.prix_total?.toString() || '0');
      const avanceDeclare = parseFloat(sale.avance_declare?.toString() || '0');
      const avanceNonDeclare = parseFloat(sale.avance_non_declare?.toString() || '0');

      chiffre_affaires_total += prixTotal;

      // Compter les propriétés vendues par type
      if (sale.type_propriete === 'appartement') {
        appartements.vendus++;
        appartements.ca_total += prixTotal;
      } else if (sale.type_propriete === 'garage') {
        garages.vendus++;
        garages.ca_total += prixTotal;
      }

      // Calculer les montants encaissés basés sur les avances réelles
      const montantEncaisseReel = avanceDeclare + avanceNonDeclare;
      montant_encaisse_total += montantEncaisseReel;
      montant_declare_total += avanceDeclare;
      montant_non_declare_total += avanceNonDeclare;

      // Ajouter aux CA encaissés par type
      if (sale.type_propriete === 'appartement') {
        appartements.ca_encaisse += montantEncaisseReel;
      } else if (sale.type_propriete === 'garage') {
        garages.ca_encaisse += montantEncaisseReel;
      }
    });

    // Calculer les propriétés restantes
    appartements.restants = appartements.total - appartements.vendus;
    garages.restants = garages.total - garages.vendus;

    const total_proprietes = appartements.total + garages.total;
    const proprietes_vendues = appartements.vendus + garages.vendus;
    const proprietes_restantes = total_proprietes - proprietes_vendues;

    // Calculer les pourcentages
    const taux_vente = total_proprietes > 0 ? (proprietes_vendues / total_proprietes) * 100 : 0;
    const progression_encaissement = chiffre_affaires_total > 0 ? (montant_encaisse_total / chiffre_affaires_total) * 100 : 0;
    const montant_restant_total = chiffre_affaires_total - montant_encaisse_total;

    const total_montant_encaisse = montant_declare_total + montant_non_declare_total;
    const pourcentage_declare = total_montant_encaisse > 0 ? (montant_declare_total / total_montant_encaisse) * 100 : 0;
    const pourcentage_non_declare = total_montant_encaisse > 0 ? (montant_non_declare_total / total_montant_encaisse) * 100 : 0;

    return {
      total_proprietes,
      proprietes_vendues,
      proprietes_restantes,
      taux_vente: Math.round(taux_vente * 100) / 100,

      chiffre_affaires_total,
      montant_encaisse_total,
      montant_restant_total,
      progression_encaissement: Math.round(progression_encaissement * 100) / 100,

      montant_declare_total,
      montant_non_declare_total,
      pourcentage_declare: Math.round(pourcentage_declare * 100) / 100,
      pourcentage_non_declare: Math.round(pourcentage_non_declare * 100) / 100,

      appartements,
      garages,

      echeances_en_retard,
      echeances_cette_semaine,
      prochaine_echeance_date,
      prochaine_echeance_montant
    };
  }

  /**
   * Récupérer les analytics pour tous les projets d'un utilisateur
   */
  static async getAllProjectsAnalytics(): Promise<ProjectAnalytics> {
    try {
      // Récupérer tous les projets de l'utilisateur
      const projectsResponse = await apiClient.get('/projects');
      const projects = projectsResponse.data || [];

      // Récupérer toutes les ventes
      const salesResponse = await apiClient.get('/sales');
      const sales = salesResponse.data || [];

      // Calculer les unités totales pour tous les projets avec conversion des types
      const projectUnits = [];
      projects.forEach((project: any) => {
        const nombreAppartements = parseInt(project.nombre_appartements?.toString() || '0');
        const nombreGarages = parseInt(project.nombre_garages?.toString() || '0');

        // Ajouter les appartements
        for (let i = 0; i < nombreAppartements; i++) {
          projectUnits.push({ type_propriete: 'appartement' });
        }
        // Ajouter les garages
        for (let i = 0; i < nombreGarages; i++) {
          projectUnits.push({ type_propriete: 'garage' });
        }
      });

      return this.calculateAnalytics(sales, projectUnits);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics globales:', error);
      throw error;
    }
  }
}
