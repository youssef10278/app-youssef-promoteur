import { apiClient } from '@/integrations/api/client';
import {
  DataOperation,
  ExportRequest,
  ImportRequest,
  ExportResponse,
  ImportResponse,
  ValidationResponse,
  OperationStats,
  DataType
} from '@/types/data-operations';

export class DataOperationsService {
  /**
   * Export global de toutes les données
   */
  static async exportGlobal(): Promise<ExportResponse> {
    try {
      const response = await apiClient.post('/data/export/global');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export global:', error);
      throw error;
    }
  }

  /**
   * Export sélectif par types de données
   */
  static async exportSelective(dataTypes: DataType[], format: 'json' | 'csv' = 'csv'): Promise<ExportResponse> {
    try {
      const response = await apiClient.post('/data/export/selective', {
        data_types: dataTypes,
        format
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export sélectif:', error);
      throw error;
    }
  }

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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('data_type', dataType);

      console.log('📤 FormData créé:', {
        hasFile: formData.has('file'),
        hasDataType: formData.has('data_type'),
        dataTypeValue: formData.get('data_type')
      });

      // Test d'abord avec la route de test
      console.log('🧪 Test avec route de test...');
      try {
        const testResponse = await apiClient.post('/data/test-upload', formData);
        console.log('✅ Test upload réussi:', testResponse.data);
      } catch (testError) {
        console.error('❌ Test upload échoué:', testError);
      }

      console.log('📤 Envoi vers /import/validate...');
      // Ne pas spécifier Content-Type avec FormData - axios le fait automatiquement
      const response = await apiClient.post('/data/import/validate', formData);

      console.log('✅ Réponse validation:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      throw error;
    }
  }

  /**
   * Import global de données
   */
  static async importGlobal(
    file: File,
    duplicateStrategy: 'ignore' | 'replace' | 'create_new' = 'ignore'
  ): Promise<ImportResponse> {
    try {
      console.log('🔍 DataOperationsService.importGlobal appelé avec:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        duplicateStrategy
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('duplicate_strategy', duplicateStrategy);

      console.log('📤 Envoi de la requête import global...');
      // Ne pas spécifier Content-Type avec FormData - axios le fait automatiquement
      const response = await apiClient.post('/data/import/global', formData);

      console.log('✅ Réponse import global:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'import global:', error);
      throw error;
    }
  }

  /**
   * Import sélectif par type de données
   */
  static async importSelective(
    file: File,
    dataType: DataType,
    duplicateStrategy: 'ignore' | 'replace' | 'create_new' = 'ignore'
  ): Promise<ImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data_type', dataType);
      formData.append('duplicate_strategy', duplicateStrategy);

      // Ne pas spécifier Content-Type avec FormData - axios le fait automatiquement
      const response = await apiClient.post('/data/import/selective', formData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import sélectif:', error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier d'export
   */
  static async downloadExport(operationId: string): Promise<void> {
    try {
      // Utiliser apiClient directement pour le téléchargement
      const response = await apiClient.get(`/data/download/${operationId}`, {
        responseType: 'blob'
      });

      // Extraire le nom du fichier depuis les headers ou utiliser un nom par défaut
      let fileName = `export_${operationId}.json`;

      try {
        const contentDisposition = response.headers?.['content-disposition'] ||
                                 response.headers?.contentDisposition ||
                                 response.headers?.get?.('content-disposition');

        if (contentDisposition && typeof contentDisposition === 'string') {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1];
          }
        }
      } catch (headerError) {
        console.warn('Impossible de lire le nom du fichier depuis les headers:', headerError);
      }

      // Créer le blob et déclencher le téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des opérations
   */
  static async getOperations(page: number = 1, limit: number = 20): Promise<{
    operations: DataOperation[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await apiClient.get('/data/operations', {
        params: {
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des opérations
   */
  static async getStats(): Promise<OperationStats> {
    try {
      const { operations } = await this.getOperations(1, 100);
      
      const exports = operations.filter(op => op.operation_type === 'export');
      const imports = operations.filter(op => op.operation_type === 'import');
      
      const totalSize = operations.reduce((sum, op) => sum + (op.file_size || 0), 0);
      
      const lastExport = exports.length > 0 ? exports[0].created_at : undefined;
      const lastImport = imports.length > 0 ? imports[0].created_at : undefined;

      return {
        total_operations: operations.length,
        exports_count: exports.length,
        imports_count: imports.length,
        total_size: totalSize,
        last_export: lastExport,
        last_import: lastImport
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Formater la taille de fichier
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formater la date
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
