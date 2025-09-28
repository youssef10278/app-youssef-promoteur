import React, { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { UnitSelector } from './UnitSelector';
import { ClientForm } from './ClientForm';
import { PriceConfigForm } from './PriceConfigForm';
import { FirstPaymentForm } from './FirstPaymentForm';
import { Project, PropertyType, SaleFormData as SaleFormDataType } from '@/types/sale-new';
import { generateAvailableUnits, getAvailableUnitsForType } from '@/utils/inventory';
import { SalesService } from '@/services/salesService';
import { useToast } from '@/components/ui/use-toast';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProject: Project | null;
  onSaleCreated: () => void;
}

interface SaleFormData {
  // Étape 1: Sélection d'unité
  type_propriete: PropertyType | '';
  unite_numero: string;

  // Étape 2: Informations client
  client_nom: string;
  client_telephone: string;
  client_email: string;
  client_adresse: string;

  // Étape 3: Prix et conditions
  surface: number;
  prix_total: number;
  description: string;

  // Étape 4: Premier paiement
  premier_paiement: {
    montant: number;
    montant_declare: number;
    montant_non_declare: number;
    date_paiement: string;
    mode_paiement: 'espece' | 'cheque' | 'cheque_espece' | 'virement';
    // Pour les chèques
    montant_cheque?: number;
    montant_espece?: number;
    cheques?: Array<{
      numero: string;
      banque: string;
      montant: number;
      date_echeance: string;
    }>;
    // Pour virement
    reference_virement?: string;
    notes?: string;
  };
}

const STEPS = [
  { id: 1, title: 'Sélection d\'unité', description: 'Choisir le type et l\'unité à vendre' },
  { id: 2, title: 'Informations client', description: 'Saisir les coordonnées du client' },
  { id: 3, title: 'Prix et conditions', description: 'Définir le prix et la description' },
  { id: 4, title: 'Premier paiement', description: 'Enregistrer le premier paiement du client' }
];

