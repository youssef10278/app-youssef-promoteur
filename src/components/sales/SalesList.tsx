import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  Plus,
  Eye,
  TrendingUp,
  Printer
} from 'lucide-react';
import { Sale, PaymentPlan } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { PaymentHistoryPrint } from './PaymentHistoryPrint';
import { usePrint } from '@/hooks/usePrint';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { enrichPaymentPlansWithInitialAdvance, calculateUnifiedPaymentTotals } from '@/utils/paymentHistory';

interface SalesListProps {
  sales: Sale[];
  onAddPayment: (sale: Sale) => void;
  onViewDetails: (sale: Sale) => void;
  onPrintHistory?: (sale: Sale) => void;
}

interface SaleWithPayments extends Sale {
  payment_plans?: PaymentPlan[];
}

export function SalesList({ sales, onAddPayment, onViewDetails, onPrintHistory }: SalesListProps) {
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const { printComponent } = usePrint();
  const { companyInfo } = useCompanySettings();
  const { toast } = useToast();

  const toggleExpanded = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  // Fonction pour imprimer l'historique des paiements
  const handlePrintHistory = (sale: Sale) => {
    try {
      const saleWithPayments = sale as SaleWithPayments;
      const enrichedPlans = enrichPaymentPlansWithInitialAdvance(sale, saleWithPayments.payment_plans);
      const printElement = (
        <PaymentHistoryPrint
          sale={sale}
          paymentPlans={enrichedPlans}
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

      // Appeler le callback parent si fourni
      if (onPrintHistory) {
        onPrintHistory(sale);
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast({
        title: "Erreur d'impression",
        description: "Une erreur s'est produite lors de l'impression du document.",
        variant: "destructive",
      });
    }
  };

  const calculateSaleProgress = (sale: SaleWithPayments) => {
    // REFONTE: Utiliser la logique unifiée
    const paymentTotals = calculateUnifiedPaymentTotals(sale, sale.payment_plans);
    const { totalPaid, totalDue, percentage, enrichedPaymentPlans } = paymentTotals;
    
    // Trouver le prochain paiement
    const today = new Date();
    const unpaidPlans = sale.payment_plans.filter(plan => 
      plan.statut === 'en_attente' || plan.statut === 'en_retard'
    );
    
    const nextPayment = unpaidPlans
      .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())[0];
    
    const overduePayments = unpaidPlans.filter(plan => 
      new Date(plan.date_prevue) < today
    ).length;

    return {
      totalPaid,
      totalDue,
      percentage,
      nextPaymentDate: nextPayment?.date_prevue || null,
      overduePayments,
      enrichedPaymentPlans
    };
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

  if (sales.length === 0) {
    return (
      <Card className="card-premium text-center py-12">
        <CardContent>
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune vente</h3>
          <p className="text-muted-foreground mb-6">
            Commencez par créer votre première vente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sales.map((sale) => {
        const progress = calculateSaleProgress(sale);
        const isExpanded = expandedSales.has(sale.id);

        return (
          <Card key={sale.id} className="card-premium hover-lift">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                    <CardTitle className="text-base sm:text-lg">
                      {sale.unite_numero} - {sale.client_nom}
                    </CardTitle>
                    {getStatusBadge(sale.statut)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{sale.client_telephone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{sale.client_email || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{sale.surface}m² - {formatAmount(sale.prix_total)} DH</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(sale)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintHistory(sale)}
                    className="w-full sm:w-auto text-blue-600 hover:text-blue-700"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimer
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onAddPayment(sale)}
                    disabled={sale.statut === 'termine' || sale.statut === 'annule'}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Paiement
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Résumé financier */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {formatAmount(progress.totalPaid)}
                    </div>
                    <div className="text-sm text-green-700">Montant payé</div>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {formatAmount(progress.totalDue - progress.totalPaid)}
                    </div>
                    <div className="text-sm text-blue-700">Montant restant</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-600">
                      {progress.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-700">Progression</div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression du paiement</span>
                    <span>{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                </div>

                {/* Alertes */}
                {progress.overduePayments > 0 && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {progress.overduePayments} paiement(s) en retard
                    </span>
                  </div>
                )}

                {progress.nextPaymentDate && (
                  <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-2 rounded">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Prochain paiement prévu le {new Date(progress.nextPaymentDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {/* Bouton pour voir les détails des paiements */}
                {sale.payment_plans && sale.payment_plans.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(sale.id)}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {isExpanded ? 'Masquer' : 'Voir'} l'historique des paiements
                  </Button>
                )}

                {/* Historique des paiements (expandable) */}
                {isExpanded && progress.enrichedPaymentPlans && progress.enrichedPaymentPlans.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <h4 className="font-medium text-sm">Historique des paiements</h4>
                    {progress.enrichedPaymentPlans
                      .sort((a, b) => a.numero_echeance - b.numero_echeance)
                      .map((plan) => (
                        <div key={plan.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm">
                              <div className="font-medium">Paiement #{plan.numero_echeance}</div>
                              <div className="text-muted-foreground">
                                {new Date(plan.date_prevue).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                              <div className="font-medium">
                                {formatAmount(plan.montant_paye || 0)} / {formatAmount(plan.montant_prevu)} DH
                              </div>
                              {plan.date_paiement && (
                                <div className="text-muted-foreground">
                                  Payé le {new Date(plan.date_paiement).toLocaleDateString('fr-FR')}
                                </div>
                              )}
                            </div>
                            {getPaymentStatusBadge(plan.statut)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
