import { useState, useEffect } from 'react';
import { CompanyInfo } from '@/components/sales/CompanySettingsModal';
import { CompanySettingsService } from '@/services/companySettingsService';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'realtysimplify_company_settings';

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "RealtySimplify Hub",
  address: "Adresse de l'entreprise",
  phone: "Téléphone de l'entreprise",
  email: "email@entreprise.com",
  website: "www.entreprise.com",
  footerText: "Pour toute question, contactez-nous",
  additionalInfo: ""
};

export const useCompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Charger les paramètres depuis Supabase au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const savedSettings = await CompanySettingsService.getDefaultSettings();

        if (savedSettings) {
          // Fusionner avec les valeurs par défaut pour s'assurer que tous les champs existent
          setCompanyInfo({
            ...DEFAULT_COMPANY_INFO,
            ...savedSettings
          });
        } else {
          // Aucun paramètre sauvegardé, utiliser les valeurs par défaut
          setCompanyInfo(DEFAULT_COMPANY_INFO);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de l\'entreprise:', error);
        // En cas d'erreur, utiliser les valeurs par défaut
        setCompanyInfo(DEFAULT_COMPANY_INFO);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les paramètres de l'entreprise. Valeurs par défaut utilisées.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  // Sauvegarder les paramètres dans Supabase
  const saveCompanyInfo = async (newCompanyInfo: CompanyInfo) => {
    try {
      const success = await CompanySettingsService.saveSettings(newCompanyInfo);
      if (success) {
        setCompanyInfo(newCompanyInfo);
        toast({
          title: "Paramètres sauvegardés",
          description: "Les informations de l'entreprise ont été mises à jour.",
        });
        return true;
      } else {
        toast({
          title: "Erreur de sauvegarde",
          description: "Impossible de sauvegarder les paramètres. Veuillez réessayer.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de l\'entreprise:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefault = async () => {
    try {
      const success = await CompanySettingsService.deleteSettings();
      if (success) {
        setCompanyInfo(DEFAULT_COMPANY_INFO);
        toast({
          title: "Paramètres réinitialisés",
          description: "Les paramètres ont été remis aux valeurs par défaut.",
        });
        return true;
      } else {
        toast({
          title: "Erreur de réinitialisation",
          description: "Impossible de réinitialiser les paramètres.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des paramètres:', error);
      toast({
        title: "Erreur de réinitialisation",
        description: "Une erreur est survenue lors de la réinitialisation.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Exporter les paramètres (pour sauvegarde/partage)
  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(companyInfo, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `company_settings_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'export des paramètres:', error);
      return false;
    }
  };

  // Importer les paramètres depuis un fichier
  const importSettings = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importedSettings = JSON.parse(content);
            
            // Valider que les champs obligatoires sont présents
            if (!importedSettings.name || !importedSettings.email) {
              console.error('Fichier invalide: champs obligatoires manquants');
              resolve(false);
              return;
            }
            
            // Fusionner avec les valeurs par défaut
            const mergedSettings = {
              ...DEFAULT_COMPANY_INFO,
              ...importedSettings
            };
            
            const success = saveCompanyInfo(mergedSettings);
            resolve(success);
          } catch (parseError) {
            console.error('Erreur lors du parsing du fichier:', parseError);
            resolve(false);
          }
        };
        
        reader.onerror = () => {
          console.error('Erreur lors de la lecture du fichier');
          resolve(false);
        };
        
        reader.readAsText(file);
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        resolve(false);
      }
    });
  };

  // Valider les paramètres
  const validateCompanyInfo = (info: CompanyInfo): string[] => {
    const errors: string[] = [];
    
    if (!info.name?.trim()) {
      errors.push('Le nom de l\'entreprise est obligatoire');
    }
    
    if (!info.email?.trim()) {
      errors.push('L\'email est obligatoire');
    } else if (!info.email.includes('@')) {
      errors.push('L\'email doit être valide');
    }
    
    if (!info.phone?.trim()) {
      errors.push('Le téléphone est recommandé');
    }
    
    if (!info.address?.trim()) {
      errors.push('L\'adresse est recommandée');
    }
    
    return errors;
  };

  // Obtenir un résumé des paramètres
  const getSettingsSummary = () => {
    return {
      hasCustomSettings: JSON.stringify(companyInfo) !== JSON.stringify(DEFAULT_COMPANY_INFO),
      isComplete: companyInfo.name && companyInfo.email && companyInfo.phone && companyInfo.address,
      lastModified: localStorage.getItem(STORAGE_KEY + '_timestamp') || 'Jamais',
      fieldsCount: Object.keys(companyInfo).filter(key => companyInfo[key as keyof CompanyInfo]).length
    };
  };

  // Marquer la timestamp de dernière modification
  const updateTimestamp = () => {
    try {
      localStorage.setItem(STORAGE_KEY + '_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Erreur lors de la mise à jour du timestamp:', error);
    }
  };

  // Sauvegarder avec timestamp
  const saveWithTimestamp = (newCompanyInfo: CompanyInfo) => {
    const success = saveCompanyInfo(newCompanyInfo);
    if (success) {
      updateTimestamp();
    }
    return success;
  };

  return {
    companyInfo,
    isLoading,
    saveCompanyInfo: saveWithTimestamp,
    resetToDefault,
    exportSettings,
    importSettings,
    validateCompanyInfo,
    getSettingsSummary,
    defaultCompanyInfo: DEFAULT_COMPANY_INFO
  };
};
