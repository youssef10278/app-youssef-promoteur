import { apiClient } from '@/integrations/api/client';
import { 
  Sale, 
  SaleFormData, 
  PaymentPlan, 
  PaymentFormData,
  PaymentCheck,
  PaymentCheckFormData,
  SaleWithPayments,
  SalesFilters,
  SalesStats
} from '../types/sale-new';

export class SalesService {
  
  // ==================== VENTES ====================
  
  /**
   * Créer une nouvelle vente avec le premier paiement
   */
  static async createSale(saleData: SaleFormData): Promise<Sale> {
    try {
      // L'authentification est gérée par l'API backend

      // 1. Créer la vente
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          project_id: saleData.project_id,
          user_id: user.id,
          type_propriete: saleData.type_propriete,
          unite_numero: saleData.unite_numero,
          client_nom: saleData.client_nom,
          client_telephone: saleData.client_telephone,
          client_email: saleData.client_email,
          client_adresse: saleData.client_adresse,
          surface: saleData.surface,
          prix_total: saleData.prix_total,
          description: saleData.description,
          statut: 'en_cours',
          mode_paiement: saleData.premier_paiement.mode_paiement
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Créer le premier plan de paiement
      // Calculer les montants selon le mode de paiement
      let montant_espece = 0;
      let montant_cheque = 0;

      switch (saleData.premier_paiement.mode_paiement) {
        case 'espece':
          montant_espece = saleData.premier_paiement.montant;
          montant_cheque = 0;
          break;
        case 'cheque':
          montant_espece = 0;
          montant_cheque = saleData.premier_paiement.montant;
          break;
        case 'cheque_espece':
          montant_espece = saleData.premier_paiement.montant_espece || 0;
          montant_cheque = saleData.premier_paiement.montant_cheque || 0;
          break;
        case 'virement':
          montant_espece = 0;
          montant_cheque = 0;
          break;
      }

      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
          sale_id: sale.id,
          user_id: user.id,
          numero_echeance: 1,
          description: 'Premier paiement',
          montant_prevu: saleData.premier_paiement.montant,
          montant_paye: saleData.premier_paiement.montant,
          montant_declare: saleData.premier_paiement.montant_declare,
          montant_non_declare: saleData.premier_paiement.montant_non_declare,
          mode_paiement: saleData.premier_paiement.mode_paiement,
          montant_espece: montant_espece,
          montant_cheque: montant_cheque,
          date_prevue: saleData.premier_paiement.date_paiement,
          date_paiement: saleData.premier_paiement.date_paiement,
          statut: 'recu',
          notes: saleData.premier_paiement.notes
        })
        .select()
        .single();

      if (planError) throw planError;

      // 3. Créer les chèques si nécessaire
      if (saleData.premier_paiement.cheques && saleData.premier_paiement.cheques.length > 0) {
        const checksData = saleData.premier_paiement.cheques.map(cheque => ({
          payment_plan_id: paymentPlan.id,
          user_id: user.id,
          numero_cheque: cheque.numero,
          montant: cheque.montant,
          banque: cheque.banque,
          date_emission: cheque.date_echeance,
          statut: 'emis' as const,
          notes: cheque.notes
        }));

        const { error: checksError } = await supabase
          .from('payment_checks')
          .insert(checksData);

        if (checksError) throw checksError;
      }

