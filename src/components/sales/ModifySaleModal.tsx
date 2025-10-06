import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  DollarSign,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { Sale } from '@/types/sale-new';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/integrations/api/client';

interface ModifySaleModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SaleFormData {
  client_nom: string;
  client_telephone: string;
  client_email: string;
  client_adresse: string;
  unite_numero: string;
  surface: number;
  prix_total: number;
  description: string;
  statut: 'en_cours' | 'termine' | 'annule';
}

export function ModifySaleModal({ sale, isOpen, onClose, onSuccess }: ModifySaleModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SaleFormData>({
    client_nom: '',
    client_telephone: '',
    client_email: '',
    client_adresse: '',
    unite_numero: '',
    surface: 0,
    prix_total: 0,
    description: '',
    statut: 'en_cours'
  });

  // Initialiser le formulaire avec les données de la vente
  useEffect(() => {
    if (sale) {
      setFormData({
        client_nom: sale.client_nom || '',
        client_telephone: sale.client_telephone || '',
        client_email: sale.client_email || '',
        client_adresse: sale.client_adresse || '',
        unite_numero: sale.unite_numero || '',
        surface: sale.surface || 0,
        prix_total: sale.prix_total || 0,
        description: sale.description || '',
        statut: sale.statut || 'en_cours'
      });
    }
  }, [sale]);

  const handleInputChange = (field: keyof SaleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_nom.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom du client est obligatoire",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unite_numero.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le numéro d'unité est obligatoire",
        variant: "destructive",
      });
      return;
    }

    if (formData.surface <= 0) {
      toast({
        title: "Erreur de validation",
        description: "La surface doit être supérieure à 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.prix_total <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Le prix total doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔧 [ModifySaleModal] Modification de la vente:', sale.id);
      console.log('🔧 Données à modifier:', formData);

      const response = await apiClient.updateSale(sale.id, formData);
      
      if (response.success) {
        toast({
          title: "Vente modifiée",
          description: "Les informations de la vente ont été mises à jour avec succès",
        });

        onSuccess();
        onClose();
      } else {
        throw new Error(response.error || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      console.error('❌ [ModifySaleModal] Erreur lors de la modification:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la vente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_cours':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'termine':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span>Modifier les informations de la vente</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Informations Client</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_nom">Nom du client *</Label>
                  <Input
                    id="client_nom"
                    value={formData.client_nom}
                    onChange={(e) => handleInputChange('client_nom', e.target.value)}
                    placeholder="Nom complet du client"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_telephone">Téléphone</Label>
                  <Input
                    id="client_telephone"
                    value={formData.client_telephone}
                    onChange={(e) => handleInputChange('client_telephone', e.target.value)}
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="Adresse email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut de la vente</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => handleInputChange('statut', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_adresse">Adresse</Label>
                <Textarea
                  id="client_adresse"
                  value={formData.client_adresse}
                  onChange={(e) => handleInputChange('client_adresse', e.target.value)}
                  placeholder="Adresse complète du client"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations propriété */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Informations Propriété</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unite_numero">Numéro d'unité *</Label>
                  <Input
                    id="unite_numero"
                    value={formData.unite_numero}
                    onChange={(e) => handleInputChange('unite_numero', e.target.value)}
                    placeholder="Ex: A-101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface (m²) *</Label>
                  <Input
                    id="surface"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.surface}
                    onChange={(e) => handleInputChange('surface', parseFloat(e.target.value) || 0)}
                    placeholder="Surface en m²"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prix_total">Prix total (DH) *</Label>
                  <Input
                    id="prix_total"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.prix_total}
                    onChange={(e) => handleInputChange('prix_total', parseFloat(e.target.value) || 0)}
                    placeholder="Prix en DH"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description de la vente"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Statut actuel */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Statut actuel :</span>
                  {getStatusBadge(formData.statut)}
                </div>
                {formData.statut === 'annule' && (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Attention : Vente annulée</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Modification...' : 'Modifier la vente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
