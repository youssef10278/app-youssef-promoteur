import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, ArrowLeft, Building2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  nom: string;
}

interface CheckRecord {
  id: string;
  type_cheque: string;
  montant: number;
  numero_cheque: string;
  nom_beneficiaire: string;
  nom_emetteur: string;
  date_emission: string;
  date_encaissement: string;
  facture_recue: boolean;
  description: string;
  projects?: { nom: string } | null;
}

const Checks = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchChecks();
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

  const fetchChecks = async () => {
    try {
      const { data, error } = await supabase
        .from('checks')
        .select(`
          *,
          projects(nom)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChecks(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les chèques",
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
    const checkData = {
      user_id: user?.id,
      project_id: formData.get('project_id') as string === 'none' ? null : formData.get('project_id') as string,
      type_cheque: formData.get('type_cheque') as 'recu' | 'donne',
      montant: parseFloat(formData.get('montant') as string),
      numero_cheque: formData.get('numero_cheque') as string,
      nom_beneficiaire: formData.get('nom_beneficiaire') as string || null,
      nom_emetteur: formData.get('nom_emetteur') as string || null,
      date_emission: formData.get('date_emission') as string,
      date_encaissement: formData.get('date_encaissement') as string || null,
      description: formData.get('description') as string,
      facture_recue: false,
    };

    try {
      const { error } = await supabase
        .from('checks')
        .insert([checkData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Chèque ajouté avec succès",
      });

      setIsDialogOpen(false);
      fetchChecks();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le chèque",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFactureRecue = async (checkId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('checks')
        .update({ facture_recue: !currentValue })
        .eq('id', checkId);

      if (error) throw error;

      setChecks(checks.map(check => 
        check.id === checkId 
          ? { ...check, facture_recue: !currentValue }
          : check
      ));

      toast({
        title: "Succès",
        description: `Statut facture mis à jour`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const receivedChecks = checks.filter(check => check.type_cheque === 'recu');
  const givenChecks = checks.filter(check => check.type_cheque === 'donne');

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
                <h1 className="text-2xl font-bold">Gestion des Chèques</h1>
                <p className="text-primary-foreground/80">
                  Suivez vos chèques reçus et donnés
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-secondary-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Chèque
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau Chèque</DialogTitle>
                  <DialogDescription>
                    Enregistrer un nouveau chèque
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type_cheque">Type de chèque *</Label>
                    <Select name="type_cheque" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recu">Chèque reçu (Vente)</SelectItem>
                        <SelectItem value="donne">Chèque donné (Dépense)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_id">Projet (optionnel)</Label>
                    <Select name="project_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun projet</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="montant">Montant (DH) *</Label>
                      <Input
                        id="montant"
                        name="montant"
                        type="number"
                        step="0.01"
                        placeholder="50000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero_cheque">Numéro de chèque</Label>
                      <Input
                        id="numero_cheque"
                        name="numero_cheque"
                        placeholder="123456"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom_beneficiaire">Nom du bénéficiaire</Label>
                    <Input
                      id="nom_beneficiaire"
                      name="nom_beneficiaire"
                      placeholder="Nom de la personne/société"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom_emetteur">Nom de l'émetteur</Label>
                    <Input
                      id="nom_emetteur"
                      name="nom_emetteur"
                      placeholder="Nom de la personne/société"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_emission">Date d'émission *</Label>
                      <Input
                        id="date_emission"
                        name="date_emission"
                        type="date"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_encaissement">Date d'encaissement</Label>
                      <Input
                        id="date_encaissement"
                        name="date_encaissement"
                        type="date"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Détails du chèque"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Chèques Reçus ({receivedChecks.length})</TabsTrigger>
            <TabsTrigger value="given">Chèques Donnés ({givenChecks.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="space-y-4">
            {receivedChecks.length === 0 ? (
              <Card className="card-premium text-center py-12">
                <CardContent>
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun chèque reçu</h3>
                  <p className="text-muted-foreground">
                    Les chèques de vos clients apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedChecks.map((check) => (
                  <Card key={check.id} className="card-premium hover-lift">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-success" />
                            {check.montant.toLocaleString()} DH
                          </CardTitle>
                          <CardDescription>
                            {check.projects?.nom || 'Général'} • N° {check.numero_cheque}
                          </CardDescription>
                        </div>
                        <Badge className="badge-success">
                          REÇU
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Émetteur</div>
                          <div className="font-semibold">{check.nom_emetteur || 'Non spécifié'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date d'émission</div>
                          <div className="font-semibold">{new Date(check.date_emission).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      
                      {check.description && (
                        <div className="text-sm">
                          <div className="text-muted-foreground">Description</div>
                          <div>{check.description}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="given" className="space-y-4">
            {givenChecks.length === 0 ? (
              <Card className="card-premium text-center py-12">
                <CardContent>
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun chèque donné</h3>
                  <p className="text-muted-foreground">
                    Les chèques donnés à vos fournisseurs apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {givenChecks.map((check) => (
                  <Card key={check.id} className="card-premium hover-lift">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-warning" />
                            {check.montant.toLocaleString()} DH
                          </CardTitle>
                          <CardDescription>
                            {check.projects?.nom || 'Général'} • N° {check.numero_cheque}
                          </CardDescription>
                        </div>
                        <Badge className="badge-warning">
                          DONNÉ
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Bénéficiaire</div>
                          <div className="font-semibold">{check.nom_beneficiaire || 'Non spécifié'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date d'émission</div>
                          <div className="font-semibold">{new Date(check.date_emission).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                        <Checkbox
                          id={`facture-${check.id}`}
                          checked={check.facture_recue}
                          onCheckedChange={() => toggleFactureRecue(check.id, check.facture_recue)}
                        />
                        <Label 
                          htmlFor={`facture-${check.id}`} 
                          className={`flex-1 cursor-pointer ${check.facture_recue ? 'text-success' : 'text-muted-foreground'}`}
                        >
                          {check.facture_recue ? (
                            <span className="flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              Facture reçue
                            </span>
                          ) : (
                            'Facture non reçue'
                          )}
                        </Label>
                      </div>
                      
                      {check.description && (
                        <div className="text-sm">
                          <div className="text-muted-foreground">Description</div>
                          <div>{check.description}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Checks;