import React, { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { Expense, ExpensePaymentPlan } from '@/types/expense';
import { formatAmount } from '@/utils/payments';
import { AddExpensePaymentModal } from './AddExpensePaymentModal';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface ExpenseDetailsModalProps {
  expense: Expense;
  onRefresh?: () => void;
}

export function ExpenseDetailsModal({ expense, onRefresh }: ExpenseDetailsModalProps) {
  const { toast } = useToast();
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [localPaymentPlans, setLocalPaymentPlans] = useState<ExpensePaymentPlan[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les plans de paiement
  useEffect(() => {
    loadPaymentPlans();
  }, [expense.id]);

  const loadPaymentPlans = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 [ExpenseDetailsModal] Chargement des paiements pour la dépense:', expense.id);
      
      const response = await apiClient.getExpensePaymentPlans(expense.id);
      
      if (response.success) {
        setLocalPaymentPlans(response.data || []);
        console.log('✅ [ExpenseDetailsModal] Paiements chargés:', response.data?.length || 0);
      }
    } catch (error) {
      console.error('❌ [ExpenseDetailsModal] Erreur lors du chargement des paiements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadPaymentData = async () => {
    await loadPaymentPlans();
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Calculer les totaux - FIX: Convertir en nombre pour éviter la concaténation
  const totalPaid = localPaymentPlans.reduce((sum, plan) => {
    const montantPaye = Number(plan.montant_paye) || 0;
    console.log(`🔍 [ExpenseDetails] Calcul total - sum=${sum}, montant_paye=${plan.montant_paye} (${typeof plan.montant_paye}) -> ${montantPaye}`);
    return sum + montantPaye;
  }, 0);
  const remainingAmount = expense.montant_total - totalPaid;
  const paymentProgress = expense.montant_total > 0 ? (totalPaid / expense.montant_total) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'non_paye':
        return <Badge variant="destructive">Non payé</Badge>;
      case 'partiellement_paye':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Partiellement payé</Badge>;
      case 'paye':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="outline">En attente</Badge>;
      case 'paye':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      case 'annule':
        return <Badge variant="secondary">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleDeletePayment = async (paymentId: string, paymentNumber: number) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le paiement #${paymentNumber} ? Cette action est irréversible.`)) {
      return;
    }

    setDeletingPaymentId(paymentId);
    try {
      console.log('🗑️ [ExpenseDetailsModal] Suppression du paiement:', paymentId);
      
      const response = await apiClient.deleteExpensePaymentPlan(paymentId);
      
      if (response.success) {
        if (response.data?.expenseDeleted) {
          // Dépense supprimée - fermer le modal et rafraîchir la liste parent
          toast({
            title: "Dépense supprimée",
            description: response.message || "La dépense a été supprimée car c'était le dernier paiement",
          });
          
          if (onRefresh) {
            await onRefresh();
          }
        } else {
          // Seul le paiement supprimé - recharger les données
          toast({
            title: "Paiement supprimé",
            description: response.message || `Le paiement #${paymentNumber} a été supprimé avec succès`,
          });
          await reloadPaymentData();
        }
      }
    } catch (error: any) {
      console.error('❌ [ExpenseDetailsModal] Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Détails de la Dépense</span>
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
                <Building2 className="h-5 w-5" />
                <span>Informations Générales</span>
              </div>
              {getStatusBadge(expense.statut_paiement || 'non_paye')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nom de la dépense</p>
                    <p className="font-medium">{expense.nom}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Projet</p>
                    <p className="font-medium">{expense.projects?.nom || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="font-medium">{new Date(expense.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="font-medium text-lg">{formatAmount(expense.montant_total)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant déclaré</p>
                    <p className="font-medium">{formatAmount(expense.montant_declare)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant non déclaré</p>
                    <p className="font-medium">{formatAmount(expense.montant_non_declare)}</p>
                  </div>
                </div>
              </div>
            </div>

            {expense.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{expense.description}</p>
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
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatAmount(remainingAmount)}
                </div>
                <div className="text-sm text-red-700">Montant restant</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {localPaymentPlans.length}
                </div>
                <div className="text-sm text-blue-700">Paiements</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression du paiement</span>
                <span>{Math.round(paymentProgress)}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
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
              <Button
                size="sm"
                onClick={() => setShowAddPayment(true)}
                disabled={remainingAmount <= 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau paiement
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border border-current border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Chargement des paiements...</p>
              </div>
            ) : localPaymentPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun paiement enregistré</p>
                <p className="text-sm">Cliquez sur "Nouveau paiement" pour ajouter le premier paiement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localPaymentPlans.map((plan, index) => (
                  <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Paiement #{plan.numero_echeance}</span>
                          {getPaymentStatusBadge(plan.statut)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePayment(plan.id, plan.numero_echeance)}
                          disabled={deletingPaymentId === plan.id}
                          className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingPaymentId === plan.id ? (
                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="font-medium">{formatAmount(plan.montant_paye)}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {plan.date_paiement ? new Date(plan.date_paiement).toLocaleDateString('fr-FR') : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Mode</p>
                        <div className="flex items-center space-x-2">
                          {getPaymentModeIcon(plan.mode_paiement || 'espece')}
                          <span className="font-medium">
                            {plan.mode_paiement === 'espece' ? 'Espèces' :
                             plan.mode_paiement === 'cheque' ? 'Chèque' :
                             plan.mode_paiement === 'cheque_espece' ? 'Chèque et Espèces' :
                             plan.mode_paiement === 'virement' ? 'Virement' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Répartition</p>
                        <div className="space-y-1">
                          {plan.montant_declare > 0 && (
                            <p className="text-xs">Déclaré: {formatAmount(plan.montant_declare)}</p>
                          )}
                          {plan.montant_non_declare > 0 && (
                            <p className="text-xs">Non déclaré: {formatAmount(plan.montant_non_declare)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {plan.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Notes: {plan.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal d'ajout de paiement */}
      {showAddPayment && (
        <AddExpensePaymentModal
          expense={expense}
          isOpen={showAddPayment}
          onClose={() => setShowAddPayment(false)}
          onSuccess={async () => {
            console.log('🔄 [ExpenseDetailsModal] Paiement ajouté avec succès');
            await reloadPaymentData();
            setShowAddPayment(false);
          }}
        />
      )}
    </>
  );
}
