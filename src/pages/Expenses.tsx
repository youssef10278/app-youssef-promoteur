import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Plus, ArrowLeft, Building2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CheckForm from '@/components/expense/CheckForm';
import CashForm from '@/components/expense/CashForm';
import { Project, Expense, ExpenseFormData, CheckData, PAYMENT_MODES } from '@/types/expense';

const Expenses = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    project_id: '',
    nom: '',
    montant_declare: 0,
    montant_non_declare: 0,
    montant_total: 0,
    mode_paiement: 'espece',
    montant_cheque: 0,
    montant_espece: 0,
    description: '',
    cheques: [],
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchExpenses();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nom')
        .eq('user_id', user?.id)
        .order('nom');

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          projects!inner(nom, user_id)
        `)
        .eq('projects.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les dépenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validation functions
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

    // Validation pour les paiements mixtes
    if (formData.mode_paiement === 'cheque_espece') {
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

      // Vérifier que la somme des chèques correspond au montant_cheque
      const totalCheques = formData.cheques.reduce((sum, cheque) => sum + cheque.montant, 0);
      if (Math.abs(totalCheques - formData.montant_cheque) > 0.01) {
        errors.push(`La somme des chèques (${totalCheques.toFixed(2)} DH) doit égaler le montant des chèques (${formData.montant_cheque.toFixed(2)} DH)`);
      }
    }

    return errors;
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      nom: '',
      montant_declare: 0,
      montant_non_declare: 0,
      montant_total: 0,
      mode_paiement: 'espece',
      montant_cheque: 0,
      montant_espece: 0,
      description: '',
      cheques: [],
    });
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Calculate montant_total if not set
      const montantTotal = formData.montant_total || (formData.montant_declare + formData.montant_non_declare);

      const expenseData = {
        project_id: formData.project_id,
        user_id: user!.id,
        nom: formData.nom,
        montant_declare: formData.montant_declare,
        montant_non_declare: formData.montant_non_declare,
        montant_total: montantTotal,
        montant_cheque: formData.mode_paiement === 'cheque_espece' ? formData.montant_cheque : 0,
        montant_espece: formData.mode_paiement === 'cheque_espece' ? formData.montant_espece : montantTotal,
        mode_paiement: formData.mode_paiement,
        description: formData.description,
      };

      const { data: expenseResult, error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Si mode paiement mixte, insérer les chèques
      if (formData.mode_paiement === 'cheque_espece' && formData.cheques.length > 0) {
        const chequesData = formData.cheques.map(cheque => ({
          ...cheque,
          expense_id: expenseResult.id,
          user_id: user!.id,
        }));

        const { error: chequesError } = await supabase
          .from('cheques')
          .insert(chequesData);

        if (chequesError) throw chequesError;
      }

      toast({
        title: "Succès",
        description: "Dépense ajoutée avec succès",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense",
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
    setFormData(prev => ({
      ...prev,
      mode_paiement: mode,
      montant_cheque: mode === 'cheque_espece' ? prev.montant_cheque : 0,
      montant_espece: mode === 'cheque_espece' ? prev.montant_espece : prev.montant_total,
      cheques: mode === 'cheque_espece' ? prev.cheques : [],
    }));
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

  const filteredExpenses = selectedProject && selectedProject !== 'all'
    ? expenses.filter(expense => expense.projects.nom === selectedProject)
    : expenses;

  if (loading || isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gestion des Dépenses</h1>
                <p className="text-primary-foreground/80">
                  Suivez vos dépenses déclarées et non déclarées
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-secondary-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Dépense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouvelle Dépense</DialogTitle>
                  <DialogDescription>
                    Ajouter une nouvelle dépense avec gestion des paiements
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
                          <Label htmlFor="montant_declare">Montant déclaré (DH)</Label>
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
                          <Label htmlFor="montant_non_declare">Montant non déclaré (DH)</Label>
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

                      {/* Affichage conditionnel pour paiement mixte */}
                      {formData.mode_paiement === 'cheque_espece' && (
                        <div className="space-y-6 mt-6">
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
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Annuler
                    </Button>
                    <Button type="submit" className="flex-1 btn-hero" disabled={isSubmitting}>
                      {isSubmitting ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 items-center">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Filtrer par projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.nom}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {project.nom}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredExpenses.length === 0 ? (
          <Card className="card-premium text-center py-12">
            <CardContent>
              <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune dépense</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par ajouter vos premières dépenses
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="card-premium hover-lift">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{expense.nom}</CardTitle>
                      <CardDescription>{expense.projects.nom}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Paiement mixte
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-success/5 rounded-lg border border-success/20">
                      <div className="text-sm text-muted-foreground">Déclaré</div>
                      <div className="text-xl font-bold text-success">
                        {expense.montant_declare.toLocaleString()} DH
                      </div>
                    </div>
                    <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
                      <div className="text-sm text-muted-foreground">Non déclaré</div>
                      <div className="text-xl font-bold text-warning">
                        {expense.montant_non_declare.toLocaleString()} DH
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-xl font-bold text-primary">
                        {expense.montant_total.toLocaleString()} DH
                      </div>
                    </div>
                  </div>
                  {expense.description && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <strong>Description:</strong> {expense.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Expenses;