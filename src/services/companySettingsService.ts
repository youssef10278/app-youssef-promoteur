import { supabase } from '@/integrations/supabase/client';
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
  // Convertir CompanyInfo vers le format DB
  private static toDBFormat(companyInfo: CompanyInfo, userId: string): Omit<CompanySettingsDB, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: userId,
      name: companyInfo.name,
      address: companyInfo.address || null,
      phone: companyInfo.phone || null,
      email: companyInfo.email,
      website: companyInfo.website || null,
      footer_text: companyInfo.footerText || null,
      additional_info: companyInfo.additionalInfo || null,
      is_default: true // Pour l'instant, on n'a qu'un seul paramètre par utilisateur
    };
  }

  // Convertir du format DB vers CompanyInfo
  private static fromDBFormat(dbSettings: CompanySettingsDB): CompanyInfo {
    return {
      name: dbSettings.name,
      address: dbSettings.address || '',
      phone: dbSettings.phone || '',
      email: dbSettings.email,
      website: dbSettings.website || '',
      footerText: dbSettings.footer_text || '',
      additionalInfo: dbSettings.additional_info || ''
    };
  }

  // Récupérer les paramètres par défaut de l'utilisateur
  static async getDefaultSettings(): Promise<CompanyInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Utilisateur non connecté');
        return null;
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Aucun enregistrement trouvé
          console.log('Aucun paramètre d\'entreprise trouvé pour cet utilisateur');
          return null;
        }
        throw error;
      }

      return this.fromDBFormat(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return null;
    }
  }

  // Sauvegarder les paramètres
  static async saveSettings(companyInfo: CompanyInfo): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Utilisateur non connecté');
        return false;
      }

      // Vérifier s'il existe déjà des paramètres par défaut
      const { data: existingSettings } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      const dbData = this.toDBFormat(companyInfo, user.id);

      if (existingSettings) {
        // Mettre à jour les paramètres existants
        const { error } = await supabase
          .from('company_settings')
          .update(dbData)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Créer de nouveaux paramètres
        const { error } = await supabase
          .from('company_settings')
          .insert([dbData]);

        if (error) throw error;
      }

      console.log('Paramètres d\'entreprise sauvegardés avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      return false;
    }
  }

  // Supprimer les paramètres (réinitialisation)
  static async deleteSettings(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Utilisateur non connecté');
        return false;
      }

      const { error } = await supabase
        .from('company_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('is_default', true);

      if (error) throw error;

      console.log('Paramètres d\'entreprise supprimés avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des paramètres:', error);
      return false;
    }
  }

  // Récupérer tous les paramètres de l'utilisateur (pour le futur support multi-entreprises)
  static async getAllSettings(): Promise<CompanyInfo[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Utilisateur non connecté');
        return [];
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(this.fromDBFormat);
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les paramètres:', error);
      return [];
    }
  }

  // Vérifier si l'utilisateur a des paramètres sauvegardés
  static async hasSettings(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Erreur lors de la vérification des paramètres:', error);
      return false;
    }
  }
}
