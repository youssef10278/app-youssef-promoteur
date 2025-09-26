import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateProject = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const projectData = {
      user_id: user?.id,
      nom: formData.get('nom') as string,
      localisation: formData.get('localisation') as string,
      societe: formData.get('societe') as string,
      surface_totale: parseFloat(formData.get('surface_totale') as string),
      nombre_lots: parseInt(formData.get('nombre_lots') as string),
      nombre_appartements: parseInt(formData.get('nombre_appartements') as string) || 0,
      nombre_garages: parseInt(formData.get('nombre_garages') as string) || 0,
    };

    try {
      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Projet créé avec succès",
      });

      navigate('/projects');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
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
          <div className="flex items-center space-x-4">
            <Link to="/projects">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nouveau Projet</h1>
                <p className="text-primary-foreground/80">
                  Créer un nouveau projet immobilier
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Informations du Projet</CardTitle>
            <CardDescription>
              Remplissez les détails de votre nouveau projet immobilier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du Projet *</Label>
                  <Input
                    id="nom"
                    name="nom"
                    placeholder="Ex: Résidence Al Andalous"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localisation">Localisation *</Label>
                  <Input
                    id="localisation"
                    name="localisation"
                    placeholder="Ex: Casablanca, Ain Diab"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="societe">Société Utilisée *</Label>
                  <Input
                    id="societe"
                    name="societe"
                    placeholder="Ex: SARL Al Omrane"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surface_totale">Surface Totale (m²) *</Label>
                  <Input
                    id="surface_totale"
                    name="surface_totale"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_lots">Nombre de Lots *</Label>
                  <Input
                    id="nombre_lots"
                    name="nombre_lots"
                    type="number"
                    placeholder="Ex: 20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_appartements">Nombre d'Appartements</Label>
                  <Input
                    id="nombre_appartements"
                    name="nombre_appartements"
                    type="number"
                    placeholder="Ex: 15"
                    defaultValue="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_garages">Nombre de Garages</Label>
                  <Input
                    id="nombre_garages"
                    name="nombre_garages"
                    type="number"
                    placeholder="Ex: 20"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Link to="/projects" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 btn-hero" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Création..." : "Créer le Projet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateProject;