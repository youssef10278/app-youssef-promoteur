import { query } from '../config/database';
import { DataType, ExportFormat, ExportResult } from '../types/dataOperations';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class DataExportService {
  static async exportData(
    userId: string,
    dataTypes: DataType[],
    format: ExportFormat,
    includeMetadata: boolean = false
  ): Promise<ExportResult> {
    console.log('📤 Début de l\'export:', { userId, dataTypes, format, includeMetadata });

    const operationId = uuidv4();
    let recordsCount = 0;

    try {
      // Créer l'opération dans la base
      await query(
        `INSERT INTO data_operations (id, user_id, operation_type, data_type, status)
         VALUES ($1, $2, 'export', $3, 'pending')`,
        [operationId, userId, dataTypes.join(',')]
      );

      // Collecter les données
      const exportData: any = {};
      
      for (const dataType of dataTypes) {
        const data = await this.getDataByType(userId, dataType);
        exportData[dataType] = data;
        recordsCount += data.length;
      }

      // Ajouter les métadonnées si demandé
      if (includeMetadata) {
        exportData.metadata = {
          export_date: new Date().toISOString(),
          user_id: userId,
          data_types: dataTypes,
          format,
          records_count: recordsCount
        };
      }

      // Générer le fichier
      const fileName = `export_${operationId}.${format}`;
      const filePath = path.join(os.tmpdir(), fileName);
      let fileContent: string;
      let fileSize: number;

      if (format === 'json') {
        fileContent = JSON.stringify(exportData, null, 2);
      } else {
        fileContent = this.convertToCSV(exportData, dataTypes);
      }

      await fs.writeFile(filePath, fileContent, 'utf-8');
      fileSize = (await fs.stat(filePath)).size;

      // Mettre à jour l'opération
      await query(
        `UPDATE data_operations SET 
          file_name = $1, 
          file_size = $2, 
          records_count = $3, 
          status = 'completed', 
          updated_at = NOW() 
         WHERE id = $4`,
        [fileName, fileSize, recordsCount, operationId]
      );

      console.log('✅ Export terminé:', { recordsCount, fileSize, fileName });

      return {
        success: true,
        operation_id: operationId,
        download_url: `/api/data/download/${operationId}`,
        records_count: recordsCount,
        file_size: fileSize
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      
      // Marquer l'opération comme échouée
      await query(
        `UPDATE data_operations SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [error.message, operationId]
      );

      throw error;
    }
  }

  private static async getDataByType(userId: string, dataType: DataType): Promise<any[]> {
    switch (dataType) {
      case 'projects':
        return await this.getProjects(userId);
      case 'sales':
        return await this.getSales(userId);
      case 'expenses':
        return await this.getExpenses(userId);
      case 'checks':
        return await this.getChecks(userId);
      case 'payments':
        return await this.getPayments(userId);
      default:
        return [];
    }
  }

  private static async getProjects(userId: string): Promise<any[]> {
    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  private static async getSales(userId: string): Promise<any[]> {
    const result = await query(
      'SELECT * FROM sales WHERE user_id = $1 ORDER BY date_vente DESC',
      [userId]
    );
    return result.rows;
  }

  private static async getExpenses(userId: string): Promise<any[]> {
    const result = await query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  private static async getChecks(userId: string): Promise<any[]> {
    const result = await query(
      'SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  private static async getPayments(userId: string): Promise<any[]> {
    const result = await query(
      'SELECT * FROM expense_payments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  private static convertToCSV(data: any, dataTypes: DataType[]): string {
    let csvContent = '';

    for (const dataType of dataTypes) {
      const typeData = data[dataType];
      if (!typeData || typeData.length === 0) continue;

      // En-tête de section
      csvContent += `\n# ${dataType.toUpperCase()}\n`;
      
      // En-têtes de colonnes
      const headers = Object.keys(typeData[0]);
      csvContent += headers.join(',') + '\n';
      
      // Données
      for (const row of typeData) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        });
        csvContent += values.join(',') + '\n';
      }
      
      csvContent += '\n';
    }

    return csvContent;
  }

  static async getDownloadFile(operationId: string): Promise<{ filePath: string; fileName: string }> {
    const result = await query(
      'SELECT file_name FROM data_operations WHERE id = $1 AND status = $2',
      [operationId, 'completed']
    );

    if (result.rows.length === 0) {
      throw new Error('Fichier d\'export non trouvé');
    }

    const fileName = result.rows[0].file_name;
    const filePath = path.join(os.tmpdir(), fileName);

    // Vérifier que le fichier existe
    try {
      await fs.access(filePath);
      return { filePath, fileName };
    } catch {
      throw new Error('Fichier d\'export non disponible');
    }
  }
}
