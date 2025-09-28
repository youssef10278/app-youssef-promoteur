import { supabase } from '@/integrations/supabase/client';

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

export class AnalyticsService {
  /**
   * Récupérer les analytics complètes d'un projet
   */
  static async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer toutes les ventes avec leurs plans de paiement et paiements
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          payment_plans (
            *,
            payments (*)
          )
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .neq('statut', 'annule');

      if (salesError) throw salesError;

      // Récupérer les unités du projet pour calculer le total
      const { data: projectUnits, error: unitsError } = await supabase
        .from('project_units')
        .select('type_propriete')
        .eq('project_id', projectId);

      if (unitsError) {
        console.warn('Impossible de récupérer les unités du projet:', unitsError);
      }

      return this.calculateAnalytics(sales || [], projectUnits || []);
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

    // Analyser les ventes
    sales.forEach(sale => {
      chiffre_affaires_total += sale.prix_total || 0;

      // Compter les propriétés vendues par type
      if (sale.type_propriete === 'appartement') {
        appartements.vendus++;
        appartements.ca_total += sale.prix_total || 0;
      } else if (sale.type_propriete === 'garage') {
        garages.vendus++;
        garages.ca_total += sale.prix_total || 0;
      }

      // Analyser les plans de paiement
      if (sale.payment_plans) {
        sale.payment_plans.forEach((plan: any) => {
          // Analyser les paiements reçus
          if (plan.payments) {
            plan.payments.forEach((payment: any) => {
              montant_encaisse_total += payment.montant || 0;
              montant_declare_total += payment.montant_declare || 0;
              montant_non_declare_total += payment.montant_non_declare || 0;

              // Ajouter aux CA encaissés par type
              if (sale.type_propriete === 'appartement') {
                appartements.ca_encaisse += payment.montant || 0;
              } else if (sale.type_propriete === 'garage') {
                garages.ca_encaisse += payment.montant || 0;
              }
            });
          }

          // Vérifier les échéances en retard
          const datePrevue = new Date(plan.date_prevue);
          const montantPaye = plan.payments?.reduce((sum: number, p: any) => sum + (p.montant || 0), 0) || 0;
          const montantRestant = (plan.montant_prevu || 0) - montantPaye;

          if (montantRestant > 0) {
            if (datePrevue < currentDate && plan.statut !== 'annule') {
              echeances_en_retard++;
            } else if (datePrevue >= currentDate && datePrevue <= weekFromNow && plan.statut !== 'annule') {
              echeances_cette_semaine++;
            }

            // Trouver la prochaine échéance
            if (datePrevue >= currentDate && plan.statut !== 'annule') {
              if (!prochaine_echeance_date || datePrevue < new Date(prochaine_echeance_date)) {
                prochaine_echeance_date = plan.date_prevue;
                prochaine_echeance_montant = montantRestant;
              }
            }
          }
        });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer toutes les ventes de l'utilisateur
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          payment_plans (
            *,
            payments (*)
          )
        `)
        .eq('user_id', user.id)
        .neq('statut', 'annule');

      if (salesError) throw salesError;

      // Récupérer toutes les unités des projets de l'utilisateur
      const { data: projectUnits, error: unitsError } = await supabase
        .from('project_units')
        .select('type_propriete, project_id')
        .in('project_id', [...new Set(sales?.map(s => s.project_id) || [])]);

      if (unitsError) {
        console.warn('Impossible de récupérer les unités des projets:', unitsError);
      }

      return this.calculateAnalytics(sales || [], projectUnits || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics globales:', error);
      throw error;
    }
  }
}
