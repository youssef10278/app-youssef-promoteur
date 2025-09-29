import React, { useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  Plus, 
  Trash2, 
  AlertTriangle,
  User,
  Home,
  DollarSign
} from 'lucide-react';
import { Sale, PaymentFormData } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { SalesServiceNew as SalesService } from '@/services/salesServiceNew';
import { useToast } from '@/hooks/use-toast';
import { calculateUnifiedPaymentTotals } from '@/utils/paymentHistory';

interface AddPaymentModalProps {
  sale: Sale;
  onClose: () => void;
  onPaymentAdded: () => void;
}

interface PaymentFormDataLocal {
  montant: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_espece?: number;
  montant_cheque?: number;
  cheques?: Array<{
    numero: string;
    banque: string;
    montant: number;
    date_echeance: string;
  }>;
  reference_virement?: string;
  notes?: string;
}

export function AddPaymentModal({ sale, onClose, onPaymentAdded }: AddPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<PaymentFormDataLocal>({
    montant: 0,
    montant_declare: 0,
    montant_non_declare: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'espece',
    cheques: []
  });

  // Calculer le montant déjà payé et restant - REFONTE: Utiliser la logique unifiée
  const paymentTotals = calculateUnifiedPaymentTotals(sale, sale.payment_plans);
  const { totalPaid, remainingAmount, percentage: progressPercentage } = paymentTotals;

  const handleModeChange = (mode: PaymentFormData['mode_paiement']) => {
    const newData = { ...formData, mode_paiement: mode };
    
    if (mode === 'espece') {
      newData.montant_espece = formData.montant;
      newData.montant_cheque = 0;
      newData.cheques = [];
    } else if (mode === 'cheque') {
      newData.montant_cheque = formData.montant;
      newData.montant_espece = 0;
      newData.cheques = formData.cheques || [];
    } else if (mode === 'cheque_espece') {
      newData.montant_cheque = formData.montant_cheque || 0;
      newData.montant_espece = formData.montant_espece || 0;
      newData.cheques = formData.cheques || [];
    } else if (mode === 'virement') {
      newData.montant_cheque = 0;
      newData.montant_espece = 0;
      newData.cheques = [];
    }
    
    setFormData(newData);
  };

  const addCheque = () => {
    const newCheque = {
      numero: '',
      banque: '',
      montant: 0,
      date_echeance: formData.date_paiement
    };
    
    setFormData({
      ...formData,
      cheques: [...(formData.cheques || []), newCheque]
    });
  };

  const updateCheque = (index: number, field: string, value: string | number) => {
    const updatedCheques = [...(formData.cheques || [])];
    updatedCheques[index] = { ...updatedCheques[index], [field]: value };
    
    setFormData({
      ...formData,
      cheques: updatedCheques
    });
  };

  const removeCheque = (index: number) => {
    const updatedCheques = formData.cheques?.filter((_, i) => i !== index) || [];
    setFormData({
      ...formData,
      cheques: updatedCheques
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.montant || formData.montant <= 0) {
      newErrors.montant = 'Le montant est requis et doit être supérieur à 0';
    }

    if (formData.montant > remainingAmount) {
      newErrors.montant = `Le montant ne peut pas dépasser le montant restant (${formatAmount(remainingAmount)} DH)`;
    }

    if (!formData.date_paiement) {
      newErrors.date_paiement = 'La date de paiement est requise';
    }

    // Validation des montants principal/autre montant
    const totalDeclare = (formData.montant_declare || 0) + (formData.montant_non_declare || 0);
    if (Math.abs(totalDeclare - formData.montant) > 0.01) {
      newErrors.montant_declare = 'La somme des montants principal et autre montant doit égaler le montant total';
    }
    if (formData.montant_declare < 0) {
      newErrors.montant_declare = 'Le montant principal ne peut pas être négatif';
    }
    if (formData.montant_non_declare < 0) {
      newErrors.montant_non_declare = 'L\'autre montant ne peut pas être négatif';
    }

    if (formData.mode_paiement === 'cheque_espece') {
      const totalEspece = formData.montant_espece || 0;
      const totalCheque = formData.montant_cheque || 0;
      
      if (Math.abs((totalEspece + totalCheque) - formData.montant) > 0.01) {
        newErrors.repartition = 'La somme espèces + chèques doit égaler le montant total';
      }
    }

    if ((formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && formData.cheques) {
      const totalChequesAmount = formData.cheques.reduce((sum, cheque) => sum + (cheque.montant || 0), 0);
      const expectedChequeAmount = formData.mode_paiement === 'cheque' ? formData.montant : (formData.montant_cheque || 0);
      
      if (Math.abs(totalChequesAmount - expectedChequeAmount) > 0.01) {
        newErrors.cheques = 'Le total des chèques doit égaler le montant chèque';
      }

      formData.cheques.forEach((cheque, index) => {
        if (!cheque.numero.trim()) {
          newErrors[`cheque_${index}_numero`] = 'Le numéro du chèque est requis';
        }
        if (!cheque.banque.trim()) {
          newErrors[`cheque_${index}_banque`] = 'La banque est requise';
        }
        if (!cheque.montant || cheque.montant <= 0) {
          newErrors[`cheque_${index}_montant`] = 'Le montant du chèque est requis';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Préparer les données pour l'API
      const paymentData: PaymentFormData = {
        payment_plan_id: '', // Sera généré automatiquement
        montant_paye: formData.montant,
        montant_declare: formData.montant_declare,
        montant_non_declare: formData.montant_non_declare,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        montant_espece: formData.montant_espece || 0,
        montant_cheque: formData.montant_cheque || 0,
        notes: formData.notes,
        cheques: formData.cheques || []
      };

      console.log('Adding payment:', paymentData);

      // Enregistrer le paiement via le service
      await SalesService.addPayment(sale.id, paymentData);

      // Notifier le succès
      toast({
        title: "Paiement enregistré",
        description: `Paiement de ${formatAmount(formData.montant)} enregistré avec succès.`,
      });

      onPaymentAdded();
    } catch (error) {
      console.error('Error adding payment:', error);
      setErrors({ submit: 'Erreur lors de l\'enregistrement du paiement: ' + (error as Error).message });
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Nouveau Paiement</span>
        </DialogTitle>
        <DialogDescription>
          Enregistrer un paiement pour {sale.client_nom} - {sale.unite_numero}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Résumé de la vente */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Résumé de la Vente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>
                <p className="font-medium">{sale.client_nom}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Unité:</span>
                <p className="font-medium">{sale.unite_numero}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Prix total:</span>
                <p className="font-medium">{formatAmount(sale.prix_total)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Déjà payé:</span>
                <p className="font-medium text-green-600">{formatAmount(totalPaid)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Montant restant</span>
                <span className="font-medium text-blue-600">{formatAmount(remainingAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire de paiement */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base">Détails du Paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Montant et date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montant">Montant du paiement *</Label>
                <Input
                  id="montant"
                  type="number"
                  value={formData.montant || ''}
                  onChange={(e) => {
                    const newMontant = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      montant: newMontant,
                      // Auto-ajuster les montants principal/autre montant si pas encore définis
                      montant_declare: formData.montant_declare || newMontant,
                      montant_non_declare: formData.montant_non_declare || 0
                    });
                  }}
                  placeholder="0"
                  className={errors.montant ? 'border-red-500' : ''}
                />
                {errors.montant && <p className="text-sm text-red-500">{errors.montant}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_paiement">Date du paiement *</Label>
                <Input
                  id="date_paiement"
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) => setFormData({ ...formData, date_paiement: e.target.value })}
                  className={errors.date_paiement ? 'border-red-500' : ''}
                />
                {errors.date_paiement && <p className="text-sm text-red-500">{errors.date_paiement}</p>}
              </div>
            </div>

            {/* Montants principal et autre montant */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="montant_declare" className="text-blue-700 font-medium">
                  Montant principal *
                </Label>
                <Input
                  id="montant_declare"
                  type="number"
                  value={formData.montant_declare || ''}
                  onChange={(e) => {
                    const declare = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      montant_declare: declare,
                      montant_non_declare: Math.max(0, formData.montant - declare)
                    });
                  }}
                  placeholder="0"
                  className="border-blue-300 focus:border-blue-500"
                />
                <p className="text-xs text-blue-600">Montant principal</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant_non_declare" className="text-orange-700 font-medium">
                  Autre montant
                </Label>
                <Input
                  id="montant_non_declare"
                  type="number"
                  value={formData.montant_non_declare || ''}
                  onChange={(e) => {
                    const nonDeclare = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      montant_non_declare: nonDeclare,
                      montant_declare: Math.max(0, formData.montant - nonDeclare)
                    });
                  }}
                  placeholder="0"
                  className="border-orange-300 focus:border-orange-500"
                />
                <p className="text-xs text-orange-600">Autre montant</p>
              </div>
            </div>

            {/* Validation des montants */}
            {(formData.montant_declare + formData.montant_non_declare) !== formData.montant && formData.montant > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  La somme des montants principal et autre montant ({formatAmount(formData.montant_declare + formData.montant_non_declare)} DH)
                  doit être égale au montant total ({formatAmount(formData.montant)} DH)
                </AlertDescription>
              </Alert>
            )}

            {/* Mode de paiement */}
            <div className="space-y-2">
              <Label>Mode de paiement *</Label>
              <Select value={formData.mode_paiement} onValueChange={handleModeChange}>
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
                      <span>Chèque + Espèces</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="virement">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Virement bancaire</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Détails selon le mode de paiement */}
            {formData.mode_paiement === 'cheque_espece' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="montant_espece">Montant espèces</Label>
                  <Input
                    id="montant_espece"
                    type="number"
                    value={formData.montant_espece || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      montant_espece: parseFloat(e.target.value) || 0,
                      montant_cheque: formData.montant - (parseFloat(e.target.value) || 0)
                    })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant_cheque">Montant chèques</Label>
                  <Input
                    id="montant_cheque"
                    type="number"
                    value={formData.montant_cheque || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      montant_cheque: parseFloat(e.target.value) || 0,
                      montant_espece: formData.montant - (parseFloat(e.target.value) || 0)
                    })}
                    placeholder="0"
                  />
                </div>
                {errors.repartition && <p className="text-sm text-red-500 col-span-2">{errors.repartition}</p>}
              </div>
            )}

            {formData.mode_paiement === 'virement' && (
              <div className="space-y-2">
                <Label htmlFor="reference_virement">Référence du virement</Label>
                <Input
                  id="reference_virement"
                  value={formData.reference_virement || ''}
                  onChange={(e) => setFormData({ ...formData, reference_virement: e.target.value })}
                  placeholder="Référence ou numéro de transaction"
                />
              </div>
            )}

            {/* Gestion des chèques */}
            {(formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Chèques</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCheque}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un chèque
                  </Button>
                </div>
                
                {errors.cheques && <p className="text-sm text-red-500">{errors.cheques}</p>}
                
                {formData.cheques?.map((cheque, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Numéro du chèque</Label>
                        <Input
                          value={cheque.numero}
                          onChange={(e) => updateCheque(index, 'numero', e.target.value)}
                          placeholder="Numéro"
                          className={errors[`cheque_${index}_numero`] ? 'border-red-500' : ''}
                        />
                        {errors[`cheque_${index}_numero`] && (
                          <p className="text-sm text-red-500">{errors[`cheque_${index}_numero`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Banque</Label>
                        <Input
                          value={cheque.banque}
                          onChange={(e) => updateCheque(index, 'banque', e.target.value)}
                          placeholder="Nom de la banque"
                          className={errors[`cheque_${index}_banque`] ? 'border-red-500' : ''}
                        />
                        {errors[`cheque_${index}_banque`] && (
                          <p className="text-sm text-red-500">{errors[`cheque_${index}_banque`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Montant</Label>
                        <Input
                          type="number"
                          value={cheque.montant || ''}
                          onChange={(e) => updateCheque(index, 'montant', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={errors[`cheque_${index}_montant`] ? 'border-red-500' : ''}
                        />
                        {errors[`cheque_${index}_montant`] && (
                          <p className="text-sm text-red-500">{errors[`cheque_${index}_montant`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Date d'échéance</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="date"
                            value={cheque.date_echeance}
                            onChange={(e) => updateCheque(index, 'date_echeance', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCheque(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes sur ce paiement..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Erreurs globales */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Boutons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="btn-hero"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </div>
      </div>
    </>
  );
}
