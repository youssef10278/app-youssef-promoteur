import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Save,
  RotateCcw,
  Eye,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  footerText?: string;
  additionalInfo?: string;
}

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompanyInfo: CompanyInfo;
  onSave: (companyInfo: CompanyInfo) => Promise<boolean>;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "RealtySimplify Hub",
  address: "Adresse de l'entreprise",
  phone: "Téléphone de l'entreprise",
  email: "email@entreprise.com",
  website: "www.entreprise.com",
  footerText: "Pour toute question, contactez-nous",
  additionalInfo: ""
};

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  currentCompanyInfo,
  onSave
}) => {
  const [formData, setFormData] = useState<CompanyInfo>(currentCompanyInfo);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(currentCompanyInfo);
  }, [currentCompanyInfo]);

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation basique
    if (!formData.name.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le nom de l'entreprise est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_COMPANY_INFO);
    toast({
      title: "Paramètres réinitialisés",
      description: "Les valeurs par défaut ont été restaurées.",
    });
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Paramètres d'Impression</span>
          </DialogTitle>
          <DialogDescription>
            Personnalisez les informations de votre entreprise qui apparaîtront sur les documents imprimés
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Boutons d'action */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreview}
                className="flex items-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Masquer' : 'Aperçu'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Réinitialiser</span>
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs">
              Ces informations apparaîtront sur tous les documents imprimés
            </Badge>
          </div>

          {showPreview ? (
            /* Aperçu du document */
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-center text-blue-700">
                  Aperçu du Document d'Impression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-6 rounded border shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* En-tête */}
                  <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-2">
                      {formData.name || 'Nom de l\'entreprise'}
                    </h1>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{formData.address || 'Adresse de l\'entreprise'}</div>
                      <div>
                        Tél: {formData.phone || 'Téléphone'} | Email: {formData.email || 'email@entreprise.com'}
                      </div>
                      {formData.website && (
                        <div>Site web: {formData.website}</div>
                      )}
                      {formData.additionalInfo && (
                        <div className="text-xs mt-2">{formData.additionalInfo}</div>
                      )}
                    </div>
                  </div>

                  {/* Contenu exemple */}
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">HISTORIQUE DES PAIEMENTS</h2>
                    <div className="text-xs text-gray-500 mt-1">
                      Document généré le {new Date().toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-6">
                    [Contenu du document...]
                  </div>

                  {/* Pied de page */}
                  <div className="border-t border-gray-300 pt-4 text-xs text-gray-500 text-center">
                    <div>Ce document a été généré automatiquement par {formData.name}</div>
                    <div className="mt-1">
                      {formData.footerText || 'Pour toute question, contactez-nous'} au {formData.phone} ou {formData.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Formulaire de configuration */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Informations Principales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Nom de l'entreprise *</Label>
                    <Input
                      id="company-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nom de votre entreprise"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-address">Adresse</Label>
                    <Textarea
                      id="company-address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Adresse complète de l'entreprise"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-phone">Téléphone</Label>
                    <Input
                      id="company-phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company-email">Email *</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@entreprise.com"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Informations supplémentaires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Informations Supplémentaires</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company-website">Site web</Label>
                    <Input
                      id="company-website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="www.entreprise.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="footer-text">Texte du pied de page</Label>
                    <Textarea
                      id="footer-text"
                      value={formData.footerText || ''}
                      onChange={(e) => handleInputChange('footerText', e.target.value)}
                      placeholder="Message personnalisé pour le pied de page"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="additional-info">Informations additionnelles</Label>
                    <Textarea
                      id="additional-info"
                      value={formData.additionalInfo || ''}
                      onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                      placeholder="Numéro de registre, certifications, etc."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Boutons de validation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
