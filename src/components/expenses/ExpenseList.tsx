import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Eye, Edit, Trash2, Building2, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Expense } from '@/types/expense';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onViewDetails?: (expense: Expense) => void;
  onViewPayments?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getPaymentModeBadge = (mode: string | null | undefined) => {
  // Gérer les cas où mode est null, undefined ou vide
  if (!mode || mode.trim() === '') {
    return (
      <Badge className="bg-gray-100 text-gray-600">
        Non défini
      </Badge>
    );
  }

  const modes = {
    'espece': { label: 'Espèces', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    'cheque': { label: 'Chèque', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
    'virement': { label: 'Virement', variant: 'outline' as const, color: 'bg-purple-100 text-purple-800' },
    'cheque_espece': { label: 'Mixte', variant: 'default' as const, color: 'bg-orange-100 text-orange-800' },
  };
  
  const modeInfo = modes[mode as keyof typeof modes] || { label: mode, variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge className={modeInfo.color}>
      {modeInfo.label}
    </Badge>
  );
};

const getPaymentStatusBadge = (status?: string) => {
  switch (status) {
    case 'non_paye':
      return <Badge variant="destructive">Non payé</Badge>;
    case 'partiellement_paye':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Partiellement payé</Badge>;
    case 'paye':
      return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>;
    default:
      return null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isLoading,
  onViewDetails,
  onViewPayments,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return (
      <Card className="card-premium text-center py-12">
        <CardContent>
          <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p>Chargement des dépenses...</p>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="card-premium text-center py-12">
        <CardContent>
          <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune dépense</h3>
          <p className="text-muted-foreground mb-6">
            Commencez par ajouter vos premières dépenses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id} className="card-premium hover-lift">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                  <CardTitle className="text-base sm:text-lg">
                    {expense.nom}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {getPaymentModeBadge(expense.mode_paiement)}
                    {getPaymentStatusBadge(expense.statut_paiement)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{expense.projects?.nom || 'Projet non défini'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formatDate(expense.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Total: {formatAmount(expense.total_paye_calcule || 0)} DH</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {onViewPayments && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPayments(expense)}
                    className="w-full sm:w-auto bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Paiements
                  </Button>
                )}
                {onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(expense)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(expense)}
                    className="w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(expense)}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Résumé financier */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatAmount(expense.total_declare_calcule || 0)} DH
                  </div>
                  <div className="text-sm text-green-700">Montant principal</div>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {formatAmount(expense.total_non_declare_calcule || 0)} DH
                  </div>
                  <div className="text-sm text-orange-700">Autre montant</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {formatAmount((expense.total_declare_calcule || 0) + (expense.total_non_declare_calcule || 0))} DH
                  </div>
                  <div className="text-sm text-blue-700">Montant total</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {formatAmount(expense.total_paye_calcule || 0)} DH
                  </div>
                  <div className="text-sm text-purple-700">Montant payé</div>
                </div>
              </div>

              {/* Barre de progression du paiement */}
              {((expense.total_declare_calcule || 0) + (expense.total_non_declare_calcule || 0)) > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression du paiement</span>
                    <span>{Math.round(((expense.total_paye_calcule || 0) / ((expense.total_declare_calcule || 0) + (expense.total_non_declare_calcule || 0))) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((expense.total_paye_calcule || 0) / ((expense.total_declare_calcule || 0) + (expense.total_non_declare_calcule || 0))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Restant: {formatAmount(((expense.total_declare_calcule || 0) + (expense.total_non_declare_calcule || 0)) - (expense.total_paye_calcule || 0))} DH
                  </div>
                </div>
              )}

              {/* Description */}
              {expense.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <strong className="text-gray-700">Description:</strong>
                    <p className="mt-1 text-gray-600">{expense.description}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
