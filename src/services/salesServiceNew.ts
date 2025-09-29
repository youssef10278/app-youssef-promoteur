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

export class SalesServiceNew {
  
  // ==================== VENTES ====================
  
  /**
   * Récupérer toutes les ventes d'un projet avec leurs paiements
   */
  static async getSalesWithPayments(projectId: string, filters?: SalesFilters): Promise<SaleWithPayments[]> {
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      
      if (filters?.searchTerm) params.append('search', filters.searchTerm);
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.type_propriete) params.append('type_propriete', filters.type_propriete);
      if (filters?.mode_paiement) params.append('mode_paiement', filters.mode_paiement);
      if (filters?.date_debut) params.append('date_debut', filters.date_debut);
      if (filters?.date_fin) params.append('date_fin', filters.date_fin);
      if (filters?.montant_min) params.append('montant_min', filters.montant_min.toString());
      if (filters?.montant_max) params.append('montant_max', filters.montant_max.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      // Récupérer les ventes du projet
      const response = await apiClient.get(`/sales/project/${projectId}?${params.toString()}`);
      const sales = response.data || [];

      // Pour chaque vente, récupérer les plans de paiement et les paiements
      const salesWithPayments: SaleWithPayments[] = [];
      
      for (const sale of sales) {
        try {
          // Récupérer les plans de paiement pour cette vente
          const paymentPlansResponse = await apiClient.get(`/payments/plans/sale/${sale.id}`);
          const paymentPlans = paymentPlansResponse.data || [];

          // Pour chaque plan de paiement, récupérer les chèques et paiements
          const enrichedPaymentPlans = [];
          for (const plan of paymentPlans) {
            try {
              // Récupérer les chèques pour ce plan
              const checksResponse = await apiClient.get(`/checks?payment_plan_id=${plan.id}`);
              const checks = checksResponse.data || [];

              // Récupérer les paiements pour ce plan
              const paymentsResponse = await apiClient.get(`/payments/history/sale/${sale.id}`);
              const payments = paymentsResponse.data || [];

              enrichedPaymentPlans.push({
                ...plan,
                payment_checks: checks,
                payments: payments
              });
            } catch (error) {
              console.warn(`Erreur lors de la récupération des détails pour le plan ${plan.id}:`, error);
              enrichedPaymentPlans.push(plan);
            }
          }

          salesWithPayments.push({
            ...sale,
            payment_plans: enrichedPaymentPlans
          });
        } catch (error) {
          console.warn(`Erreur lors de la récupération des détails pour la vente ${sale.id}:`, error);
          salesWithPayments.push({
            ...sale,
            payment_plans: []
          });
        }
      }

      return salesWithPayments;
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
      const response = await apiClient.get(`/sales/${saleId}`);
      const sale = response.data;

      if (!sale) return null;

      // Récupérer les plans de paiement
      const paymentPlansResponse = await apiClient.get(`/payments/plans/sale/${saleId}`);
      const paymentPlans = paymentPlansResponse.data || [];

      // Enrichir chaque plan avec les chèques et paiements
      const enrichedPaymentPlans = [];
      for (const plan of paymentPlans) {
        try {
          const checksResponse = await apiClient.get(`/checks?payment_plan_id=${plan.id}`);
          const paymentsResponse = await apiClient.get(`/payments/history/sale/${saleId}`);
          
          enrichedPaymentPlans.push({
            ...plan,
            payment_checks: checksResponse.data || [],
            payments: paymentsResponse.data || []
          });
        } catch (error) {
          console.warn(`Erreur lors de la récupération des détails pour le plan ${plan.id}:`, error);
          enrichedPaymentPlans.push(plan);
        }
      }

      return {
        ...sale,
        payment_plans: enrichedPaymentPlans
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la vente:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle vente
   */
  static async createSale(saleData: SaleFormData): Promise<Sale> {
    try {
      // Transformer les données du frontend vers le format attendu par l'API backend
      const apiData = {
        project_id: saleData.project_id,
        type_propriete: saleData.type_propriete,
        unite_numero: saleData.unite_numero,
        client_nom: saleData.client_nom,
        client_telephone: saleData.client_telephone || '',
        client_email: saleData.client_email || '',
        client_adresse: saleData.client_adresse || '',
        surface: saleData.surface,
        prix_total: saleData.prix_total,
        description: saleData.description,
        mode_paiement: saleData.premier_paiement.mode_paiement,
        avance_declare: saleData.premier_paiement.montant_declare || 0,
        avance_non_declare: saleData.premier_paiement.montant_non_declare || 0,
        avance_cheque: saleData.premier_paiement.montant_cheque || 0,
        avance_espece: saleData.premier_paiement.montant_espece || 0,
        // CORRECTION: Inclure les données des chèques
        cheques: saleData.premier_paiement.cheques || []
      };

      console.log('Sending to API:', apiData);

      const response = await apiClient.post('/sales', apiData);
      const sale = response.data;

      // CORRECTION: Les chèques sont maintenant créés automatiquement par le backend
      // Plus besoin de les créer séparément ici car le backend utilise les données des chèques
      // transmises dans apiData.cheques

      return sale;
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une vente
   */
  static async updateSale(saleId: string, updateData: Partial<SaleFormData>): Promise<Sale> {
    try {
      const response = await apiClient.put(`/sales/${saleId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la vente:', error);
      throw error;
    }
  }

  /**
   * Supprimer une vente
   */
  static async deleteSale(saleId: string): Promise<void> {
    try {
      await apiClient.delete(`/sales/${saleId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la vente:', error);
      throw error;
    }
  }

  // ==================== PAIEMENTS ====================

  /**
   * Ajouter un nouveau paiement à une vente existante (OPTIMISÉ)
   */
  static async addPayment(saleId: string, paymentData: PaymentFormData): Promise<PaymentPlan> {
    try {
      // NOUVELLE APPROCHE: Utiliser l'endpoint optimisé qui fait tout en une requête
      const requestData = {
        saleId,
        paymentData: {
          date_paiement: paymentData.date_paiement,
          montant_paye: paymentData.montant_paye,
          mode_paiement: paymentData.mode_paiement,
          montant_espece: paymentData.montant_espece || 0,
          montant_cheque: paymentData.montant_cheque || 0,
          notes: paymentData.notes,
          nom_beneficiaire: paymentData.nom_beneficiaire,
          nom_emetteur: paymentData.nom_emetteur
        },
        cheques: paymentData.cheques || []
      };

      console.log('📤 Envoi du paiement optimisé:', requestData);

      const response = await apiClient.post('/payments/complete-payment', requestData);
      const result = response.data;

      console.log('✅ Paiement créé avec succès:', result);

      return result.paymentPlan;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      throw error;
    }
  }

  /**
   * Modifier un paiement existant
   */
  static async updatePayment(planId: string, paymentData: PaymentFormData): Promise<PaymentPlan> {
    try {
      console.log('Updating payment:', { planId, paymentData });

      // Préparer les données pour l'API backend
      const apiData = {
        montant_paye: paymentData.montant_paye,
        montant_prevu: paymentData.montant_paye, // Synchroniser montant prévu avec montant payé
        montant_declare: paymentData.montant_declare || 0,
        montant_non_declare: paymentData.montant_non_declare || 0,
        date_paiement: paymentData.date_paiement,
        date_prevue: paymentData.date_paiement, // Synchroniser les dates
        mode_paiement: paymentData.mode_paiement,
        montant_espece: paymentData.montant_espece || 0,
        montant_cheque: paymentData.montant_cheque || 0,
        notes: paymentData.notes || '',
        description: paymentData.notes || `Paiement modifié le ${new Date().toLocaleDateString()}`
      };

      console.log('Sending API data:', apiData);

      // IMPORTANT: Utiliser l'appel direct pour éviter la confusion entre les routes
      // /payments/plans/:id (métadonnées) vs /payments/plans/:planId (paiements complets)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const authToken = localStorage.getItem('auth_token');

      if (!authToken) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(`${API_BASE_URL}/payments/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification du paiement');
      }

      console.log('Payment updated successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Erreur lors de la modification du paiement:', error);
      throw error;
    }
  }

  // ==================== INVENTAIRE ====================

  /**
   * Récupérer les unités vendues d'un projet
   */
  static async getSoldUnits(projectId: string): Promise<Sale[]> {
    try {
      // Récupérer toutes les ventes du projet
      const response = await apiClient.get(`/sales/project/${projectId}`);
      const allSales = response.data || [];
      
      // Filtrer côté client pour ne garder que les ventes non annulées
      const soldUnits = allSales.filter((sale: any) => 
        sale.statut === 'en_cours' || sale.statut === 'termine'
      );
      
      return soldUnits;
    } catch (error) {
      console.error('Erreur lors de la récupération des unités vendues:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une unité est disponible pour la vente
   */
  static async isUnitAvailable(projectId: string, unitNumber: string): Promise<boolean> {
    try {
      // Récupérer toutes les ventes du projet
      const response = await apiClient.get(`/sales/project/${projectId}`);
      const allSales = response.data || [];
      
      // Vérifier s'il existe une vente non annulée pour cette unité
      const existingSale = allSales.find((sale: any) => 
        sale.unite_numero === unitNumber && 
        (sale.statut === 'en_cours' || sale.statut === 'termine')
      );
      
      return !existingSale; // Disponible si aucune vente trouvée
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error);
      return false; // En cas d'erreur, considérer comme non disponible par sécurité
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Calculer la progression d'une vente
   */
  static calculateSaleProgress(sale: SaleWithPayments) {
    // Calculer l'avance initiale stockée dans la vente
    const initialAdvance = (sale.avance_declare || 0) + (sale.avance_non_declare || 0);
    
    // Calculer les paiements supplémentaires via les plans de paiement
    const additionalPayments = sale.payment_plans?.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0) || 0;
    
    // Total payé = avance initiale + paiements supplémentaires
    const totalPaid = initialAdvance + additionalPayments;
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
      const response = await apiClient.get(`/sales/project/${projectId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}
