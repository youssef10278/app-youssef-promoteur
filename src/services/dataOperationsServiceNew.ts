import { apiClient } from '../integrations/api/client';

// Types pour les opérations de données
export type DataType = 'global' | 'projects' | 'sales' | 'expenses' | 'checks' | 'payments';
export type OperationType = 'export' | 'import';
export type OperationStatus = 'pending' | 'completed' | 'failed';
export type DuplicateStrategy = 'ignore' | 'replace' | 'create_new';
export type ExportFormat = 'json' | 'csv';

export interface DataOperation {
  id: string;
  user_id: string;
  operation_type: OperationType;
  data_type: DataType;
  file_name?: string;
  file_size?: number;
  records_count?: number;
  status: OperationStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationResponse {
  valid: boolean;
  records_count: number;
  errors: string[];
  warnings: string[];
  sample_data?: any[];
}

export interface ImportResponse {
  success: boolean;
  operation_id: string;
  records_imported: number;
  records_skipped: number;
  records_failed: number;
  errors: string[];
}

export interface ExportResponse {
  success: boolean;
  operation_id: string;
  download_url: string;
  records_count: number;
  file_size: number;
}

// Utilitaire pour convertir un fichier en base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Enlever le préfixe "data:type/subtype;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export class DataOperationsService {
  /**
   * Valider un fichier d'import
   */
  static async validateImport(file: File, dataType: DataType): Promise<ValidationResponse> {
    try {
      console.log('🔍 validateImport appelé avec:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        dataType
      });

      // Convertir le fichier en base64
      const fileContent = await fileToBase64(file);

      console.log('📤 Fichier converti en base64, taille:', fileContent.length);

      // Envoyer la requête avec le contenu base64
      const response = await apiClient.post('/data/validate', {
        file_content: fileContent,
        file_name: file.name,
        data_type: dataType
      });

      console.log('✅ Réponse complète validation:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.data) {
        console.warn('⚠️ Structure de réponse validation inattendue:', response.data);
        return {
          valid: false,
          records_count: 0,
          errors: ['Structure de réponse invalide'],
          warnings: []
        };
      }

      const validationData = response.data.data;
      console.log('✅ Données validation extraites:', validationData);

      // Vérifier que les propriétés existent
      if (typeof validationData.valid === 'undefined') {
        console.warn('⚠️ Propriété valid manquante:', validationData);
        return {
          valid: false,
          records_count: validationData.records_count || 0,
          errors: validationData.errors || ['Validation échouée'],
          warnings: validationData.warnings || []
        };
      }

      return validationData;
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      // Retourner une structure d'erreur plutôt que de throw
      return {
        valid: false,
        records_count: 0,
        errors: [`Erreur de validation: ${(error as Error).message}`],
        warnings: []
      };
    }
  }

  /**
   * Importer des données
   */
  static async importData(
    file: File, 
    dataType: DataType, 
    duplicateStrategy: DuplicateStrategy = 'ignore'
  ): Promise<ImportResponse> {
    try {
      console.log('📥 importData appelé avec:', {
        fileName: file.name,
        fileSize: file.size,
        dataType,
        duplicateStrategy
      });

      // Convertir le fichier en base64
      const fileContent = await fileToBase64(file);
      
      console.log('📤 Fichier converti en base64, envoi de l\'import...');

      // Envoyer la requête d'import
      const response = await apiClient.post('/data/import', {
        file_content: fileContent,
        file_name: file.name,
        data_type: dataType,
        duplicate_strategy: duplicateStrategy
      });

      console.log('✅ Réponse complète import:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.data) {
        console.warn('⚠️ Structure de réponse import inattendue:', response.data);
        throw new Error('Structure de réponse invalide');
      }

      const importData = response.data.data;
      console.log('✅ Données import extraites:', importData);

      return importData;
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      throw error;
    }
  }

  /**
   * Export global de toutes les données
   */
  static async exportGlobal(format: ExportFormat = 'json'): Promise<ExportResponse> {
    try {
      console.log('📤 Export global demandé, format:', format);

      const response = await apiClient.post('/data/export', {
        data_types: ['projects', 'sales', 'expenses', 'checks', 'payments'],
        format,
        include_metadata: true
      });
      
      console.log('✅ Réponse complète export global:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.data) {
        console.warn('⚠️ Structure de réponse export inattendue:', response.data);
        throw new Error('Structure de réponse invalide');
      }

      const exportData = response.data.data;
      console.log('✅ Données export extraites:', exportData);

      return exportData;
    } catch (error) {
      console.error('❌ Erreur lors de l\'export global:', error);
      throw error;
    }
  }

  /**
   * Export sélectif par types de données
   */
  static async exportSelective(
    dataTypes: DataType[], 
    format: ExportFormat = 'csv'
  ): Promise<ExportResponse> {
    try {
      console.log('📤 Export sélectif demandé:', { dataTypes, format });

      const response = await apiClient.post('/data/export', {
        data_types: dataTypes,
        format,
        include_metadata: false
      });
      
      console.log('✅ Réponse complète export sélectif:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.data) {
        console.warn('⚠️ Structure de réponse export sélectif inattendue:', response.data);
        throw new Error('Structure de réponse invalide');
      }

      const exportData = response.data.data;
      console.log('✅ Données export sélectif extraites:', exportData);

      return exportData;
    } catch (error) {
      console.error('❌ Erreur lors de l\'export sélectif:', error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier d'export
   */
  static async downloadExport(operationId: string): Promise<void> {
    try {
      console.log('⬇️ Téléchargement demandé pour:', operationId);

      // Utiliser window.open pour déclencher le téléchargement
      const downloadUrl = `${apiClient.defaults.baseURL}/data/download/${operationId}`;
      window.open(downloadUrl, '_blank');
      
      console.log('✅ Téléchargement initié');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des opérations
   */
  static async getOperations(page: number = 1, limit: number = 20): Promise<{
    operations: DataOperation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      console.log('📋 Récupération historique:', { page, limit });

      const response = await apiClient.get('/data/operations', {
        params: { page, limit }
      });

      console.log('✅ Réponse complète:', response.data);

      // Vérifier la structure de la réponse
      if (!response.data || !response.data.data) {
        console.warn('⚠️ Structure de réponse inattendue:', response.data);
        return {
          operations: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        };
      }

      const data = response.data.data;
      console.log('✅ Données extraites:', data);

      // Vérifier que les opérations existent
      if (!data.operations) {
        console.warn('⚠️ Pas d\'opérations dans la réponse:', data);
        return {
          operations: [],
          pagination: data.pagination || {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        };
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      // Retourner une structure vide plutôt que de throw
      return {
        operations: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      };
    }
  }

  /**
   * Récupérer les statistiques des opérations
   */
  static async getStats(): Promise<any[]> {
    try {
      console.log('📊 Récupération statistiques');

      const response = await apiClient.get('/data/stats');

      console.log('✅ Statistiques récupérées:', response.data.data);
      return response.data.data.statistics;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Test de la base de données (debug)
   */
  static async testDatabase(): Promise<any> {
    try {
      console.log('🧪 Test de la base de données');

      const response = await apiClient.get('/data/test-db');

      console.log('✅ Test DB terminé:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur lors du test DB:', error);
      throw error;
    }
  }
}
