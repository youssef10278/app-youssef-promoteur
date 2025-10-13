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
  Receipt, 
  Building2, 
  FileText,
  AlertTriangle,
  Save,
  X,
  Plus
} from 'lucide-react';
import { SimpleExpenseFormData } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface CreateSimpleExpenseModalProps {
  projects: Array<{ id: string; nom: string }>;
  selectedProjectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSimpleExpenseModal: React.FC<CreateSimpleExpenseModalProps> = ({
  projects,
  selectedProjectId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<SimpleExpenseFormData>({
    project_id: selectedProjectId || '',
    nom: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      project_id: selectedProjectId || '',
      nom: '',
      description: '',
    });
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.project_id) {
      errors.push('Veuillez sélectionner un projet');
    }

    if (!formData.nom.trim()) {
      errors.push('Le nom de la dépense est obligatoire');
    }

    if (formData.nom.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (formData.nom.trim().length > 200) {
      errors.push('Le nom ne peut pas dépasser 200 caractères');
    }

    if (formData.description.length > 1000) {
      errors.push('La description ne peut pas dépasser 1000 caractères');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/expenses/create-simple', formData);

      if (response.success) {
        toast({
          title: "Dépense créée",
          description: "La dépense a été créée avec succès. Vous pouvez maintenant ajouter des paiements.",
        });

        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Erreur lors de la création de la dépense');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la dépense:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la dépense';
      
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Nouvelle Dépense</span>
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle dépense. Vous pourrez ajouter des paiements progressivement par la suite.
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
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Informations de Base</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection du projet */}
              <div className="space-y-2">
                <Label htmlFor="project_id">Projet *</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                  disabled={!!selectedProjectId}
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

              {/* Nom de la dépense */}
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la dépense *</Label>
                <Input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Plombier, Électricien, Matériaux..."
                  required
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  Nom descriptif de la dépense (ex: "Plombier", "Matériaux cuisine")
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée de la dépense..."
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-sm text-muted-foreground">
                  Description optionnelle pour plus de détails
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information sur le nouveau système */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Plus className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Nouveau système de paiements</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Après création, vous pourrez ajouter des paiements progressivement selon vos besoins.
                    Le montant total sera calculé automatiquement.
                  </p>
                </div>
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
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la Dépense
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSimpleExpenseModal;
