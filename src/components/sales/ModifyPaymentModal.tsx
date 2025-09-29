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
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Sale, PaymentPlan } from '@/types/sale-new';
import { formatAmount } from '@/utils/payments';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface ModifyPaymentModalProps {
  sale: Sale;
  payment: PaymentPlan;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  montant_paye: number;
  date_paiement: string;
  mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
  montant_espece: number;
  montant_cheque: number;
  notes: string;
}

export function ModifyPaymentModal({ sale, payment, onClose, onSuccess }: ModifyPaymentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    montant_paye: payment.montant_paye || 0,
    date_paiement: payment.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
    mode_paiement: payment.mode_paiement || 'espece',
    montant_espece: payment.montant_espece || 0,
    montant_cheque: payment.montant_cheque || 0,
    notes: payment.notes || ''
  });

  const handleModeChange = (mode: FormData['mode_paiement']) => {
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
      const totalReparti = formData.montant_espece + formData.montant_cheque;
      if (Math.abs(totalReparti - formData.montant_paye) > 0.01) {
        newErrors.repartition = 'La répartition espèces/chèques doit égaler le montant total';
      }
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
      console.log('🔧 [ModifyPaymentModal] Envoi de la modification:', {
        paymentId: payment.id,
        formData
      });

      const response = await apiClient.put(`/payments/plans/${payment.id}`, formData);

      console.log('✅ [ModifyPaymentModal] Réponse API:', response);

      toast({
        title: "Paiement modifié",
        description: `Le paiement de ${formatAmount(formData.montant_paye)} a été modifié avec succès.`,
      });

      // Appeler onSuccess AVANT de fermer le modal pour permettre le rechargement
      await onSuccess();

      // Fermer le modal après le rechargement
      onClose();
    } catch (error: any) {
      console.error('❌ [ModifyPaymentModal] Erreur lors de la modification du paiement:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Une erreur est survenue';
      setErrors({ submit: errorMessage });
      toast({
        title: "Erreur",
        description: `Impossible de modifier le paiement: ${errorMessage}`,
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
            <span>Modifier le Paiement #{payment.numero_echeance}</span>
          </DialogTitle>
          <DialogDescription>
            Modification du paiement pour {sale.client_nom} - {sale.unite_numero}
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
                <span className="font-medium">{formatAmount(payment.montant_paye || 0)} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode de paiement:</span>
                <span className="font-medium">{payment.mode_paiement || 'Non défini'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {payment.date_paiement ? new Date(payment.date_paiement).toLocaleDateString('fr-FR') : 'Non définie'}
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
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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

