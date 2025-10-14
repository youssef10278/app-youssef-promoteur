import { query } from '../config/database';
import { DataType, DuplicateStrategy, ImportResult } from '../types/dataOperations';
import { v4 as uuidv4 } from 'uuid';

export class DataImportService {
  static async importData(
    userId: string,
    dataType: DataType,
    data: any[],
    fileName: string,
    duplicateStrategy: DuplicateStrategy
  ): Promise<ImportResult> {
    console.log('🔄 Début de l\'import:', { userId, dataType, recordsCount: data.length, duplicateStrategy });

    const operationId = uuidv4();
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Créer l'opération dans la base
      console.log('📝 Création opération import:', {
        operationId,
        userId,
        dataType,
        dataTypeLength: dataType.length,
        fileName,
        recordsCount: data.length
      });

      await query(
        `INSERT INTO data_operations (id, user_id, operation_type, data_type, file_name, file_size, records_count, status)
         VALUES ($1, $2, 'import', $3, $4, $5, $6, 'pending')`,
        [operationId, userId, dataType, fileName, JSON.stringify(data).length, data.length]
      );

      // Import selon le type de données
      switch (dataType) {
        case 'projects':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importProjects(userId, data, duplicateStrategy));
          break;
        case 'sales':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importSales(userId, data, duplicateStrategy));
          break;
        case 'expenses':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importExpenses(userId, data, duplicateStrategy));
          break;
        case 'checks':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importChecks(userId, data, duplicateStrategy));
          break;
        case 'payments':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importPayments(userId, data, duplicateStrategy));
          break;
        case 'global':
          ({ recordsImported, recordsSkipped, recordsFailed } = await this.importGlobalData(userId, data, duplicateStrategy));
          break;
        default:
          throw new Error(`Type de données non supporté: ${dataType}`);
      }

      // Mettre à jour l'opération
      await query(
        `UPDATE data_operations SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [operationId]
      );

      console.log('✅ Import terminé:', { recordsImported, recordsSkipped, recordsFailed });

      return {
        success: true,
        operation_id: operationId,
        records_imported: recordsImported,
        records_skipped: recordsSkipped,
        records_failed: recordsFailed,
        errors
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);

      // Marquer l'opération comme échouée
      await query(
        `UPDATE data_operations SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
        [(error as Error).message, operationId]
      );

      return {
        success: false,
        operation_id: operationId,
        records_imported: recordsImported,
        records_skipped: recordsSkipped,
        records_failed: recordsFailed,
        errors: [(error as Error).message]
      };
    }
  }

  private static async importProjects(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const item of data) {
      try {
        const projectId = uuidv4();
        
        // Vérifier les doublons par nom
        const existing = await query(
          'SELECT id FROM projects WHERE user_id = $1 AND nom = $2',
          [userId, item.nom]
        );

        if (existing.rows.length > 0) {
          if (duplicateStrategy === 'ignore') {
            recordsSkipped++;
            continue;
          } else if (duplicateStrategy === 'replace') {
            await query(
              `UPDATE projects SET 
                description = $1, 
                statut = $2, 
                updated_at = NOW() 
               WHERE id = $3`,
              [item.description || '', item.statut || 'actif', existing.rows[0].id]
            );
            recordsImported++;
            continue;
          }
        }

        // Créer nouveau projet
        await query(
          `INSERT INTO projects (id, user_id, nom, description, statut, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [projectId, userId, item.nom, item.description || '', item.statut || 'actif']
        );
        recordsImported++;

      } catch (error) {
        console.error('Erreur import projet:', error);
        recordsFailed++;
      }
    }

    return { recordsImported, recordsSkipped, recordsFailed };
  }

  private static async importSales(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const item of data) {
      try {
        const saleId = uuidv4();
        
        // Créer nouvelle vente (pas de vérification de doublon pour les ventes)
        await query(
          `INSERT INTO sales (id, user_id, montant, date_vente, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [saleId, userId, parseFloat(item.montant), item.date_vente, item.description || '']
        );
        recordsImported++;

      } catch (error) {
        console.error('Erreur import vente:', error);
        recordsFailed++;
      }
    }

    return { recordsImported, recordsSkipped, recordsFailed };
  }

  private static async importExpenses(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const item of data) {
      try {
        const expenseId = uuidv4();
        
        // Vérifier les doublons par nom et montant
        const existing = await query(
          'SELECT id FROM expenses WHERE user_id = $1 AND nom = $2 AND montant_total = $3',
          [userId, item.nom, parseFloat(item.montant_total)]
        );

        if (existing.rows.length > 0) {
          if (duplicateStrategy === 'ignore') {
            recordsSkipped++;
            continue;
          } else if (duplicateStrategy === 'replace') {
            await query(
              `UPDATE expenses SET 
                description = $1, 
                statut = $2, 
                updated_at = NOW() 
               WHERE id = $3`,
              [item.description || '', item.statut || 'actif', existing.rows[0].id]
            );
            recordsImported++;
            continue;
          }
        }

        // Créer nouvelle dépense
        await query(
          `INSERT INTO expenses (id, user_id, nom, description, montant_total, statut, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [expenseId, userId, item.nom, item.description || '', parseFloat(item.montant_total), item.statut || 'actif']
        );
        recordsImported++;

      } catch (error) {
        console.error('Erreur import dépense:', error);
        recordsFailed++;
      }
    }

    return { recordsImported, recordsSkipped, recordsFailed };
  }

  private static async importChecks(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const item of data) {
      try {
        const checkId = uuidv4();
        
        // Vérifier les doublons par numéro de chèque
        const existing = await query(
          'SELECT id FROM checks WHERE user_id = $1 AND numero_cheque = $2',
          [userId, item.numero_cheque]
        );

        if (existing.rows.length > 0) {
          if (duplicateStrategy === 'ignore') {
            recordsSkipped++;
            continue;
          } else if (duplicateStrategy === 'replace') {
            await query(
              `UPDATE checks SET 
                montant = $1, 
                statut = $2, 
                updated_at = NOW() 
               WHERE id = $3`,
              [parseFloat(item.montant), item.statut || 'en_attente', existing.rows[0].id]
            );
            recordsImported++;
            continue;
          }
        }

        // Créer nouveau chèque
        await query(
          `INSERT INTO checks (id, user_id, numero_cheque, montant, statut, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [checkId, userId, item.numero_cheque, parseFloat(item.montant), item.statut || 'en_attente']
        );
        recordsImported++;

      } catch (error) {
        console.error('Erreur import chèque:', error);
        recordsFailed++;
      }
    }

    return { recordsImported, recordsSkipped, recordsFailed };
  }

  private static async importPayments(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    for (const item of data) {
      try {
        const paymentId = uuidv4();
        
        // Créer nouveau paiement (pas de vérification de doublon pour les paiements)
        await query(
          `INSERT INTO expense_payments (id, expense_id, user_id, montant_paye, date_paiement, mode_paiement, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [paymentId, item.expense_id, userId, parseFloat(item.montant_paye), item.date_paiement, item.mode_paiement || 'espece']
        );
        recordsImported++;

      } catch (error) {
        console.error('Erreur import paiement:', error);
        recordsFailed++;
      }
    }

    return { recordsImported, recordsSkipped, recordsFailed };
  }

  private static async importGlobalData(userId: string, data: any[], duplicateStrategy: DuplicateStrategy) {
    // Pour les données globales, essayer de détecter le type automatiquement
    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;

    // Analyser la structure pour détecter le type
    if (data.length > 0) {
      const sample = data[0];

      if (sample.nom && sample.description && !sample.montant_total) {
        // Probablement des projets
        const result = await this.importProjects(userId, data, duplicateStrategy);
        return result;
      } else if (sample.montant && sample.date_vente) {
        // Probablement des ventes
        const result = await this.importSales(userId, data, duplicateStrategy);
        return result;
      } else if (sample.nom && sample.montant_total) {
        // Probablement des dépenses
        const result = await this.importExpenses(userId, data, duplicateStrategy);
        return result;
      } else if (sample.numero_cheque) {
        // Probablement des chèques
        const result = await this.importChecks(userId, data, duplicateStrategy);
        return result;
      } else if (sample.montant_paye && sample.date_paiement) {
        // Probablement des paiements
        const result = await this.importPayments(userId, data, duplicateStrategy);
        return result;
      }
    }

    console.log('⚠️ Type de données global non reconnu');
    return { recordsImported, recordsSkipped, recordsFailed };
  }
}
