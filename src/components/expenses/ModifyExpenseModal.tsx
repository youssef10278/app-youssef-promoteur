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
  Receipt, 
  Building2, 
  DollarSign,
  FileText,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Expense, ExpenseFormData, CheckData, PAYMENT_MODES } from '@/types/expense';
import { formatAmount } from '@/utils/payments';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';
import { ExpenseService } from '@/services/expenseService';
import CheckForm from '@/components/expense/CheckForm';
import CashForm from '@/components/expense/CashForm';
import { eventBus, EVENTS } from '@/utils/eventBus';

interface ModifyExpenseModalProps {
  expense: Expense;
  projects: Array<{ id: string; nom: string }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModifyExpenseModal({ 
  expense, 
  projects, 
  isOpen, 
  onClose, 
  onSuccess 
}: ModifyExpenseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // États pour les chèques associés
  const [associatedChecks, setAssociatedChecks] = useState<CheckData[]>([]);
  const [isLoadingChecks, setIsLoadingChecks] = useState(false);

  const [formData, setFormData] = useState<ExpenseFormData>({
    project_id: expense.project_id || '',
    nom: expense.nom || '',
    montant_declare: expense.montant_declare || 0,
    montant_non_declare: expense.montant_non_declare || 0,
    montant_total: expense.montant_total || 0,
    mode_paiement: expense.mode_paiement || 'espece',
    montant_cheque: 0,
    montant_espece: 0,
    description: expense.description || '',
    cheques: [],
  });

  // Charger les chèques associés à cette dépense
  useEffect(() => {
    if (isOpen && expense.id) {
      loadAssociatedChecks();
    }
  }, [isOpen, expense.id]);

  // Initialiser les données du formulaire
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        project_id: expense.project_id || '',
        nom: expense.nom || '',
        montant_declare: expense.montant_declare || 0,
        montant_non_declare: expense.montant_non_declare || 0,
        montant_total: expense.montant_total || 0,
        mode_paiement: expense.mode_paiement || 'espece',
        montant_cheque: 0,
        montant_espece: 0,
        description: expense.description || '',
        cheques: [],
      });
      setErrors({});
      setValidationErrors([]);
    }
  }, [isOpen, expense]);

  const loadAssociatedChecks = async () => {
    setIsLoadingChecks(true);
    try {
      const response = await apiClient.get(`/checks?expense_id=${expense.id}`);
      const checks = response.data || [];
      
      // Convertir les chèques au format attendu par le formulaire
      const formattedChecks: CheckData[] = checks.map((check: any) => ({
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
      setFormData(prev => ({
        ...prev,
        cheques: formattedChecks
      }));

      // Calculer les montants selon le mode de paiement
      if (expense.mode_paiement === 'cheque') {
        const totalCheques = formattedChecks.reduce((sum, check) => sum + check.montant, 0);
        setFormData(prev => ({
          ...prev,
          montant_cheque: totalCheques,
          montant_espece: 0
        }));
      } else if (expense.mode_paiement === 'cheque_espece') {
        const totalCheques = formattedChecks.reduce((sum, check) => sum + check.montant, 0);
        const totalEspece = expense.montant_total - totalCheques;
        setFormData(prev => ({
          ...prev,
          montant_cheque: totalCheques,
          montant_espece: Math.max(0, totalEspece)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          montant_cheque: 0,
          montant_espece: expense.montant_total
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chèques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les chèques associés",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChecks(false);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.project_id) {
      errors.push("Veuillez sélectionner un projet");
    }

    if (!formData.nom.trim()) {
      errors.push("Le nom de la dépense est requis");
    }

    if (formData.montant_total <= 0) {
      errors.push("Le montant total doit être supérieur à 0");
    }

    // Validation pour les paiements avec chèques
    if (formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') {
      if (formData.cheques.length === 0) {
        errors.push("Au moins un chèque doit être ajouté");
      }

      // Validation des chèques individuels
      formData.cheques.forEach((cheque, index) => {
        if (!cheque.numero_cheque.trim()) {
          errors.push(`Chèque ${index + 1}: Le numéro de chèque est requis`);
        }
        if (!cheque.nom_beneficiaire.trim()) {
          errors.push(`Chèque ${index + 1}: Le nom du bénéficiaire est requis`);
        }
        if (!cheque.nom_emetteur.trim()) {
          errors.push(`Chèque ${index + 1}: Le nom de l'émetteur est requis`);
        }
        if (!cheque.date_emission) {
          errors.push(`Chèque ${index + 1}: La date d'émission est requise`);
        }
        if (!cheque.date_encaissement) {
          errors.push(`Chèque ${index + 1}: La date d'encaissement est requise`);
        }
        if (cheque.montant <= 0) {
          errors.push(`Chèque ${index + 1}: Le montant doit être supérieur à 0`);
        }
      });

      if (formData.mode_paiement === 'cheque') {
        // Mode chèque uniquement - la somme des chèques doit égaler le montant total
        const totalCheques = formData.cheques.reduce((sum, cheque) => sum + cheque.montant, 0);
        if (Math.abs(totalCheques - formData.montant_total) > 0.01) {
          errors.push(`La somme des chèques (${totalCheques.toFixed(2)} DH) doit égaler le montant total (${formData.montant_total.toFixed(2)} DH)`);
        }
      } else if (formData.mode_paiement === 'cheque_espece') {
        // Mode mixte - validation des montants séparés
        const totalPaiements = formData.montant_cheque + formData.montant_espece;
        if (Math.abs(totalPaiements - formData.montant_total) > 0.01) {
          errors.push(`Le total des paiements (${totalPaiements.toFixed(2)} DH) doit égaler le montant total (${formData.montant_total.toFixed(2)} DH)`);
        }

        if (formData.montant_cheque <= 0) {
          errors.push("Le montant des chèques doit être supérieur à 0");
        }

        if (formData.montant_espece <= 0) {
          errors.push("Le montant en espèces doit être supérieur à 0");
        }

        // Vérifier que la somme des chèques correspond au montant_cheque
        const totalCheques = formData.cheques.reduce((sum, cheque) => sum + cheque.montant, 0);
        if (Math.abs(totalCheques - formData.montant_cheque) > 0.01) {
          errors.push(`La somme des chèques (${totalCheques.toFixed(2)} DH) doit égaler le montant des chèques (${formData.montant_cheque.toFixed(2)} DH)`);
        }
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🔧 [ModifyExpenseModal] Envoi de la modification:', {
        expenseId: expense.id,
        formData
      });

      // Adapter les données au schéma backend
      const expenseData = {
        nom: formData.nom,
        montant_declare: formData.montant_declare || 0,
        montant_non_declare: formData.montant_non_declare || 0,
        methode_paiement: formData.mode_paiement === 'cheque_espece' ? 'cheque_et_espece' : formData.mode_paiement,
        description: formData.description || '',
      };

      // Si montant_total est renseigné mais pas les montants détaillés,
      // on met tout dans montant_declare par défaut
      if (formData.montant_total && !formData.montant_declare && !formData.montant_non_declare) {
        expenseData.montant_declare = formData.montant_total;
        expenseData.montant_non_declare = 0;
      }

      console.log('📤 Envoi des données dépense:', expenseData);

      // Mettre à jour la dépense via le service
      const updatedExpense = await ExpenseService.updateExpense(expense.id, expenseData);

      console.log('✅ Dépense modifiée:', updatedExpense);

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
          const chequeData = {
            project_id: formData.project_id,
            expense_id: expense.id,
            type_cheque: 'donne',
            montant: cheque.montant,
            numero_cheque: cheque.numero_cheque,
            nom_beneficiaire: cheque.nom_beneficiaire,
            nom_emetteur: cheque.nom_emetteur,
            date_emission: cheque.date_emission,
            date_encaissement: cheque.date_encaissement || null,
            statut: 'emis',
            facture_recue: false,
            description: `Chèque pour dépense: ${formData.nom}`
          };

          try {
            const checkResponse = await apiClient.post('/checks', chequeData);
            console.log('✅ Nouveau chèque créé:', checkResponse.data);

            // Émettre un événement pour notifier la création du chèque
            eventBus.emit(EVENTS.CHECK_CREATED, {
              check: checkResponse.data,
              source: 'expense'
            });
          } catch (error) {
            console.error('❌ Erreur lors de la création du chèque:', error);
            toast({
              title: "Attention",
              description: "Dépense modifiée mais erreur lors de l'enregistrement d'un chèque",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Succès",
        description: `La dépense "${formData.nom}" a été modifiée avec succès.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ [ModifyExpenseModal] Erreur lors de la modification:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Une erreur est survenue';
      setErrors({ submit: errorMessage });
      toast({
        title: "Erreur",
        description: `Impossible de modifier la dépense: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form handlers
  const handleFormChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handlePaymentModeChange = (mode: ExpenseFormData['mode_paiement']) => {
    setFormData(prev => {
      if (mode === 'cheque') {
        // Mode chèque uniquement
        return {
          ...prev,
          mode_paiement: mode,
          montant_cheque: prev.montant_total,
          montant_espece: 0,
          cheques: prev.cheques,
        };
      } else if (mode === 'cheque_espece') {
        // Mode mixte chèque et espèces
        return {
          ...prev,
          mode_paiement: mode,
          montant_cheque: prev.montant_cheque || 0,
          montant_espece: prev.montant_espece || prev.montant_total,
          cheques: prev.cheques,
        };
      } else {
        // Autres modes (espèce, virement)
        return {
          ...prev,
          mode_paiement: mode,
          montant_cheque: 0,
          montant_espece: mode === 'espece' ? prev.montant_total : 0,
          cheques: [],
        };
      }
    });
    setValidationErrors([]);
  };

  const handleChequesChange = (cheques: CheckData[]) => {
    setFormData(prev => ({ ...prev, cheques }));
    setValidationErrors([]);
  };

  const handleTotalChequeAmountChange = (amount: number) => {
    setFormData(prev => ({ ...prev, montant_cheque: amount }));
    setValidationErrors([]);
  };

  const handleCashAmountChange = (amount: number) => {
    setFormData(prev => ({ ...prev, montant_espece: amount }));
    setValidationErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Modifier la Dépense</span>
          </DialogTitle>
          <DialogDescription>
            Modification de la dépense "{expense.nom}"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informations de base */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_id">Projet *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => handleFormChange('project_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la dépense *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleFormChange('nom', e.target.value)}
                  placeholder="Ex: Achat terrain"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Détails additionnels sur cette dépense..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Montants */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">Montants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant_declare">Montant principal (DH)</Label>
                  <Input
                    id="montant_declare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montant_declare || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      handleFormChange('montant_declare', value);
                      handleFormChange('montant_total', value + formData.montant_non_declare);
                    }}
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
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      handleFormChange('montant_non_declare', value);
                      handleFormChange('montant_total', formData.montant_declare + value);
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant_total">Montant total (DH) *</Label>
                  <Input
                    id="montant_total"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montant_total || ''}
                    onChange={(e) => handleFormChange('montant_total', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                    className="font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Mode de paiement */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-lg">Mode de paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Méthode de paiement *</Label>
                <Select
                  value={formData.mode_paiement}
                  onValueChange={handlePaymentModeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_MODES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Affichage conditionnel pour paiement avec chèque */}
              {(formData.mode_paiement === 'cheque' || formData.mode_paiement === 'cheque_espece') && (
                <div className="space-y-6 mt-6">
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
                            <CashForm
                              montantEspece={formData.montant_espece}
                              onMontantEspeceChange={handleCashAmountChange}
                            />
                          </div>
                        </div>
                      ) : (
                        /* Mode chèque uniquement */
                        <div>
                          <CheckForm
                            cheques={formData.cheques}
                            onChequesChange={handleChequesChange}
                            totalChequeAmount={formData.montant_total}
                            onTotalChequeAmountChange={(amount) => {
                              // En mode chèque uniquement, le montant total des chèques doit égaler le montant total
                              setFormData(prev => ({ ...prev, montant_cheque: amount }));
                            }}
                          />
                        </div>
                      )}

                      {/* Résumé des paiements */}
                      <Card className="bg-muted/30">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Montant des chèques :</span>
                              <Badge variant="outline" className="bg-primary/10 text-primary">
                                {formData.montant_cheque.toLocaleString()} DH
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Montant en espèces :</span>
                              <Badge variant="outline" className="bg-success/10 text-success">
                                {formData.montant_espece.toLocaleString()} DH
                              </Badge>
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center font-semibold">
                              <span>Total des paiements :</span>
                              <Badge
                                variant={Math.abs((formData.montant_cheque + formData.montant_espece) - formData.montant_total) < 0.01 ? "default" : "destructive"}
                                className="text-base px-3 py-1"
                              >
                                {(formData.montant_cheque + formData.montant_espece).toLocaleString()} DH
                              </Badge>
                            </div>
                            {Math.abs((formData.montant_cheque + formData.montant_espece) - formData.montant_total) > 0.01 && (
                              <div className="text-sm text-destructive">
                                ⚠️ Le total des paiements ne correspond pas au montant total
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" className="flex-1 btn-hero" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
