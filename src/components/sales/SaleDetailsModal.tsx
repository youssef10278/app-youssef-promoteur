import React, { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  Printer,
  Settings
} from 'lucide-react';
import { Sale, PaymentPlan } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { PaymentHistoryPrint } from './PaymentHistoryPrint';
import { CompanySettingsModal } from './CompanySettingsModal';
import { usePrint } from '@/hooks/usePrint';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { enrichPaymentPlansWithInitialAdvance, calculateUnifiedPaymentTotals } from '@/utils/paymentHistory';
import { ModifyPaymentModal } from './ModifyPaymentModal';
import { SalesServiceNew } from '@/services/salesServiceNew';

interface SaleDetailsModalProps {
  sale: Sale;
  onClose: () => void;
  onAddPayment: () => void;
  onRefresh?: () => void;
}

interface SaleWithPayments extends Sale {
  payment_plans?: PaymentPlan[];
}

export function SaleDetailsModal({ sale, onClose, onAddPayment, onRefresh }: SaleDetailsModalProps) {
  const saleWithPayments = sale as SaleWithPayments;
  const { printComponent } = usePrint();
  const { companyInfo, saveCompanyInfo } = useCompanySettings();
  const { toast } = useToast();
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentPlan | null>(null);
  const [localPaymentPlans, setLocalPaymentPlans] = useState<PaymentPlan[]>(saleWithPayments.payment_plans || []);

  // Fonction pour recharger les données de paiement
  const reloadPaymentData = async () => {
    try {
      console.log('🔄 [SaleDetailsModal] Rechargement des données de paiement pour la vente:', sale.id);
      console.log('🔄 Plans actuels avant rechargement:', localPaymentPlans);

      // Récupérer la vente complète avec tous ses détails
      const updatedSale = await SalesServiceNew.getSaleById(sale.id);

      console.log('🔄 Vente récupérée:', updatedSale);

      if (updatedSale) {
        const newPlans = updatedSale.payment_plans || [];
        console.log('🔄 Nouveaux plans récupérés:', newPlans);
        console.log('🔄 Nombre de plans:', newPlans.length);

        // Forcer la mise à jour en créant un nouveau tableau
        setLocalPaymentPlans([...newPlans]);

        console.log('✅ Données de paiement rechargées avec succès:', {
          saleId: sale.id,
          plansCount: newPlans.length,
          plans: newPlans
        });

        // IMPORTANT: Déclencher le rafraîchissement de la liste parent APRÈS la mise à jour locale
        if (onRefresh) {
          console.log('🔄 Déclenchement du rafraîchissement parent...');
          await onRefresh();
        }
      } else {
        console.warn('⚠️ Aucune donnée de vente retournée lors du rechargement');
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement des données de paiement:', error);
      // Afficher l'erreur à l'utilisateur
      toast({
        title: "Erreur de rechargement",
        description: "Impossible de recharger les données de paiement. Veuillez rafraîchir la page.",
        variant: "destructive",
      });
    }
  };

  // Effet pour initialiser les données locales
  useEffect(() => {
    setLocalPaymentPlans(saleWithPayments.payment_plans || []);
  }, [saleWithPayments.payment_plans]);

  // Calculer les statistiques - REFONTE: Utiliser la logique unifiée avec les données locales
  const paymentTotals = calculateUnifiedPaymentTotals(sale, localPaymentPlans);
  const { totalPaid, remainingAmount, percentage: progressPercentage, enrichedPaymentPlans } = paymentTotals;

  // Fonction pour imprimer l'historique des paiements
  const handlePrintHistory = () => {
    try {
      const printElement = (
        <PaymentHistoryPrint
          sale={sale}
          paymentPlans={enrichedPaymentPlans}
          companyInfo={companyInfo}
        />
      );

      printComponent(printElement, {
        title: `Historique des paiements - ${sale.client_nom} - ${sale.unite_numero}`,
        onBeforePrint: () => {
          toast({
            title: "Impression en cours",
            description: "Préparation du document d'impression...",
          });
        },
        onAfterPrint: () => {
          toast({
            title: "Impression terminée",
            description: "Le document a été envoyé à l'imprimante.",
          });
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast({
        title: "Erreur d'impression",
        description: "Une erreur s'est produite lors de l'impression du document.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Badge variant="default">En cours</Badge>;
      case 'termine':
        return <Badge variant="secondary">Terminé</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPaymentStatusBadge = (statut: string) => {
    switch (statut) {
      case 'paye':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Payé</Badge>;
      case 'en_attente':
        return <Badge variant="outline">En attente</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'espece':
        return <Banknote className="h-4 w-4" />;
      case 'cheque':
        return <CreditCard className="h-4 w-4" />;
      case 'cheque_espece':
        return (
          <div className="flex space-x-1">
            <CreditCard className="h-3 w-3" />
            <Banknote className="h-3 w-3" />
          </div>
        );
      case 'virement':
        return <Building2 className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    switch (mode) {
      case 'espece':
        return 'Espèces';
      case 'cheque':
        return 'Chèque';
      case 'cheque_espece':
        return 'Chèque + Espèces';
      case 'virement':
        return 'Virement';
      default:
        return mode;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Détails de la Vente</span>
        </DialogTitle>
        <DialogDescription>
          Informations complètes et historique des paiements
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Informations générales */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informations Générales</span>
              </div>
              {getStatusBadge(sale.statut)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{sale.client_nom}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{sale.client_telephone || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{sale.client_email || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-medium">{sale.client_adresse || 'Non renseignée'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unité</p>
                    <p className="font-medium">{sale.unite_numero}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Surface</p>
                    <p className="font-medium">{sale.surface} m²</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prix total</p>
                    <p className="font-medium">{formatAmount(sale.prix_total)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="font-medium">{new Date(sale.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {sale.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{sale.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résumé financier */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Résumé Financier</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatAmount(totalPaid)}
                </div>
                <div className="text-sm text-green-700">Montant payé</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatAmount(remainingAmount)}
                </div>
                <div className="text-sm text-blue-700">Montant restant</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {progressPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-700">Progression</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression du paiement</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Historique des paiements */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Historique des Paiements</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCompanySettings(true)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintHistory}
                  className="flex items-center space-x-1"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer</span>
                </Button>
                <Button
                  size="sm"
                  onClick={onAddPayment}
                  disabled={sale.statut === 'termine' || sale.statut === 'annule'}
                >
                  Nouveau paiement
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrichedPaymentPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun paiement enregistré</p>
                <p className="text-sm mt-2">
                  Cliquez sur "Nouveau paiement" pour enregistrer le premier paiement
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrichedPaymentPlans
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((plan, index) => (
                    <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          {getPaymentModeIcon(plan.mode_paiement || 'espece')}
                          <div>
                            <div className="font-medium">
                              Paiement #{plan.numero_echeance}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getPaymentModeLabel(plan.mode_paiement || 'espece')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="font-medium">
                            {formatAmount(plan.montant_paye || 0)} DH
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            {getPaymentStatusBadge(plan.statut)}
                            {/* Bouton Modifier - Seulement pour les paiements réels */}
                            {!plan.id.startsWith('virtual-') && plan.montant_paye > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPayment(plan)}
                                className="h-6 px-2 text-xs"
                                disabled={sale.statut === 'annule'}
                              >
                                Modifier
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date prévue:</span>
                          <p>{new Date(plan.date_prevue).toLocaleDateString('fr-FR')}</p>
                        </div>
                        {plan.date_paiement && (
                          <div>
                            <span className="text-muted-foreground">Date de paiement:</span>
                            <p>{new Date(plan.date_paiement).toLocaleDateString('fr-FR')}</p>
                          </div>
                        )}
                      </div>
                      
                      {plan.mode_paiement === 'cheque_espece' && (
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                          <div>
                            <span className="text-muted-foreground">Espèces:</span>
                            <p className="font-medium">{formatAmount(plan.montant_espece || 0)} DH</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Chèques:</span>
                            <p className="font-medium">{formatAmount(plan.montant_cheque || 0)} DH</p>
                          </div>
                        </div>
                      )}
                      
                      {plan.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1">{plan.notes}</p>
                        </div>
                      )}
                      
                      {plan.payment_checks && plan.payment_checks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Chèques associés:</p>
                          {plan.payment_checks.map((check) => (
                            <div key={check.id} className="text-sm bg-blue-50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>Chèque #{check.numero_cheque}</span>
                                <span className="font-medium">{formatAmount(check.montant)} DH</span>
                              </div>
                              <div className="text-muted-foreground">
                                {check.banque} - Échéance: {check.date_emission ? new Date(check.date_emission).toLocaleDateString('fr-FR') : 'Non définie'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Boutons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        
        <Button 
          onClick={onAddPayment}
          disabled={sale.statut === 'termine' || sale.statut === 'annule'}
          className="btn-hero"
        >
          Nouveau paiement
        </Button>
      </div>

      {/* Modal des paramètres d'entreprise */}
      <CompanySettingsModal
        isOpen={showCompanySettings}
        onClose={() => setShowCompanySettings(false)}
        currentCompanyInfo={companyInfo}
        onSave={saveCompanyInfo}
      />

      {/* Modal de modification de paiement */}
      {editingPayment && (
        <ModifyPaymentModal
          sale={sale}
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={async () => {
            setEditingPayment(null);
            await reloadPaymentData();
            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </>
  );
}
