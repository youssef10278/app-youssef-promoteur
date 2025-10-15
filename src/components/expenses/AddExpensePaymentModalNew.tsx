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
  Receipt,
  Edit
} from 'lucide-react';
import { ExpensePaymentFormData, PaymentMode, PAYMENT_MODES, ExpensePayment } from '@/types/expense';
import { formatAmount } from '@/utils/payments';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';
import { CheckService } from '@/services/checkService';

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
  editingPayment?: ExpensePayment | null;
}

const AddExpensePaymentModalNew: React.FC<AddExpensePaymentModalNewProps> = ({
  expense,
  isOpen,
  onClose,
  onSuccess,
  editingPayment = null,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getInitialFormData = (): ExpensePaymentFormData => {
    if (editingPayment) {
      return {
        montant_paye: editingPayment.montant_paye,
        montant_declare: editingPayment.montant_declare,
        montant_non_declare: editingPayment.montant_non_declare,
        montant_especes: editingPayment.montant_especes || 0,  // NEW
        date_paiement: editingPayment.date_paiement.split('T')[0],
        mode_paiement: editingPayment.mode_paiement,
        description: editingPayment.description || '',
        reference_paiement: editingPayment.reference_paiement || '',
        cheque_data: editingPayment.check_data ? {
          numero_cheque: editingPayment.check_data.numero_cheque,
          nom_beneficiaire: editingPayment.check_data.nom_beneficiaire,
          nom_emetteur: editingPayment.check_data.nom_emetteur,
          date_emission: editingPayment.check_data.date_emission.split('T')[0],
          date_encaissement: editingPayment.check_data.date_encaissement.split('T')[0],
          banque_emettrice: '',
          montant_cheque: editingPayment.mode_paiement === 'cheque_espece'
            ? editingPayment.montant_paye - (editingPayment.montant_especes || 0)
            : undefined,  // NEW
        } : {
          numero_cheque: editingPayment.reference_paiement || '',
          nom_beneficiaire: '',
          nom_emetteur: '',
          date_emission: editingPayment.date_paiement.split('T')[0],
          date_encaissement: editingPayment.date_paiement.split('T')[0],
          banque_emettrice: '',
          montant_cheque: undefined,  // NEW
        },
      };
    }

    return {
      montant_paye: 0,
      montant_declare: 0,
      montant_non_declare: 0,
      montant_especes: 0,  // NEW
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      description: '',
      reference_paiement: '',
      cheque_data: {
        numero_cheque: '',
        nom_beneficiaire: '',
        nom_emetteur: '',
        date_emission: new Date().toISOString().split('T')[0],
        date_encaissement: new Date().toISOString().split('T')[0],
        banque_emettrice: '',
        montant_cheque: 0,  // NEW
      },
    };
  };

  const [formData, setFormData] = useState<ExpensePaymentFormData>(getInitialFormData());

  // Réinitialiser le formulaire quand le paiement à modifier change
  useEffect(() => {
    setFormData(getInitialFormData());
    setValidationErrors([]);
  }, [editingPayment]);

  const resetForm = () => {
    setFormData({
      montant_paye: 0,
      montant_declare: 0,
      montant_non_declare: 0,
      montant_especes: 0,  // NEW
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      description: '',
      reference_paiement: '',
      cheque_data: {
        numero_cheque: '',
        nom_beneficiaire: '',
        nom_emetteur: '',
        date_emission: new Date().toISOString().split('T')[0],
        date_encaissement: new Date().toISOString().split('T')[0],
        banque_emettrice: '',
        montant_cheque: 0,  // NEW
      },
    });
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (formData.montant_paye <= 0) {
      errors.push('Le montant payé doit être supérieur à 0');
    }

    if (formData.montant_declare < 0) {
      errors.push('Le montant principal ne peut pas être négatif');
    }

    if (formData.montant_non_declare < 0) {
      errors.push('L\'autre montant ne peut pas être négatif');
    }

    // Validation selon le mode de paiement
    if (formData.mode_paiement === 'cheque_espece') {
      // Pour cheque_espece: vérifier montant_cheque + montant_especes = montant_paye
      const montantCheque = Number(formData.cheque_data?.montant_cheque) || 0;
      const montantEspeces = Number(formData.montant_especes) || 0;
      const totalChequeEspeces = montantCheque + montantEspeces;

      if (Math.abs(totalChequeEspeces - Number(formData.montant_paye)) > 0.01) {
        errors.push('Le montant payé doit être égal à la somme du montant chèque et espèces');
      }
      if (montantCheque <= 0) {
        errors.push('Le montant du chèque doit être supérieur à 0');
      }
      if (montantEspeces <= 0) {
        errors.push('Le montant en espèces doit être supérieur à 0');
      }
    } else {
      // Pour autres modes: vérifier montant_paye = montant_declare + montant_non_declare
      const totalCalcule = Number(formData.montant_declare) + Number(formData.montant_non_declare);
      if (Math.abs(totalCalcule - Number(formData.montant_paye)) > 0.01) {
        errors.push('Le montant payé doit être égal à la somme du montant principal et de l\'autre montant');
      }
    }

    if (!formData.date_paiement) {
      errors.push('La date de paiement est obligatoire');
    }

    if (!formData.mode_paiement) {
      errors.push('Le mode de paiement est obligatoire');
    }

    // Validation des chèques pour mode 'cheque' et 'cheque_espece'
    if (formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') {
      if (!formData.cheque_data?.numero_cheque?.trim()) {
        errors.push('Le numéro de chèque est obligatoire');
      }
      if (!formData.cheque_data?.nom_beneficiaire?.trim()) {
        errors.push('Le nom du bénéficiaire est obligatoire');
      }
      if (!formData.cheque_data?.nom_emetteur?.trim()) {
        errors.push('Le nom de l\'émetteur est obligatoire');
      }
      if (!formData.cheque_data?.date_emission) {
        errors.push('La date d\'émission est obligatoire');
      }
      if (!formData.cheque_data?.date_encaissement) {
        errors.push('La date d\'encaissement est obligatoire');
      }
    }

    if (formData.mode_paiement === 'virement' && !formData.reference_paiement?.trim()) {
      errors.push('La référence de virement est obligatoire pour un paiement par virement');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleMontantPayeChange = (value: number) => {
    setFormData(prev => {
      if (prev.mode_paiement === 'cheque_espece') {
        // Pour cheque_espece: répartir automatiquement si les montants sont à 0
        const montantCheque = prev.cheque_data?.montant_cheque || 0;
        const montantEspeces = prev.montant_especes || 0;

        if (montantCheque === 0 && montantEspeces === 0) {
          // Répartition par défaut: 70% chèque, 30% espèces
          const nouveauMontantCheque = Math.round(value * 0.7);
          const nouveauMontantEspeces = value - nouveauMontantCheque;

          return {
            ...prev,
            montant_paye: value,
            montant_especes: nouveauMontantEspeces,
            cheque_data: {
              ...prev.cheque_data!,
              montant_cheque: nouveauMontantCheque
            }
          };
        }
      } else {
        // Pour autres modes: logique existante
        return {
          ...prev,
          montant_paye: value,
          montant_declare: prev.montant_declare === 0 && prev.montant_non_declare === 0 ? value : prev.montant_declare,
          montant_non_declare: prev.montant_declare === 0 && prev.montant_non_declare === 0 ? 0 : prev.montant_non_declare,
        };
      }

      return { ...prev, montant_paye: value };
    });
  };

  const handleMontantDeclareChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      montant_declare: value,
      montant_non_declare: Math.max(0, prev.montant_paye - value),
    }));
  };

  // Nouveaux handlers pour cheque_espece
  const handleMontantChequeChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      montant_especes: Math.max(0, prev.montant_paye - value),
      cheque_data: {
        ...prev.cheque_data!,
        montant_cheque: value
      }
    }));
  };

  const handleMontantEspecesChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      montant_especes: value,
      cheque_data: {
        ...prev.cheque_data!,
        montant_cheque: Math.max(0, prev.montant_paye - value)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 [FRONTEND DEBUG] handleSubmit appelé:', {
        editingPayment: !!editingPayment,
        editingPaymentId: editingPayment?.id,
        formData,
        mode_paiement: formData.mode_paiement,
        cheque_data: formData.cheque_data
      });

      let response;

      if (editingPayment) {
        // Mode modification
        console.log('🔍 [FRONTEND DEBUG] Appel PUT:', `/expenses/payments/${editingPayment.id}`);
        response = await apiClient.put(`/expenses/payments/${editingPayment.id}`, formData);
        console.log('🔍 [FRONTEND DEBUG] Réponse PUT:', response);
      } else {
        // Mode ajout
        console.log('🔍 [FRONTEND DEBUG] Appel POST:', `/expenses/${expense.id}/payments`);
        response = await apiClient.post(`/expenses/${expense.id}/payments`, formData);
        console.log('🔍 [FRONTEND DEBUG] Réponse POST:', response);
      }

      if (response.success) {
        toast({
          title: editingPayment ? "Paiement modifié" : "Paiement ajouté",
          description: `Paiement de ${formatAmount(formData.montant_paye)} ${editingPayment ? 'modifié' : 'ajouté'} avec succès.`,
        });

        // Invalider le cache des chèques si un chèque a été créé
        if (formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') {
          console.log('🔄 [CACHE] Invalidation du cache des chèques après création de paiement');
          CheckService.invalidateCache();
        }

        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || `Erreur lors de ${editingPayment ? 'la modification' : 'l\'ajout'} du paiement`);
      }
    } catch (error) {
      console.error('🚨 [FRONTEND DEBUG] Erreur complète:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
        errorStack: error instanceof Error ? error.stack : 'Pas de stack',
        editingPayment: !!editingPayment,
        formData
      });
      console.error(`Erreur lors de ${editingPayment ? 'la modification' : 'l\'ajout'} du paiement:`, error);

      const errorMessage = error instanceof Error ? error.message : `Erreur lors de ${editingPayment ? 'la modification' : 'l\'ajout'} du paiement`;

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
            {editingPayment ? (
              <>
                <Edit className="h-5 w-5 text-primary" />
                <span>Modifier le Paiement</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                <span>Ajouter un Paiement</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingPayment
              ? `Modifier le paiement de ${formatAmount(editingPayment.montant_paye)} pour la dépense "${expense.nom}"`
              : `Ajouter un nouveau paiement pour la dépense "${expense.nom}"`
            }
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

              {/* Répartition montant principal/autre montant */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_declare">Montant principal (DH)</Label>
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
                  <Label htmlFor="montant_non_declare">Autre montant (DH)</Label>
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
                      Math.abs((Number(formData.montant_declare) + Number(formData.montant_non_declare)) - Number(formData.montant_paye)) < 0.01
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }>
                      {formatAmount(Number(formData.montant_declare) + Number(formData.montant_non_declare))} / {formatAmount(Number(formData.montant_paye))}
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

              {/* Formulaire de chèque complet */}
              {formData.mode_paiement === 'cheque' && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Receipt className="h-5 w-5 text-blue-600" />
                      <span>Informations du Chèque</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="numero_cheque">Numéro de chèque *</Label>
                        <Input
                          id="numero_cheque"
                          type="text"
                          value={formData.cheque_data?.numero_cheque || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, numero_cheque: e.target.value }
                          }))}
                          placeholder="Ex: 1234567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="banque_emettrice">Banque émettrice</Label>
                        <Input
                          id="banque_emettrice"
                          type="text"
                          value={formData.cheque_data?.banque_emettrice || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, banque_emettrice: e.target.value }
                          }))}
                          placeholder="Ex: BMCE Bank"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom_emetteur">Nom de l'émetteur *</Label>
                        <Input
                          id="nom_emetteur"
                          type="text"
                          value={formData.cheque_data?.nom_emetteur || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, nom_emetteur: e.target.value }
                          }))}
                          placeholder="Nom de celui qui émet le chèque"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nom_beneficiaire">Nom du bénéficiaire *</Label>
                        <Input
                          id="nom_beneficiaire"
                          type="text"
                          value={formData.cheque_data?.nom_beneficiaire || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, nom_beneficiaire: e.target.value }
                          }))}
                          placeholder="Nom de celui qui reçoit le chèque"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_emission">Date d'émission *</Label>
                        <Input
                          id="date_emission"
                          type="date"
                          value={formData.cheque_data?.date_emission || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, date_emission: e.target.value }
                          }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_encaissement">Date d'encaissement prévue *</Label>
                        <Input
                          id="date_encaissement"
                          type="date"
                          value={formData.cheque_data?.date_encaissement || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            cheque_data: { ...prev.cheque_data!, date_encaissement: e.target.value }
                          }))}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire Chèque + Espèces */}
              {formData.mode_paiement === 'cheque_espece' && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Receipt className="h-5 w-5 text-purple-600" />
                      <span>Répartition Chèque + Espèces</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Répartissez le montant total entre le chèque et les espèces
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Répartition des montants */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="montant_cheque">Montant Chèque (DH) *</Label>
                        <Input
                          id="montant_cheque"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.cheque_data?.montant_cheque || ''}
                          onChange={(e) => handleMontantChequeChange(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="montant_especes_cheque">Montant Espèces (DH) *</Label>
                        <Input
                          id="montant_especes_cheque"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={formData.montant_especes || ''}
                          onChange={(e) => handleMontantEspecesChange(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="text-right"
                        />
                      </div>
                    </div>

                    {/* Vérification de la répartition */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span>Vérification:</span>
                        <span className={
                          Math.abs((Number(formData.cheque_data?.montant_cheque) + Number(formData.montant_especes)) - Number(formData.montant_paye)) < 0.01
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }>
                          {formatAmount(Number(formData.cheque_data?.montant_cheque) + Number(formData.montant_especes))} / {formatAmount(Number(formData.montant_paye))}
                        </span>
                      </div>
                    </div>

                    {/* Informations du chèque */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-purple-700">Informations du Chèque</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="numero_cheque_mixte">Numéro de chèque *</Label>
                          <Input
                            id="numero_cheque_mixte"
                            type="text"
                            value={formData.cheque_data?.numero_cheque || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, numero_cheque: e.target.value }
                            }))}
                            placeholder="Ex: 1234567"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nom_beneficiaire_mixte">Bénéficiaire *</Label>
                          <Input
                            id="nom_beneficiaire_mixte"
                            type="text"
                            value={formData.cheque_data?.nom_beneficiaire || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, nom_beneficiaire: e.target.value }
                            }))}
                            placeholder="Nom du bénéficiaire"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="nom_emetteur_mixte">Émetteur *</Label>
                          <Input
                            id="nom_emetteur_mixte"
                            type="text"
                            value={formData.cheque_data?.nom_emetteur || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, nom_emetteur: e.target.value }
                            }))}
                            placeholder="Nom de l'émetteur"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="banque_emettrice_mixte">Banque émettrice</Label>
                          <Input
                            id="banque_emettrice_mixte"
                            type="text"
                            value={formData.cheque_data?.banque_emettrice || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, banque_emettrice: e.target.value }
                            }))}
                            placeholder="Ex: BMCE Bank"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_emission_mixte">Date d'émission *</Label>
                          <Input
                            id="date_emission_mixte"
                            type="date"
                            value={formData.cheque_data?.date_emission || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, date_emission: e.target.value }
                            }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_encaissement_mixte">Date d'encaissement *</Label>
                          <Input
                            id="date_encaissement_mixte"
                            type="date"
                            value={formData.cheque_data?.date_encaissement || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              cheque_data: { ...prev.cheque_data!, date_encaissement: e.target.value }
                            }))}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Référence de virement */}
              {formData.mode_paiement === 'virement' && (
                <div className="space-y-2">
                  <Label htmlFor="reference_paiement">Référence de virement *</Label>
                  <Input
                    id="reference_paiement"
                    type="text"
                    value={formData.reference_paiement}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_paiement: e.target.value }))}
                    placeholder="Ex: VIR-2024-001"
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
