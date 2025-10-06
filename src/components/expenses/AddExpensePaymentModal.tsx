import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  CreditCard,
  Banknote,
  Plus,
  Trash2,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { Expense, CheckData, PaymentMode } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';
import { formatAmount } from '@/utils/payments';

interface AddExpensePaymentModalProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentFormData {
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  mode_paiement: PaymentMode;
  montant_espece: number;
  montant_cheque: number;
  date_paiement: string;
  notes: string;
  cheques: CheckData[];
}

export function AddExpensePaymentModal({ expense, isOpen, onClose, onSuccess }: AddExpensePaymentModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    montant_paye: 0,
    montant_declare: 0,
    montant_non_declare: 0,
    mode_paiement: 'espece',
    montant_espece: 0,
    montant_cheque: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    notes: '',
    cheques: []
  });

  // Calculer le montant restant à payer
  const montantRestant = expense.montant_total - (expense.montant_total_paye || 0);

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setFormData({
        montant_paye: montantRestant > 0 ? montantRestant : 0,
        montant_declare: 0,
        montant_non_declare: 0,
        mode_paiement: 'espece',
        montant_espece: montantRestant > 0 ? montantRestant : 0,
        montant_cheque: 0,
        date_paiement: new Date().toISOString().split('T')[0],
        notes: '',
        cheques: []
      });
    }
  }, [isOpen, montantRestant]);

  const handleInputChange = (field: keyof PaymentFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Recalculer automatiquement les montants selon le mode de paiement
      if (field === 'mode_paiement' || field === 'montant_paye') {
        const montant = field === 'montant_paye' ? value : newData.montant_paye;
        
        switch (newData.mode_paiement) {
          case 'espece':
            newData.montant_espece = montant;
            newData.montant_cheque = 0;
            break;
          case 'cheque':
            newData.montant_espece = 0;
            newData.montant_cheque = montant;
            break;
          case 'virement':
            newData.montant_espece = 0;
            newData.montant_cheque = 0;
            break;
          // Pour cheque_espece, l'utilisateur saisit manuellement
        }
      }

      return newData;
    });
  };

  const addCheque = () => {
    const newCheque: CheckData = {
      numero_cheque: '',
      nom_beneficiaire: '',
      nom_emetteur: '',
      date_emission: formData.date_paiement,
      date_encaissement: '',
      montant: formData.montant_cheque,
      description: `Chèque pour ${expense.nom}`,
      statut: 'emis'
    };

    setFormData(prev => ({
      ...prev,
      cheques: [...prev.cheques, newCheque]
    }));
  };

  const updateCheque = (index: number, field: keyof CheckData, value: any) => {
    setFormData(prev => ({
      ...prev,
      cheques: prev.cheques.map((cheque, i) => 
        i === index ? { ...cheque, [field]: value } : cheque
      )
    }));
  };

  const removeCheque = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cheques: prev.cheques.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.montant_paye <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Le montant payé doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.montant_paye > montantRestant) {
      toast({
        title: "Erreur de validation",
        description: `Le montant payé ne peut pas dépasser le montant restant (${formatAmount(montantRestant)})`,
        variant: "destructive",
      });
      return;
    }

    // Validation des chèques si mode chèque
    if ((formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && formData.montant_cheque > 0) {
      if (formData.cheques.length === 0) {
        toast({
          title: "Erreur de validation",
          description: "Vous devez ajouter au moins un chèque",
          variant: "destructive",
        });
        return;
      }

      const totalCheques = formData.cheques.reduce((sum, cheque) => sum + (cheque.montant || 0), 0);
      if (Math.abs(totalCheques - formData.montant_cheque) > 0.01) {
        toast({
          title: "Erreur de validation",
          description: `Le total des chèques (${formatAmount(totalCheques)}) doit égaler le montant chèque (${formatAmount(formData.montant_cheque)})`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log('🔧 [AddExpensePaymentModal] Ajout du paiement pour la dépense:', expense.id);
      console.log('🔧 Données du paiement:', formData);

      const paymentData = {
        expense_id: expense.id,
        montant_paye: formData.montant_paye,
        montant_declare: formData.montant_declare,
        montant_non_declare: formData.montant_non_declare,
        mode_paiement: formData.mode_paiement,
        montant_espece: formData.montant_espece,
        montant_cheque: formData.montant_cheque,
        date_paiement: formData.date_paiement,
        notes: formData.notes,
        cheques: formData.cheques
      };

      const response = await apiClient.createExpensePaymentPlan(paymentData);
      
      if (response.success) {
        toast({
          title: "Paiement ajouté",
          description: `Paiement de ${formatAmount(formData.montant_paye)} ajouté avec succès`,
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Erreur lors de l\'ajout du paiement');
      }
    } catch (error: any) {
      console.error('❌ [AddExpensePaymentModal] Erreur lors de l\'ajout:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le paiement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case 'espece': return 'Espèces';
      case 'cheque': return 'Chèque';
      case 'cheque_espece': return 'Chèque et Espèces';
      case 'virement': return 'Virement';
      default: return mode;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Ajouter un paiement</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de la dépense */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dépense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{expense.nom}</span>
                <Badge variant="outline">{formatAmount(expense.montant_total)}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Montant payé</span>
                <span>{formatAmount(expense.montant_total_paye || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Montant restant</span>
                <span className="text-red-600">{formatAmount(montantRestant)}</span>
              </div>
              {montantRestant <= 0 && (
                <div className="flex items-center space-x-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Cette dépense est entièrement payée</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails du paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Détails du paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_paye">Montant à payer *</Label>
                  <Input
                    id="montant_paye"
                    type="number"
                    step="0.01"
                    min="0"
                    max={montantRestant}
                    value={formData.montant_paye}
                    onChange={(e) => handleInputChange('montant_paye', parseFloat(e.target.value) || 0)}
                    placeholder="Montant en DH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_paiement">Date de paiement *</Label>
                  <Input
                    id="date_paiement"
                    type="date"
                    value={formData.date_paiement}
                    onChange={(e) => handleInputChange('date_paiement', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode_paiement">Mode de paiement *</Label>
                <Select
                  value={formData.mode_paiement}
                  onValueChange={(value) => handleInputChange('mode_paiement', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espece">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4" />
                        <span>Espèces</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cheque">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Chèque</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cheque_espece">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <Banknote className="h-4 w-4" />
                        <span>Chèque et Espèces</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="virement">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Virement</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Répartition des montants pour paiement mixte */}
              {formData.mode_paiement === 'cheque_espece' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="montant_espece">Montant espèces</Label>
                    <Input
                      id="montant_espece"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.montant_espece}
                      onChange={(e) => handleInputChange('montant_espece', parseFloat(e.target.value) || 0)}
                      placeholder="Montant en espèces"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="montant_cheque">Montant chèque</Label>
                    <Input
                      id="montant_cheque"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.montant_cheque}
                      onChange={(e) => handleInputChange('montant_cheque', parseFloat(e.target.value) || 0)}
                      placeholder="Montant en chèque"
                    />
                  </div>
                </div>
              )}

              {/* Répartition déclaré/non déclaré */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_declare">Montant déclaré</Label>
                  <Input
                    id="montant_declare"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.montant_paye}
                    value={formData.montant_declare}
                    onChange={(e) => handleInputChange('montant_declare', parseFloat(e.target.value) || 0)}
                    placeholder="Montant déclaré"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant_non_declare">Montant non déclaré</Label>
                  <Input
                    id="montant_non_declare"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.montant_paye}
                    value={formData.montant_non_declare}
                    onChange={(e) => handleInputChange('montant_non_declare', parseFloat(e.target.value) || 0)}
                    placeholder="Montant non déclaré"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes sur ce paiement"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gestion des chèques */}
          {(formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && formData.montant_cheque > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Chèques</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addCheque}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cheques.map((cheque, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Chèque #{index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeCheque(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Numéro de chèque</Label>
                        <Input
                          value={cheque.numero_cheque}
                          onChange={(e) => updateCheque(index, 'numero_cheque', e.target.value)}
                          placeholder="N° chèque"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Montant</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cheque.montant}
                          onChange={(e) => updateCheque(index, 'montant', parseFloat(e.target.value) || 0)}
                          placeholder="Montant"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Bénéficiaire</Label>
                        <Input
                          value={cheque.nom_beneficiaire}
                          onChange={(e) => updateCheque(index, 'nom_beneficiaire', e.target.value)}
                          placeholder="Nom du bénéficiaire"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.cheques.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun chèque ajouté</p>
                    <p className="text-sm">Cliquez sur "Ajouter" pour ajouter un chèque</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || montantRestant <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Ajout...' : 'Ajouter le paiement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
