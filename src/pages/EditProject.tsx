import { useState, useEffect } from 'react';
import { Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/services/projectService';

const EditProject = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    localisation: '',
    societe: '',
    surface_totale: '',
    nombre_lots: '',
    nombre_appartements: '',
    nombre_garages: '',
    description: ''
  });

  // Charger les données du projet
  useEffect(() => {
    const loadProject = async () => {
      if (!id || !user) return;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/projects/${id}`);
        
        if (response.success && response.data) {
          const projectData = response.data;
          setProject(projectData);
          
          // Remplir le formulaire avec les données existantes
          setFormData({
            nom: projectData.nom || '',
            localisation: projectData.localisation || '',
            societe: projectData.societe || '',
            surface_totale: projectData.surface_totale?.toString() || '',
            nombre_lots: projectData.nombre_lots?.toString() || '',
            nombre_appartements: projectData.nombre_appartements?.toString() || '',
            nombre_garages: projectData.nombre_garages?.toString() || '',
            description: projectData.description || ''
          });
        } else {
          throw new Error('Projet non trouvé');
        }
      } catch (error: any) {
        console.error('❌ Erreur chargement projet:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du projet",
          variant: "destructive",
        });
        navigate('/projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, user, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    try {
      const projectData = {
        nom: formData.nom,
        localisation: formData.localisation,
        societe: formData.societe,
        surface_totale: parseFloat(formData.surface_totale) || 0,
        nombre_lots: parseInt(formData.nombre_lots) || 0,
        nombre_appartements: parseInt(formData.nombre_appartements) || 0,
        nombre_garages: parseInt(formData.nombre_garages) || 0,
        description: formData.description
      };

      console.log('📤 Mise à jour du projet:', projectData);
      const response = await apiClient.put(`/projects/${id}`, projectData);
      console.log('✅ Réponse backend:', response);

      toast({
        title: "Succès",
        description: "Projet modifié avec succès",
      });

      navigate('/projects');
    } catch (error: any) {
      console.error('❌ Erreur modification projet:', error);
      console.error('📋 Détails erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message || error.message || "Erreur inconnue";

      toast({
        title: "Erreur",
        description: `Impossible de modifier le projet: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {authLoading ? 'Vérification...' : 'Chargement du projet...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!project) {
    return <Navigate to="/projects" replace />;
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
                <h1 className="text-2xl font-bold">Modifier le Projet</h1>
                <p className="text-primary-foreground/80">
                  {project.nom}
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
              Modifiez les informations de votre projet immobilier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du projet *</Label>
                  <Input
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Ex: Résidence Les Jardins"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localisation">Localisation *</Label>
                  <Input
                    id="localisation"
                    name="localisation"
                    value={formData.localisation}
                    onChange={(e) => handleInputChange('localisation', e.target.value)}
                    placeholder="Ex: Casablanca, Maroc"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="societe">Société *</Label>
                <Input
                  id="societe"
                  name="societe"
                  value={formData.societe}
                  onChange={(e) => handleInputChange('societe', e.target.value)}
                  placeholder="Ex: Immobilier Plus SARL"
                  required
                />
              </div>

              {/* Données techniques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="surface_totale">Surface totale (m²) *</Label>
                  <Input
                    id="surface_totale"
                    name="surface_totale"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.surface_totale}
                    onChange={(e) => handleInputChange('surface_totale', e.target.value)}
                    placeholder="Ex: 2500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_lots">Nombre de lots *</Label>
                  <Input
                    id="nombre_lots"
                    name="nombre_lots"
                    type="number"
                    min="0"
                    value={formData.nombre_lots}
                    onChange={(e) => handleInputChange('nombre_lots', e.target.value)}
                    placeholder="Ex: 50"
                    required
                  />
                </div>
              </div>

              {/* Détail des unités */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre_appartements">Nombre d'appartements</Label>
                  <Input
                    id="nombre_appartements"
                    name="nombre_appartements"
                    type="number"
                    min="0"
                    value={formData.nombre_appartements}
                    onChange={(e) => handleInputChange('nombre_appartements', e.target.value)}
                    placeholder="Ex: 40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre_garages">Nombre de garages</Label>
                  <Input
                    id="nombre_garages"
                    name="nombre_garages"
                    type="number"
                    min="0"
                    value={formData.nombre_garages}
                    onChange={(e) => handleInputChange('nombre_garages', e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description du projet..."
                  rows={4}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link to="/projects">
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="btn-primary-gradient">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Modifier le Projet
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditProject;
