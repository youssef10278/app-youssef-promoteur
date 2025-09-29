import { apiClient } from '@/integrations/api/client';
import { CompanyInfo } from '@/components/sales/CompanySettingsModal';

export interface CompanySettingsDB {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  footer_text: string | null;
  additional_info: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class CompanySettingsService {
  // Convertir CompanyInfo vers le format API
  private static toAPIFormat(companyInfo: CompanyInfo): any {
    return {
      name: companyInfo.name,
      address: companyInfo.address || null,
      phone: companyInfo.phone || null,
      email: companyInfo.email,
      website: companyInfo.website || null,
      footer_text: companyInfo.footerText || null,
      additional_info: companyInfo.additionalInfo || null
    };
  }

  // Convertir du format API vers CompanyInfo
  private static fromAPIFormat(apiSettings: CompanySettingsDB): CompanyInfo {
    return {
      name: apiSettings.name,
      address: apiSettings.address || '',
      phone: apiSettings.phone || '',
      email: apiSettings.email,
      website: apiSettings.website || '',
      footerText: apiSettings.footer_text || '',
      additionalInfo: apiSettings.additional_info || ''
    };
  }

  // Récupérer les paramètres par défaut de l'utilisateur
  static async getDefaultSettings(): Promise<CompanyInfo | null> {
    try {
      const response = await apiClient.getDefaultCompanySettings();

      if (response.success && response.data) {
        return this.fromAPIFormat(response.data);
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return null;
    }
  }

  // Sauvegarder les paramètres
  static async saveSettings(companyInfo: CompanyInfo): Promise<boolean> {
    try {
      const apiData = this.toAPIFormat(companyInfo);
      const response = await apiClient.saveCompanySettings(apiData);

      if (response.success) {
        console.log('Paramètres d\'entreprise sauvegardés avec succès');
        return true;
      } else {
        console.error('Erreur lors de la sauvegarde:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  }

  // Supprimer les paramètres (réinitialisation)
  static async deleteSettings(): Promise<boolean> {
    try {
      const response = await apiClient.deleteCompanySettings();

      if (response.success) {
        console.log('Paramètres d\'entreprise supprimés avec succès');
        return true;
      } else {
        console.error('Erreur lors de la suppression:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des paramètres:', error);
      return false;
    }
  }

  // Récupérer tous les paramètres de l'utilisateur (pour le futur support multi-entreprises)
  static async getAllSettings(): Promise<CompanyInfo[]> {
    try {
      const response = await apiClient.getAllCompanySettings();

      if (response.success && response.data) {
        return response.data.map((settings: CompanySettingsDB) => this.fromAPIFormat(settings));
      }

      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les paramètres:', error);
      return [];
    }
  }

  // Vérifier si l'utilisateur a des paramètres sauvegardés
  static async hasSettings(): Promise<boolean> {
    try {
      const response = await apiClient.hasCompanySettings();

      if (response.success && response.data) {
        return response.data.exists;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification des paramètres:', error);
      return false;
    }
  }
}
