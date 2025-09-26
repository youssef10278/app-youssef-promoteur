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
import { Home, Plus, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  nom: string;
}

interface Sale {
  id: string;
  type_propriete: string;
  description: string;
  surface: number;
  prix_total: number;
  avance_declare: number;
  avance_non_declare: number;
  avance_total: number;
  projects: { nom: string };
}

const Sales = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchSales();
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

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          projects!inner(nom, user_id)
        `)
        .eq('projects.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes",
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
    const saleData = {
      project_id: formData.get('project_id') as string,
      type_propriete: formData.get('type_propriete') as 'appartement' | 'garage',
      description: formData.get('description') as string,
      surface: parseFloat(formData.get('surface') as string),
      prix_total: parseFloat(formData.get('prix_total') as string),
      avance_declare: parseFloat(formData.get('avance_declare') as string) || 0,
      avance_non_declare: parseFloat(formData.get('avance_non_declare') as string) || 0,
    };

    try {
      const { error } = await supabase
        .from('sales')
        .insert([saleData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Vente ajoutée avec succès",
      });

      setIsDialogOpen(false);
      fetchSales();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la vente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSales = selectedProject
    ? sales.filter(sale => sale.projects.nom === selectedProject)
    : sales;

  const calculateProgress = (sale: Sale) => {
    return sale.prix_total > 0 ? (sale.avance_total / sale.prix_total) * 100 : 0;
  };

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
                <h1 className="text-2xl font-bold">Gestion des Ventes</h1>
                <p className="text-primary-foreground/80">
                  Suivez vos ventes et avances reçues
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-secondary-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Vente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle Vente</DialogTitle>
                  <DialogDescription>
                    Enregistrer une nouvelle vente
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
                    <Label htmlFor="type_propriete">Type de propriété *</Label>
                    <Select name="type_propriete" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appartement">Appartement</SelectItem>
                        <SelectItem value="garage">Garage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Ex: Appartement 1er étage"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="surface">Surface (m²) *</Label>
                      <Input
                        id="surface"
                        name="surface"
                        type="number"
                        step="0.01"
                        placeholder="80"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prix_total">Prix total (DH) *</Label>
                      <Input
                        id="prix_total"
                        name="prix_total"
                        type="number"
                        step="0.01"
                        placeholder="500000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avance_declare">Avance déclarée (DH)</Label>
                      <Input
                        id="avance_declare"
                        name="avance_declare"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avance_non_declare">Avance non déclarée (DH)</Label>
                      <Input
                        id="avance_non_declare"
                        name="avance_non_declare"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
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
        {filteredSales.length === 0 ? (
          <Card className="card-premium text-center py-12">
            <CardContent>
              <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune vente</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par enregistrer vos premières ventes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="card-premium hover-lift">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        {sale.description}
                      </CardTitle>
                      <CardDescription>{sale.projects.nom}</CardDescription>
                    </div>
                    <Badge 
                      variant={sale.type_propriete === 'appartement' ? 'default' : 'secondary'}
                      className={sale.type_propriete === 'appartement' ? 'badge-success' : 'badge-warning'}
                    >
                      {sale.type_propriete.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Surface</div>
                      <div className="font-semibold">{sale.surface} m²</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Prix total</div>
                      <div className="font-semibold text-primary">{sale.prix_total.toLocaleString()} DH</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-success/5 rounded-lg border border-success/20">
                      <div className="text-sm text-muted-foreground">Avance déclarée</div>
                      <div className="text-lg font-bold text-success">
                        {sale.avance_declare.toLocaleString()} DH
                      </div>
                    </div>
                    <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
                      <div className="text-sm text-muted-foreground">Avance non déclarée</div>
                      <div className="text-lg font-bold text-warning">
                        {sale.avance_non_declare.toLocaleString()} DH
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="text-sm text-muted-foreground">Total avance</div>
                      <div className="text-lg font-bold text-primary">
                        {sale.avance_total.toLocaleString()} DH
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progression du paiement</span>
                      <span className="font-semibold">{calculateProgress(sale).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(calculateProgress(sale), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reste à payer: {(sale.prix_total - sale.avance_total).toLocaleString()} DH
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Sales;