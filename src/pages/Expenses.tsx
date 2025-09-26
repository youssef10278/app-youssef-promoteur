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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Plus, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  nom: string;
}

interface Expense {
  id: string;
  nom: string;
  montant_declare: number;
  montant_non_declare: number;
  montant_total: number;
  methode_paiement: string;
  description: string;
  projects: { nom: string };
}

const Expenses = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const expenseData = {
      project_id: formData.get('project_id') as string,
      nom: formData.get('nom') as string,
      montant_declare: parseFloat(formData.get('montant_declare') as string) || 0,
      montant_non_declare: parseFloat(formData.get('montant_non_declare') as string) || 0,
      methode_paiement: formData.get('methode_paiement') as 'cheque' | 'espece' | 'cheque_et_espece',
      description: formData.get('description') as string,
    };

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dépense ajoutée avec succès",
      });

      setIsDialogOpen(false);
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

  const filteredExpenses = selectedProject
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle Dépense</DialogTitle>
                  <DialogDescription>
                    Ajouter une nouvelle dépense à un projet
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project_id">Projet *</Label>
                    <Select name="project_id" required>
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
                      name="nom"
                      placeholder="Ex: Achat terrain"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="montant_declare">Montant déclaré (DH)</Label>
                      <Input
                        id="montant_declare"
                        name="montant_declare"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="montant_non_declare">Montant non déclaré (DH)</Label>
                      <Input
                        id="montant_non_declare"
                        name="montant_non_declare"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methode_paiement">Méthode de paiement *</Label>
                    <Select name="methode_paiement" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cheque">Chèque</SelectItem>
                        <SelectItem value="espece">Espèce</SelectItem>
                        <SelectItem value="cheque_et_espece">Chèque et Espèce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Détails additionnels"
                    />
                  </div>

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
              <SelectItem value="">Tous les projets</SelectItem>
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
                    <Badge 
                      variant={expense.methode_paiement === 'cheque' ? 'default' : 'secondary'}
                      className={expense.methode_paiement === 'cheque' ? 'badge-success' : 'badge-warning'}
                    >
                      {expense.methode_paiement.replace('_', ' ').toUpperCase()}
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