import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Calendar, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  Eye,
  X
} from 'lucide-react';
import { ExpenseWithPayments, ExpensePayment, PaymentMode, PAYMENT_MODES, EXPENSE_STATUS } from '@/types/expense';
import { formatAmount } from '@/utils/payments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';
import AddExpensePaymentModalNew from './AddExpensePaymentModalNew';

interface ExpenseDetailsModalNewProps {
  expense: ExpenseWithPayments;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const ExpenseDetailsModalNew: React.FC<ExpenseDetailsModalNewProps> = ({
  expense: initialExpense,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { toast } = useToast();
  const [expense, setExpense] = useState<ExpenseWithPayments>(initialExpense);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Mettre à jour l'expense quand les props changent
  useEffect(() => {
    setExpense(initialExpense);
  }, [initialExpense]);

  const loadExpenseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/expenses/${expense.id}/with-payments`);
      if (response.success && response.data) {
        setExpense(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la dépense",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentSuccess = () => {
    loadExpenseDetails();
    onRefresh();
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/expenses/payments/${paymentId}`);
      if (response.success) {
        toast({
          title: "Paiement supprimé",
          description: "Le paiement a été supprimé avec succès",
        });
        loadExpenseDetails();
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    }
  };

  const getModePaymentIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'espece':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'cheque':
      case 'cheque_espece':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      case 'virement':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'termine':
        return <Badge variant="secondary">Terminée</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>{expense.nom}</span>
                {getStatusBadge(expense.statut)}
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Informations Générales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Projet</p>
                    <p className="font-medium">{expense.projects?.nom || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="font-medium">
                      {format(new Date(expense.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                
                {expense.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{expense.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Résumé financier */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Résumé Financier</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Payé</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatAmount(expense.total_paye_calcule || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Montant Déclaré</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(expense.total_declare_calcule || 0)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Montant Non Déclaré</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatAmount(expense.total_non_declare_calcule || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des paiements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Historique des Paiements</span>
                    <Badge variant="outline">
                      {expense.nombre_paiements || 0} paiement{(expense.nombre_paiements || 0) > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddPayment(true)}
                    size="sm"
                    className="btn-primary-gradient"
                    disabled={expense.statut === 'annule'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Paiement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!expense.payments || expense.payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun paiement enregistré</p>
                    <p className="text-sm">Cliquez sur "Ajouter Paiement" pour commencer</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expense.payments.map((payment, index) => (
                      <div key={payment.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex items-center space-x-2">
                                {getModePaymentIcon(payment.mode_paiement)}
                                <span className="font-medium">
                                  {PAYMENT_MODES[payment.mode_paiement]}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-lg font-semibold">
                                {formatAmount(payment.montant_paye)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div>
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {format(new Date(payment.date_paiement), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                              <div>
                                Déclaré: {formatAmount(payment.montant_declare)}
                              </div>
                              <div>
                                Non déclaré: {formatAmount(payment.montant_non_declare)}
                              </div>
                            </div>

                            {payment.reference_paiement && (
                              <div className="text-sm text-muted-foreground mt-1">
                                <FileText className="h-3 w-3 inline mr-1" />
                                Réf: {payment.reference_paiement}
                              </div>
                            )}

                            {payment.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {payment.description}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePayment(payment.id)}
                              disabled={expense.statut === 'annule'}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout de paiement */}
      <AddExpensePaymentModalNew
        expense={expense}
        isOpen={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onSuccess={handleAddPaymentSuccess}
      />
    </>
  );
};

export default ExpenseDetailsModalNew;
