import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Calendar, 
  CreditCard,
  Banknote,
  Plus,
  Save,
  X,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { ExpensePaymentFormData, PaymentMode, PAYMENT_MODES } from '@/types/expense';
import { formatAmount } from '@/utils/payments';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface AddExpensePaymentModalNewProps {
  expense: {
    id: string;
    nom: string;
    total_paye_calcule?: number;
    nombre_paiements?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddExpensePaymentModalNew: React.FC<AddExpensePaymentModalNewProps> = ({
  expense,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<ExpensePaymentFormData>({
    montant_paye: 0,
    montant_declare: 0,
    montant_non_declare: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'espece',
    description: '',
    reference_paiement: '',
  });

  const resetForm = () => {
    setFormData({
      montant_paye: 0,
      montant_declare: 0,
      montant_non_declare: 0,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      description: '',
      reference_paiement: '',
    });
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (formData.montant_paye <= 0) {
      errors.push('Le montant payé doit être supérieur à 0');
    }

    if (formData.montant_declare < 0) {
      errors.push('Le montant déclaré ne peut pas être négatif');
    }

    if (formData.montant_non_declare < 0) {
      errors.push('Le montant non déclaré ne peut pas être négatif');
    }

    const totalCalcule = formData.montant_declare + formData.montant_non_declare;
    if (Math.abs(totalCalcule - formData.montant_paye) > 0.01) {
      errors.push('Le montant payé doit être égal à la somme des montants déclaré et non déclaré');
    }

    if (!formData.date_paiement) {
      errors.push('La date de paiement est obligatoire');
    }

    if (!formData.mode_paiement) {
      errors.push('Le mode de paiement est obligatoire');
    }

    if (formData.mode_paiement === 'cheque' && !formData.reference_paiement?.trim()) {
      errors.push('Le numéro de chèque est obligatoire pour un paiement par chèque');
    }

    if (formData.mode_paiement === 'virement' && !formData.reference_paiement?.trim()) {
      errors.push('La référence de virement est obligatoire pour un paiement par virement');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleMontantPayeChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      montant_paye: value,
      // Si les montants déclaré/non déclaré sont à 0, répartir automatiquement
      montant_declare: prev.montant_declare === 0 && prev.montant_non_declare === 0 ? value : prev.montant_declare,
      montant_non_declare: prev.montant_declare === 0 && prev.montant_non_declare === 0 ? 0 : prev.montant_non_declare,
    }));
  };

  const handleMontantDeclareChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      montant_declare: value,
      montant_non_declare: Math.max(0, prev.montant_paye - value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post(`/api/expenses/${expense.id}/payments`, formData);

      if (response.success) {
        toast({
          title: "Paiement ajouté",
          description: `Paiement de ${formatAmount(formData.montant_paye)} ajouté avec succès.`,
        });

        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Erreur lors de l\'ajout du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du paiement';
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const getModePaymentIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'espece':
        return <Banknote className="h-4 w-4" />;
      case 'cheque':
      case 'cheque_espece':
        return <Receipt className="h-4 w-4" />;
      case 'virement':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Ajouter un Paiement</span>
          </DialogTitle>
          <DialogDescription>
            Ajouter un nouveau paiement pour la dépense "{expense.nom}"
          </DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Informations de la dépense */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dépense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{expense.nom}</span>
              <Badge variant="outline">
                {formatAmount(expense.total_paye_calcule || 0)} payé
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Nombre de paiements</span>
              <span>{expense.nombre_paiements || 0}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Montants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Montants du Paiement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Montant total payé */}
              <div className="space-y-2">
                <Label htmlFor="montant_paye">Montant payé (DH) *</Label>
                <Input
                  id="montant_paye"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.montant_paye || ''}
                  onChange={(e) => handleMontantPayeChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Répartition déclaré/non déclaré */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_declare">Montant déclaré (DH)</Label>
                  <Input
                    id="montant_declare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montant_declare || ''}
                    onChange={(e) => handleMontantDeclareChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montant_non_declare">Montant non déclaré (DH)</Label>
                  <Input
                    id="montant_non_declare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montant_non_declare || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      montant_non_declare: parseFloat(e.target.value) || 0,
                      montant_declare: Math.max(0, prev.montant_paye - (parseFloat(e.target.value) || 0))
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Vérification de cohérence */}
              {formData.montant_paye > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span>Vérification:</span>
                    <span className={
                      Math.abs((formData.montant_declare + formData.montant_non_declare) - formData.montant_paye) < 0.01
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }>
                      {formatAmount(formData.montant_declare + formData.montant_non_declare)} / {formatAmount(formData.montant_paye)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails du paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Détails du Paiement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date et mode de paiement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_paiement">Date de paiement *</Label>
                  <Input
                    id="date_paiement"
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode_paiement">Mode de paiement *</Label>
                  <Select
                    value={formData.mode_paiement}
                    onValueChange={(value: PaymentMode) => setFormData(prev => ({ ...prev, mode_paiement: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_MODES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            {getModePaymentIcon(key as PaymentMode)}
                            <span>{label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Référence de paiement */}
              {(formData.mode_paiement === 'cheque' || formData.mode_paiement === 'virement') && (
                <div className="space-y-2">
                  <Label htmlFor="reference_paiement">
                    {formData.mode_paiement === 'cheque' ? 'Numéro de chèque *' : 'Référence de virement *'}
                  </Label>
                  <Input
                    id="reference_paiement"
                    type="text"
                    value={formData.reference_paiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_paiement: e.target.value }))}
                    placeholder={formData.mode_paiement === 'cheque' ? 'Ex: 1234567' : 'Ex: VIR-2024-001'}
                    required
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de ce paiement..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary-gradient"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ajouter le Paiement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpensePaymentModalNew;
