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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Banknote,
  Building2,
  DollarSign,
  FileText,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { CheckForm } from '@/components/expense/CheckForm';
import { CheckData } from '@/types/expense';
import { apiClient } from '@/integrations/api/client';
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
  montant_declare: number;
  montant_non_declare: number;
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

  // États pour les chèques associés
  const [associatedChecks, setAssociatedChecks] = useState<CheckData[]>([]);
  const [isLoadingChecks, setIsLoadingChecks] = useState(false);

  const [formData, setFormData] = useState<FormData & { cheques: CheckData[] }>({
    montant_paye: payment.montant_paye || 0,
    montant_declare: payment.montant_declare || payment.montant_paye || 0,
    montant_non_declare: payment.montant_non_declare || 0,
    date_paiement: payment.date_paiement?.split('T')[0] || new Date().toISOString().split('T')[0],
    mode_paiement: payment.mode_paiement || 'espece',
    montant_espece: payment.montant_espece || 0,
    montant_cheque: payment.montant_cheque || 0,
    notes: payment.notes || '',
    cheques: []
  });

  // Charger les chèques associés à ce paiement
  const loadAssociatedChecks = async () => {
    if (!payment.id || payment.mode_paiement === 'espece' || payment.mode_paiement === 'virement') {
      return;
    }

    setIsLoadingChecks(true);
    try {
      // Chercher les chèques liés à cette vente et ce paiement
      const response = await apiClient.get(`/checks?sale_id=${sale.id}`);
      const allChecks = response.data || [];

      // Filtrer les chèques qui correspondent à ce paiement par date et montant
      const paymentDate = payment.date_paiement?.split('T')[0];
      const relatedChecks = allChecks.filter((check: any) => {
        const checkDate = check.date_emission?.split('T')[0];
        return checkDate === paymentDate;
      });

      // Convertir au format attendu
      const formattedChecks: CheckData[] = relatedChecks.map((check: any) => ({
        id: check.id,
        numero_cheque: check.numero_cheque || '',
        nom_beneficiaire: check.nom_beneficiaire || '',
        nom_emetteur: check.nom_emetteur || '',
        date_emission: check.date_emission ? check.date_emission.split('T')[0] : '',
        date_encaissement: check.date_encaissement ? check.date_encaissement.split('T')[0] : '',
        montant: check.montant || 0,
        description: check.description || '',
        statut: check.statut || 'emis'
      }));

      setAssociatedChecks(formattedChecks);
      setFormData(prev => ({ ...prev, cheques: formattedChecks }));

    } catch (error) {
      console.error('Erreur lors du chargement des chèques:', error);
    } finally {
      setIsLoadingChecks(false);
    }
  };

  // Charger les chèques au montage du composant
  React.useEffect(() => {
    loadAssociatedChecks();
  }, [payment.id, sale.id]);

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

  // Handlers pour les chèques
  const handleChequesChange = (cheques: CheckData[]) => {
    setFormData(prev => ({ ...prev, cheques }));

    // Recalculer le montant total des chèques
    const totalCheques = cheques.reduce((sum, cheque) => sum + cheque.montant, 0);

    if (formData.mode_paiement === 'cheque') {
      setFormData(prev => ({
        ...prev,
        cheques,
        montant_cheque: totalCheques
      }));
    } else if (formData.mode_paiement === 'cheque_espece') {
      setFormData(prev => ({
        ...prev,
        cheques,
        montant_cheque: totalCheques,
        montant_espece: prev.montant_paye - totalCheques
      }));
    }
  };

  const handleTotalChequeAmountChange = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      montant_cheque: amount,
      montant_espece: prev.montant_paye - amount
    }));
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
        paymentNumeroEcheance: payment.numero_echeance,
        saleId: sale.id,
        formData
      });

      // Préparer les données pour l'API avec les montants détaillés
      const paymentData = {
        montant_paye: formData.montant_paye,
        montant_declare: formData.montant_declare,
        montant_non_declare: formData.montant_non_declare,
        date_paiement: formData.date_paiement,
        mode_paiement: formData.mode_paiement,
        montant_espece: formData.montant_espece,
        montant_cheque: formData.montant_cheque,
        notes: formData.notes
      };

      console.log('🔧 [ModifyPaymentModal] Données envoyées à l\'API:', paymentData);
      console.log('🔧 [ModifyPaymentModal] URL API:', `/payments/plans/${payment.id}`);

      const response = await apiClient.put(`/payments/plans/${payment.id}`, paymentData);

      console.log('✅ [ModifyPaymentModal] Réponse API complète:', response);
      console.log('✅ [ModifyPaymentModal] Données retournées:', response.data);

      // Gérer les chèques si nécessaire
      if ((formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && formData.cheques.length > 0) {
        // Supprimer les anciens chèques
        for (const check of associatedChecks) {
          try {
            await apiClient.delete(`/checks/${check.id}`);
            console.log('✅ Ancien chèque supprimé:', check.id);
          } catch (error) {
            console.warn('⚠️ Erreur lors de la suppression de l\'ancien chèque:', error);
          }
        }

        // Créer les nouveaux chèques
        for (const cheque of formData.cheques) {
          try {
            const checkData = {
              user_id: sale.user_id,
              sale_id: sale.id,
              type_cheque: 'recu',
              montant: cheque.montant,
              numero_cheque: cheque.numero_cheque,
              nom_beneficiaire: cheque.nom_beneficiaire,
              nom_emetteur: cheque.nom_emetteur,
              date_emission: cheque.date_emission,
              date_encaissement: cheque.date_encaissement || null,
              statut: cheque.statut,
              facture_recue: false,
              description: cheque.description
            };

            await apiClient.post('/checks', checkData);
            console.log('✅ Nouveau chèque créé:', checkData);
          } catch (error) {
            console.error('❌ Erreur lors de la création du chèque:', error);
          }
        }
      }

      toast({
        title: "Paiement modifié",
        description: `Le paiement de ${formatAmount(formData.montant_paye)} a été modifié avec succès.`,
      });

      // Appeler onSuccess AVANT de fermer le modal pour permettre le rechargement
      console.log('🔄 [ModifyPaymentModal] Appel de onSuccess() pour recharger les données...');
      await onSuccess();
      console.log('✅ [ModifyPaymentModal] onSuccess() terminé');

      // Fermer le modal après le rechargement
      console.log('🚪 [ModifyPaymentModal] Fermeture du modal');
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
                    montant_cheque: prev.mode_paiement === 'cheque' ? newMontant : prev.montant_cheque,
                    // Auto-ajuster les montants principal/autre montant si pas encore définis
                    montant_declare: prev.montant_declare || newMontant,
                    montant_non_declare: prev.montant_non_declare || 0
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

          {/* Montants principal et autre montant */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <Label htmlFor="montant_declare" className="text-blue-700 font-medium">
                Montant principal *
              </Label>
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
                    montant_non_declare: Math.max(0, prev.montant_paye - declare)
                  }));
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
                step="0.01"
                value={formData.montant_non_declare || ''}
                onChange={(e) => {
                  const nonDeclare = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    montant_non_declare: nonDeclare,
                    montant_declare: Math.max(0, prev.montant_paye - nonDeclare)
                  }));
                }}
                placeholder="0"
                className="border-orange-300 focus:border-orange-500"
              />
              <p className="text-xs text-orange-600">Autre montant</p>
            </div>
          </div>

          {/* Validation des montants */}
          {(formData.montant_declare + formData.montant_non_declare) !== formData.montant_paye && formData.montant_paye > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                La somme des montants principal et autre montant ({formatAmount(formData.montant_declare + formData.montant_non_declare)} DH)
                doit être égale au montant total ({formatAmount(formData.montant_paye)} DH)
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

          {/* Gestion des chèques */}
          {(formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && (
            <div className="space-y-6">
              {isLoadingChecks ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Chargement des chèques...</p>
                </div>
              ) : (
                <>
                  {formData.mode_paiement === 'cheque_espece' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Section Chèques */}
                      <div>
                        <CheckForm
                          cheques={formData.cheques}
                          onChequesChange={handleChequesChange}
                          totalChequeAmount={formData.montant_cheque}
                          onTotalChequeAmountChange={handleTotalChequeAmountChange}
                        />
                      </div>

                      {/* Section Espèces */}
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Montant Espèces</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Label htmlFor="montant_espece">Montant en espèces</Label>
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
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    /* Mode chèque uniquement */
                    <div>
                      <CheckForm
                        cheques={formData.cheques}
                        onChequesChange={handleChequesChange}
                        totalChequeAmount={formData.montant_paye}
                        onTotalChequeAmountChange={(amount) => {
                          setFormData(prev => ({ ...prev, montant_cheque: amount }));
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Répartition espèces/chèques (ancienne version - simplifiée) */}
          {formData.mode_paiement === 'cheque_espece' && false && (
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

