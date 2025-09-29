import React, { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Sale, PaymentPlan, PaymentFormData } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { SalesServiceNew as SalesService } from '@/services/salesServiceNew';
import { useToast } from '@/hooks/use-toast';
import { isVirtualPaymentPlan, convertVirtualPlanToCreateData } from '@/utils/paymentHistory';

interface EditPaymentModalProps {
  sale: Sale;
  paymentPlan: PaymentPlan;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

interface PaymentFormDataLocal {
  montant_paye: number;
  montant_declare: number;
  montant_non_declare: number;
  date_paiement: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_espece?: number;
  montant_cheque?: number;
  notes?: string;
}

export function EditPaymentModal({ sale, paymentPlan, onClose, onPaymentUpdated }: EditPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<PaymentFormDataLocal>({
    montant_paye: paymentPlan.montant_paye || 0,
    montant_declare: 0,
    montant_non_declare: 0,
    date_paiement: paymentPlan.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
    mode_paiement: paymentPlan.mode_paiement || 'espece',
    montant_espece: paymentPlan.montant_espece || 0,
    montant_cheque: paymentPlan.montant_cheque || 0,
    notes: paymentPlan.notes || ''
  });

  // Initialiser les montants déclarés/non déclarés
  useEffect(() => {
    const totalMontant = paymentPlan.montant_paye || 0;
    setFormData(prev => ({
      ...prev,
      montant_declare: totalMontant * 0.7, // Par défaut 70% déclaré
      montant_non_declare: totalMontant * 0.3 // Par défaut 30% non déclaré
    }));
  }, [paymentPlan.montant_paye]);

  const isInitialAdvance = paymentPlan.numero_echeance === 1 &&
                          paymentPlan.description?.includes('Avance initiale');
  const isVirtual = isVirtualPaymentPlan(paymentPlan);

  const handleModeChange = (mode: PaymentFormData['mode_paiement']) => {
    const newData = { ...formData, mode_paiement: mode };
    
    if (mode === 'espece') {
      newData.montant_espece = formData.montant_paye;
      newData.montant_cheque = 0;
    } else if (mode === 'cheque') {
      newData.montant_espece = 0;
      newData.montant_cheque = formData.montant_paye;
    } else if (mode === 'virement') {
      newData.montant_espece = 0;
      newData.montant_cheque = 0;
    }
    // Pour cheque_espece, on garde les valeurs actuelles
    
    setFormData(newData);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.montant_paye || formData.montant_paye <= 0) {
      newErrors.montant_paye = 'Le montant doit être supérieur à 0';
    }

    if (!formData.date_paiement) {
      newErrors.date_paiement = 'La date de paiement est requise';
    }

    if (formData.mode_paiement === 'cheque_espece') {
      const totalReparti = (formData.montant_espece || 0) + (formData.montant_cheque || 0);
      if (Math.abs(totalReparti - formData.montant_paye) > 0.01) {
        newErrors.repartition = 'La répartition espèces/chèques doit égaler le montant total';
      }
    }

    const totalDeclare = (formData.montant_declare || 0) + (formData.montant_non_declare || 0);
    if (Math.abs(totalDeclare - formData.montant_paye) > 0.01) {
      newErrors.declaration = 'La répartition déclaré/non déclaré doit égaler le montant total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const paymentData: PaymentFormData = {
        montant_paye: formData.montant_paye,
        montant_declare: formData.montant_declare,
        montant_non_declare: formData.montant_non_declare,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        montant_espece: formData.montant_espece,
        montant_cheque: formData.montant_cheque,
        notes: formData.notes
      };

      console.log('Updating payment:', paymentData);

      // Modifier le paiement existant via le service
      await SalesService.updatePayment(paymentPlan.id, paymentData);

      // Notifier le succès
      toast({
        title: "Paiement modifié",
        description: `Paiement de ${formatAmount(formData.montant_paye)} modifié avec succès.`,
      });

      onPaymentUpdated();
    } catch (error) {
      console.error('Error updating payment:', error);
      setErrors({ submit: 'Erreur lors de la modification du paiement: ' + (error as Error).message });
      toast({
        title: "Erreur",
        description: "Impossible de modifier le paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Modifier le Paiement #{paymentPlan.numero_echeance}</span>
          </DialogTitle>
          <DialogDescription>
            Modification du paiement pour {sale.client_nom} - {sale.unite_numero}
            {isInitialAdvance && (
              <div className="flex items-center space-x-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Attention: Vous modifiez l'avance initiale de la vente
                  {isVirtual && " (sera convertie en paiement réel)"}
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations actuelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations actuelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant actuel:</span>
                <span className="font-medium">{formatAmount(paymentPlan.montant_paye || 0)} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode de paiement:</span>
                <span className="font-medium">{paymentPlan.mode_paiement || 'Non défini'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {paymentPlan.date_paiement ? new Date(paymentPlan.date_paiement).toLocaleDateString('fr-FR') : 'Non définie'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Montant et date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant_paye">Nouveau montant *</Label>
              <Input
                id="montant_paye"
                type="number"
                step="0.01"
                value={formData.montant_paye || ''}
                onChange={(e) => {
                  const newMontant = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    montant_paye: newMontant,
                    montant_declare: newMontant * 0.7,
                    montant_non_declare: newMontant * 0.3,
                    montant_espece: prev.mode_paiement === 'espece' ? newMontant : prev.montant_espece,
                    montant_cheque: prev.mode_paiement === 'cheque' ? newMontant : prev.montant_cheque
                  }));
                }}
                className={errors.montant_paye ? 'border-red-500' : ''}
              />
              {errors.montant_paye && (
                <p className="text-sm text-red-500">{errors.montant_paye}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date de paiement *</Label>
              <Input
                id="date_paiement"
                type="date"
                value={formData.date_paiement}
                onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
                className={errors.date_paiement ? 'border-red-500' : ''}
              />
              {errors.date_paiement && (
                <p className="text-sm text-red-500">{errors.date_paiement}</p>
              )}
            </div>
          </div>

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
                    <DollarSign className="h-4 w-4" />
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

          {/* Répartition espèces/chèques */}
          {formData.mode_paiement === 'cheque_espece' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Répartition Espèces/Chèques</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_espece">Montant espèces</Label>
                  <Input
                    id="montant_espece"
                    type="number"
                    step="0.01"
                    value={formData.montant_espece || ''}
                    onChange={(e) => {
                      const especes = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        montant_espece: especes,
                        montant_cheque: prev.montant_paye - especes
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant_cheque">Montant chèques</Label>
                  <Input
                    id="montant_cheque"
                    type="number"
                    step="0.01"
                    value={formData.montant_cheque || ''}
                    onChange={(e) => {
                      const cheques = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        montant_cheque: cheques,
                        montant_espece: prev.montant_paye - cheques
                      }));
                    }}
                  />
                </div>
                {errors.repartition && (
                  <p className="text-sm text-red-500 col-span-2">{errors.repartition}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Répartition déclaré/non déclaré */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Répartition Déclaré/Non Déclaré</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montant_declare">Montant déclaré</Label>
                <Input
                  id="montant_declare"
                  type="number"
                  step="0.01"
                  value={formData.montant_declare || ''}
                  onChange={(e) => {
                    const declare = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      montant_declare: declare,
                      montant_non_declare: prev.montant_paye - declare
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant_non_declare">Montant non déclaré</Label>
                <Input
                  id="montant_non_declare"
                  type="number"
                  step="0.01"
                  value={formData.montant_non_declare || ''}
                  onChange={(e) => {
                    const nonDeclare = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      montant_non_declare: nonDeclare,
                      montant_declare: prev.montant_paye - nonDeclare
                    }));
                  }}
                />
              </div>
              {errors.declaration && (
                <p className="text-sm text-red-500 col-span-2">{errors.declaration}</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes sur ce paiement..."
              rows={3}
            />
          </div>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Modification...' : 'Modifier le paiement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