      // 4. Créer un paiement reçu
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_plan_id: paymentPlan.id,
          user_id: user.id,
          montant: saleData.premier_paiement.montant,
          montant_declare: saleData.premier_paiement.montant_declare,
          montant_non_declare: saleData.premier_paiement.montant_non_declare,
          date_paiement: saleData.premier_paiement.date_paiement,
          mode_paiement: saleData.premier_paiement.mode_paiement,
          montant_espece: montant_espece,
          montant_cheque: montant_cheque,
          notes: saleData.premier_paiement.notes
        });

      if (paymentError) throw paymentError;

      return sale;
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les ventes d'un projet avec leurs paiements
   */
  static async getSalesWithPayments(projectId: string, filters?: SalesFilters): Promise<SaleWithPayments[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      let query = supabase
        .from('sales')
        .select(`
          *,
          payment_plans (
            *,
            payment_checks (*),
            payments (*)
          )
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      // Appliquer les filtres
      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      }
      if (filters?.client_nom) {
        query = query.ilike('client_nom', `%${filters.client_nom}%`);
      }
      if (filters?.unite_numero) {
        query = query.ilike('unite_numero', `%${filters.unite_numero}%`);
      }
      if (filters?.type_propriete) {
        query = query.eq('type_propriete', filters.type_propriete);
      }
      if (filters?.mode_paiement) {
        query = query.eq('mode_paiement', filters.mode_paiement);
      }
      if (filters?.date_debut) {
        query = query.gte('created_at', filters.date_debut);
      }
      if (filters?.date_fin) {
        query = query.lte('created_at', filters.date_fin);
      }
      if (filters?.montant_min) {
        query = query.gte('prix_total', filters.montant_min);
      }
      if (filters?.montant_max) {
        query = query.lte('prix_total', filters.montant_max);
      }

      // Recherche textuelle globale
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        // Pour la recherche textuelle, nous devrons filtrer côté client
        // car Supabase ne supporte pas la recherche dans les relations
      }

      // Tri
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';

      if (sortBy === 'progression') {
        // Pour le tri par progression, nous devrons trier côté client
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = data || [];

      // Filtrage côté client pour la recherche textuelle et le tri par progression
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        results = results.filter(sale => {
          return (
            sale.client_nom?.toLowerCase().includes(searchTerm) ||
            sale.unite_numero?.toLowerCase().includes(searchTerm) ||
            sale.client_email?.toLowerCase().includes(searchTerm) ||
            sale.client_telephone?.toLowerCase().includes(searchTerm) ||
            // Recherche dans les numéros de chèques
            sale.payment_plans?.some(plan =>
              plan.payment_checks?.some(check =>
                check.numero_cheque?.toLowerCase().includes(searchTerm)
              )
            )
          );
        });
      }

      // Tri par progression côté client
      if (sortBy === 'progression') {
        results = results.sort((a, b) => {
          const progressA = this.calculateSaleProgress(a).percentage;
          const progressB = this.calculateSaleProgress(b).percentage;
          return sortOrder === 'asc' ? progressA - progressB : progressB - progressA;
        });
      }

      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      throw error;
    }
  }

  /**
   * Récupérer une vente spécifique avec tous ses détails
   */
  static async getSaleById(saleId: string): Promise<SaleWithPayments | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          payment_plans (
            *,
            payment_checks (*),
            payments (*)
          )
        `)
        .eq('id', saleId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la vente:', error);
      throw error;
    }
  }

  // ==================== PAIEMENTS ====================

  /**
   * Ajouter un nouveau paiement à une vente existante
   */
  static async addPayment(saleId: string, paymentData: PaymentFormData): Promise<PaymentPlan> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // 1. Récupérer le nombre d'échéances existantes
      const { data: existingPlans, error: countError } = await supabase
        .from('payment_plans')
        .select('numero_echeance')
        .eq('sale_id', saleId)
        .order('numero_echeance', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextEcheanceNumber = existingPlans && existingPlans.length > 0 
        ? existingPlans[0].numero_echeance + 1 
        : 1;

      // 2. Créer le nouveau plan de paiement
      // Calculer les montants selon le mode de paiement
      let montant_espece = 0;
      let montant_cheque = 0;

      switch (paymentData.mode_paiement) {
        case 'espece':
          montant_espece = paymentData.montant_paye;
          montant_cheque = 0;
          break;
        case 'cheque':
          montant_espece = 0;
          montant_cheque = paymentData.montant_paye;
          break;
        case 'cheque_espece':
          montant_espece = paymentData.montant_espece || 0;
          montant_cheque = paymentData.montant_cheque || 0;
          break;
        case 'virement':
          montant_espece = 0;
          montant_cheque = 0;
          break;
      }

      const { data: paymentPlan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
          sale_id: saleId,
          user_id: user.id,
          numero_echeance: nextEcheanceNumber,
          description: `Paiement #${nextEcheanceNumber}`,
          montant_prevu: paymentData.montant_paye,
          montant_paye: paymentData.montant_paye,
          montant_declare: paymentData.montant_declare,
          montant_non_declare: paymentData.montant_non_declare,
          mode_paiement: paymentData.mode_paiement,
          montant_espece: montant_espece,
          montant_cheque: montant_cheque,
          date_prevue: paymentData.date_paiement,
          date_paiement: paymentData.date_paiement,
          statut: 'recu',
          notes: paymentData.notes
        })
        .select()
        .single();

      if (planError) throw planError;

      // 3. Créer les chèques si nécessaire
      if (paymentData.cheques && paymentData.cheques.length > 0) {
        const checksData = paymentData.cheques.map(cheque => ({
          payment_plan_id: paymentPlan.id,
          user_id: user.id,
          numero_cheque: cheque.numero, // Utiliser 'numero' au lieu de 'numero_cheque'
          montant: cheque.montant,
          banque: cheque.banque,
          date_emission: cheque.date_emission || paymentData.date_paiement,
          date_encaissement: cheque.date_encaissement,
          statut: 'emis' as const,
          notes: cheque.notes
        }));

        const { error: checksError } = await supabase
          .from('payment_checks')
          .insert(checksData);

        if (checksError) throw checksError;
      }

      // 4. Créer un paiement reçu
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          payment_plan_id: paymentPlan.id,
          user_id: user.id,
          montant: paymentData.montant_paye,
          montant_declare: paymentData.montant_declare,
          montant_non_declare: paymentData.montant_non_declare,
          date_paiement: paymentData.date_paiement,
          mode_paiement: paymentData.mode_paiement,
          montant_espece: montant_espece,
          montant_cheque: montant_cheque,
          notes: paymentData.notes
        });

      if (paymentError) throw paymentError;

      return paymentPlan;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      throw error;
    }
  }

  // ==================== INVENTAIRE ====================

  /**
   * Récupérer les unités vendues d'un projet
   */
  static async getSoldUnits(projectId: string): Promise<Sale[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('sales')
        .select('unite_numero, type_propriete, statut')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .neq('statut', 'annule'); // Exclure les ventes annulées

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des unités vendues:', error);
      throw new Error('Impossible de récupérer les unités vendues');
    }
  }

  /**
   * Vérifier si une unité est disponible pour la vente
   */
  static async isUnitAvailable(projectId: string, unitNumber: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('sales')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('unite_numero', unitNumber)
        .neq('statut', 'annule') // Exclure les ventes annulées
        .limit(1);

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error: any) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      return false; // En cas d'erreur, considérer comme non disponible par sécurité
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Calculer la progression d'une vente
   */
  static calculateSaleProgress(sale: SaleWithPayments) {
    if (!sale.payment_plans || sale.payment_plans.length === 0) {
      return {
        totalPaid: 0,
        totalDue: sale.prix_total,
        percentage: 0,
        nextPaymentDate: null,
        overduePayments: 0
      };
    }

    const totalPaid = sale.payment_plans.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0);
    const totalDue = sale.prix_total;
    const percentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    // Trouver le prochain paiement
    const today = new Date();
    const unpaidPlans = sale.payment_plans.filter(plan =>
      plan.statut === 'planifie' || plan.statut === 'en_retard'
    );

    const nextPayment = unpaidPlans
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())[0];

    const overduePayments = sale.payment_plans.filter(plan =>
      plan.statut === 'en_retard' ||
      (plan.statut === 'planifie' && new Date(plan.date_prevue) < today)
    ).length;

    return {
      totalPaid,
      totalDue,
      percentage,
      nextPaymentDate: nextPayment?.date_prevue || null,
      overduePayments
    };
  }

  // ==================== STATISTIQUES ====================

  /**
   * Récupérer les statistiques des ventes d'un projet
   */
  static async getSalesStats(projectId: string): Promise<SalesStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('sale_payment_summary')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Calculer les statistiques
      const stats = data?.reduce((acc, sale) => {
        acc.total_ventes += 1;
        acc.total_ca += sale.prix_total || 0;
        acc.total_encaisse += sale.montant_total_recu || 0;
        acc.total_en_attente += sale.montant_restant || 0;
        
        if (sale.echeances_en_retard > 0) {
          acc.echeances_en_retard += sale.echeances_en_retard;
        }

        return acc;
      }, {
        total_ventes: 0,
        total_ca: 0,
        total_encaisse: 0,
        total_en_attente: 0,
        echeances_en_retard: 0,
        echeances_cette_semaine: 0,
        progression_paiements: 0
      });

      if (stats && stats.total_ca > 0) {
        stats.progression_paiements = (stats.total_encaisse / stats.total_ca) * 100;
      }

      return stats || {
        total_ventes: 0,
        total_ca: 0,
        total_encaisse: 0,
        total_en_attente: 0,
        echeances_en_retard: 0,
        echeances_cette_semaine: 0,
        progression_paiements: 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