export function NewSaleModal({ isOpen, onClose, selectedProject, onSaleCreated }: NewSaleModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableUnits, setAvailableUnits] = useState<Record<PropertyType, Array<{numero: string; surface?: number; disponible: boolean}>>>({
    appartement: [],
    garage: []
  });

  const [formData, setFormData] = useState<SaleFormData>({
    type_propriete: '',
    unite_numero: '',
    client_nom: '',
    client_telephone: '',
    client_email: '',
    client_adresse: '',
    surface: 0,
    prix_total: 0,
    description: '',
    premier_paiement: {
      montant: 0,
      montant_declare: 0,
      montant_non_declare: 0,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      cheques: []
    }
  });

  // Générer les unités disponibles quand le projet change
  useEffect(() => {
    const loadAvailableUnits = async () => {
      if (selectedProject) {
        try {
          // Récupérer les vraies ventes existantes depuis la base de données
          const existingSales = await SalesService.getSoldUnits(selectedProject.id);
          const inventory = generateAvailableUnits(selectedProject, existingSales);

          // Convertir l'inventaire au format attendu par UnitSelector
          const formattedUnits: Record<PropertyType, Array<{numero: string; surface?: number; disponible: boolean}>> = {
            appartement: inventory.appartements.disponibles.map(numero => ({ numero, disponible: true })),
            garage: inventory.garages.disponibles.map(numero => ({ numero, disponible: true })),
            villa: inventory.villas.disponibles.map(numero => ({ numero, disponible: true })),
            terrain: inventory.terrains.disponibles.map(numero => ({ numero, disponible: true })),
            local_commercial: inventory.locaux_commerciaux.disponibles.map(numero => ({ numero, disponible: true }))
          };

          setAvailableUnits(formattedUnits);
        } catch (error) {
          console.error('Erreur lors du chargement des unités disponibles:', error);
          // En cas d'erreur, utiliser un inventaire vide par sécurité
          setAvailableUnits({
            appartement: [],
            garage: [],
            villa: [],
            terrain: [],
            local_commercial: []
          });
        }
      }
    };

    loadAvailableUnits();
  }, [selectedProject]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.type_propriete) newErrors.type_propriete = 'Veuillez sélectionner un type de propriété';
        if (!formData.unite_numero) newErrors.unite_numero = 'Veuillez sélectionner une unité';
        break;

      case 2:
        if (!formData.client_nom.trim()) newErrors.client_nom = 'Le nom du client est requis';
        if (formData.client_email && !/\S+@\S+\.\S+/.test(formData.client_email)) {
          newErrors.client_email = 'Format d\'email invalide';
        }
        break;

      case 3:
        if (formData.surface <= 0) newErrors.surface = 'La surface doit être supérieure à 0';
        if (formData.prix_total <= 0) newErrors.prix_total = 'Le prix total doit être supérieur à 0';
        if (!formData.description.trim()) newErrors.description = 'La description est requise';
        break;

      case 4:
        if (!formData.premier_paiement.montant || formData.premier_paiement.montant <= 0) {
          newErrors.montant = 'Le montant du premier paiement est requis';
        }
        if (!formData.premier_paiement.date_paiement) {
          newErrors.date_paiement = 'La date de paiement est requise';
        }
        if (formData.premier_paiement.montant > formData.prix_total) {
          newErrors.montant = 'Le montant ne peut pas dépasser le prix total';
        }
        // Validation des montants principal/autre montant
        const totalDeclare = (formData.premier_paiement.montant_declare || 0) + (formData.premier_paiement.montant_non_declare || 0);
        if (Math.abs(totalDeclare - formData.premier_paiement.montant) > 0.01) {
          newErrors.montant_declare = 'La somme des montants principal et autre montant doit égaler le montant total';
        }
        if (formData.premier_paiement.montant_declare < 0) {
          newErrors.montant_declare = 'Le montant principal ne peut pas être négatif';
        }
        if (formData.premier_paiement.montant_non_declare < 0) {
          newErrors.montant_non_declare = 'L\'autre montant ne peut pas être négatif';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // Vérifier que l'unité est toujours disponible avant de créer la vente
      const isAvailable = await SalesService.isUnitAvailable(
        selectedProject!.id,
        formData.unite_numero
      );

      if (!isAvailable) {
        toast({
          title: "Unité non disponible",
          description: `L'unité ${formData.unite_numero} a déjà été vendue. Veuillez choisir une autre unité.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Préparer les données pour l'API
      const saleData: SaleFormDataType = {
        project_id: selectedProject!.id,
        type_propriete: formData.type_propriete as PropertyType,
        unite_numero: formData.unite_numero,
        client_nom: formData.client_nom,
        client_telephone: formData.client_telephone,
        client_email: formData.client_email,
        client_adresse: formData.client_adresse,
        surface: formData.surface,
        prix_total: formData.prix_total,
        description: formData.description,
        premier_paiement: {
          montant: formData.premier_paiement.montant,
          montant_declare: formData.premier_paiement.montant_declare,
          montant_non_declare: formData.premier_paiement.montant_non_declare,
          date_paiement: formData.premier_paiement.date_paiement,
          mode_paiement: formData.premier_paiement.mode_paiement,
          montant_espece: formData.premier_paiement.montant_espece || 0,
          montant_cheque: formData.premier_paiement.montant_cheque || 0,
          notes: formData.premier_paiement.notes,
          cheques: formData.premier_paiement.cheques || []
        }
      };

      console.log('Creating sale:', saleData);

      // Créer la vente via le service
      await SalesService.createSale(saleData);

      // Notifier le succès
      toast({
        title: "Vente créée avec succès",
        description: `La vente de ${formData.unite_numero} à ${formData.client_nom} a été enregistrée.`,
      });

      onSaleCreated();
    } catch (error) {
      console.error('Error creating sale:', error);
      setErrors({ submit: 'Erreur lors de la création de la vente: ' + (error as Error).message });
      toast({
        title: "Erreur",
        description: "Impossible de créer la vente. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (!selectedProject) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Nouvelle Vente</DialogTitle>
          <DialogDescription>Aucun projet sélectionné</DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Veuillez d'abord sélectionner un projet pour créer une vente.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <span>Nouvelle Vente</span>
          <Badge variant="outline">{selectedProject.nom}</Badge>
        </DialogTitle>
        <DialogDescription>
          {STEPS[currentStep - 1].description}
        </DialogDescription>
      </DialogHeader>

      {/* Indicateur de progression */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Étape {currentStep} sur {STEPS.length}</span>
          <span>{Math.round(progress)}% complété</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center space-x-1 text-xs ${
                step.id === currentStep
                  ? 'text-primary font-medium'
                  : step.id < currentStep
                  ? 'text-success'
                  : 'text-muted-foreground'
              }`}
            >
              {step.id < currentStep ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <div className={`w-3 h-3 rounded-full border-2 ${
                  step.id === currentStep ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`} />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <UnitSelector
            projectId={selectedProject.id}
            selectedType={formData.type_propriete}
            onTypeChange={(type) => setFormData(prev => ({ ...prev, type_propriete: type, unite_numero: '' }))}
            selectedUnit={formData.unite_numero}
            onUnitChange={(unit) => setFormData(prev => ({ ...prev, unite_numero: unit }))}
            availableUnits={availableUnits}
          />
        )}

        {currentStep === 2 && (
          <ClientForm
            clientData={{
              nom: formData.client_nom,
              telephone: formData.client_telephone,
              email: formData.client_email,
              adresse: formData.client_adresse
            }}
            onClientDataChange={(data) => setFormData(prev => ({
              ...prev,
              client_nom: data.nom,
              client_telephone: data.telephone,
              client_email: data.email,
              client_adresse: data.adresse
            }))}
            errors={errors}
          />
        )}

        {currentStep === 3 && (
          <PriceConfigForm
            priceData={{
              surface: formData.surface,
              prix_total: formData.prix_total,
              description: formData.description
            }}
            onPriceDataChange={(data) => setFormData(prev => ({
              ...prev,
              surface: data.surface,
              prix_total: data.prix_total,
              description: data.description
            }))}
            selectedUnit={formData.unite_numero}
            errors={errors}
          />
        )}

        {currentStep === 4 && (
          <FirstPaymentForm
            data={formData.premier_paiement}
            onChange={(data) => setFormData(prev => ({ ...prev, premier_paiement: data }))}
            prixTotal={formData.prix_total}
            errors={errors}
          />
        )}
      </div>

      {/* Erreurs globales */}
      {errors.submit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {currentStep < STEPS.length ? (
            <Button onClick={nextStep} className="btn-hero">
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="btn-hero"
            >
              {isSubmitting ? 'Création...' : 'Créer la vente'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
