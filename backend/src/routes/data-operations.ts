import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const router = Router();

// Middleware pour parser les données multipart/form-data
const parseMultipartData = (req: any, res: any, next: any) => {
  const contentType = req.headers['content-type'];

  if (!contentType || !contentType.includes('multipart/form-data')) {
    return next();
  }

  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Parse simple pour récupérer les données
      const boundary = contentType.split('boundary=')[1];
      if (boundary) {
        const parts = body.split(`--${boundary}`);

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="data_type"')) {
            const match = part.match(/\r\n\r\n(.+?)\r\n/);
            if (match) {
              req.body = req.body || {};
              req.body.data_type = match[1].trim();
            }
          }

          if (part.includes('Content-Disposition: form-data; name="file"')) {
            const filenameMatch = part.match(/filename="(.+?)"/);
            const contentMatch = part.match(/\r\n\r\n([\s\S]+?)\r\n--/);

            if (filenameMatch && contentMatch) {
              req.file = {
                originalname: filenameMatch[1],
                buffer: Buffer.from(contentMatch[1], 'binary'),
                size: contentMatch[1].length
              };
            }
          }
        }
      }
      next();
    } catch (error) {
      console.error('Erreur parsing multipart:', error);
      next();
    }
  });
};

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Log pour debug
console.log('🔧 Routes data-operations chargées et configurées');

// Route de test pour diagnostiquer les uploads
router.post('/test-upload', parseMultipartData, asyncHandler(async (req: Request, res: Response) => {
  console.log('🧪 Route test-upload appelée:', {
    hasFile: !!req.file,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    body: req.body,
    headers: req.headers['content-type']
  });

  res.json({
    success: true,
    hasFile: !!req.file,
    fileName: req.file?.originalname || 'Aucun fichier',
    message: 'Test upload réussi'
  });
}));

// ==================== EXPORT ====================

// Export global (toutes les données en JSON)
router.post('/export/global', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  
  console.log('🔍 Export global demandé pour user:', userId);

  try {
    // 1. Récupérer toutes les données utilisateur
    const [projects, sales, expenses, paymentPlans, expensePayments, checks] = await Promise.all([
      query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at', [userId]),
      query('SELECT * FROM sales WHERE user_id = $1 ORDER BY created_at', [userId]),
      query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at', [userId]),
      query('SELECT * FROM payment_plans WHERE user_id = $1 ORDER BY created_at', [userId]),
      query('SELECT * FROM expense_payments WHERE user_id = $1 ORDER BY created_at', [userId]),
      query('SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at', [userId])
    ]);

    // 2. Construire l'objet d'export
    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        user_id: userId,
        version: '1.0',
        total_records: projects.rows.length + sales.rows.length + expenses.rows.length + 
                      paymentPlans.rows.length + expensePayments.rows.length + checks.rows.length
      },
      data: {
        projects: projects.rows,
        sales: sales.rows,
        expenses: expenses.rows,
        payment_plans: paymentPlans.rows,
        expense_payments: expensePayments.rows,
        checks: checks.rows
      }
    };

    // 3. Générer le fichier
    const fileName = `export_global_${new Date().toISOString().split('T')[0]}_${uuidv4().substring(0, 8)}.json`;
    const filePath = path.join(os.tmpdir(), fileName);
    
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    const stats = await fs.stat(filePath);

    // 4. Enregistrer l'opération
    const operationResult = await query(
      `INSERT INTO data_operations (user_id, operation_type, data_type, file_name, file_size, records_count)
       VALUES ($1, 'export', 'global', $2, $3, $4) RETURNING id`,
      [userId, fileName, stats.size, exportData.export_info.total_records]
    );

    console.log('✅ Export global créé:', fileName, 'Taille:', stats.size, 'Enregistrements:', exportData.export_info.total_records);

    const response: ApiResponse = {
      success: true,
      data: {
        operation_id: operationResult.rows[0].id,
        download_url: `/api/data/download/${operationResult.rows[0].id}`,
        file_name: fileName,
        file_size: stats.size,
        records_count: exportData.export_info.total_records
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erreur export global:', error);
    throw createError('Erreur lors de l\'export global', 500);
  }
}));

// Export sélectif par type de données
router.post('/export/selective', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { data_types, format = 'csv' } = req.body;

  if (!data_types || !Array.isArray(data_types) || data_types.length === 0) {
    throw createError('Types de données requis', 400);
  }

  console.log('🔍 Export sélectif demandé:', data_types, 'Format:', format);

  try {
    const exportFiles: string[] = [];
    let totalRecords = 0;
    let totalSize = 0;

    // Mapping des types vers les tables
    const tableMapping: Record<string, string> = {
      projects: 'projects',
      sales: 'sales', 
      expenses: 'expenses',
      payments: 'expense_payments',
      checks: 'checks'
    };

    for (const dataType of data_types) {
      if (!tableMapping[dataType]) {
        console.warn('⚠️ Type de données non supporté:', dataType);
        continue;
      }

      const tableName = tableMapping[dataType];
      const result = await query(
        `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY created_at`,
        [userId]
      );

      if (result.rows.length > 0) {
        const fileName = `export_${dataType}_${new Date().toISOString().split('T')[0]}_${uuidv4().substring(0, 8)}.${format}`;
        const filePath = path.join(os.tmpdir(), fileName);

        if (format === 'json') {
          await fs.writeFile(filePath, JSON.stringify(result.rows, null, 2));
        } else {
          // Format CSV
          const csvContent = convertToCSV(result.rows);
          await fs.writeFile(filePath, csvContent);
        }

        const stats = await fs.stat(filePath);
        exportFiles.push(fileName);
        totalRecords += result.rows.length;
        totalSize += stats.size;

        // Enregistrer chaque opération
        await query(
          `INSERT INTO data_operations (user_id, operation_type, data_type, file_name, file_size, records_count)
           VALUES ($1, 'export', $2, $3, $4, $5)`,
          [userId, dataType, fileName, stats.size, result.rows.length]
        );
      }
    }

    console.log('✅ Export sélectif créé:', exportFiles.length, 'fichiers');

    const response: ApiResponse = {
      success: true,
      data: {
        files: exportFiles,
        total_records: totalRecords,
        total_size: totalSize
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erreur export sélectif:', error);
    throw createError('Erreur lors de l\'export sélectif', 500);
  }
}));

// Fonction utilitaire pour convertir en CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et virgules
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

// ==================== TÉLÉCHARGEMENT ====================

// Télécharger un fichier d'export
router.get('/download/:operationId', asyncHandler(async (req: Request, res: Response) => {
  const { operationId } = req.params;
  const userId = req.user!.userId;

  // Vérifier que l'opération appartient à l'utilisateur
  const operationResult = await query(
    'SELECT * FROM data_operations WHERE id = $1 AND user_id = $2 AND operation_type = \'export\'',
    [operationId, userId]
  );

  if (operationResult.rows.length === 0) {
    throw createError('Opération d\'export non trouvée', 404);
  }

  const operation = operationResult.rows[0];
  const filePath = path.join(os.tmpdir(), operation.file_name);

  try {
    await fs.access(filePath);
    res.download(filePath, operation.file_name);
  } catch (error) {
    console.error('❌ Fichier non trouvé:', filePath);
    throw createError('Fichier d\'export non trouvé', 404);
  }
}));

// ==================== HISTORIQUE ====================

// Obtenir l'historique des opérations
router.get('/operations', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const result = await query(
    `SELECT * FROM data_operations 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as total FROM data_operations WHERE user_id = $1',
    [userId]
  );

  const response: ApiResponse = {
    success: true,
    data: {
      operations: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: Number(page),
      limit: Number(limit)
    }
  };

  res.json(response);
}));

// ==================== IMPORT ====================

// Valider un fichier d'import
router.post('/import/validate', parseMultipartData, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { data_type } = req.body;

  console.log('🔍 Route /import/validate appelée:', {
    userId,
    data_type,
    hasFile: !!req.file,
    fileName: req.file?.originalname
  });

  if (!req.file) {
    console.error('❌ Aucun fichier reçu dans la requête');
    throw createError('Fichier requis', 400);
  }

  console.log('🔍 Validation import:', data_type, 'Fichier:', req.file.originalname);

  try {
    const fileContent = req.file.buffer.toString('utf-8');
    let data: any[];

    // Parser selon le format
    if (req.file.originalname.endsWith('.json')) {
      const parsed = JSON.parse(fileContent);
      data = data_type === 'global' ? parsed.data[data_type] || [] : parsed;
    } else {
      // CSV parsing basique
      data = parseCSV(fileContent);
    }

    // Validation basique
    const errors: string[] = [];
    const warnings: string[] = [];
    let duplicatesFound = 0;

    if (!Array.isArray(data)) {
      errors.push('Format de données invalide');
    } else {
      // Vérifier les doublons potentiels
      if (data_type === 'projects') {
        for (const item of data.slice(0, 100)) { // Limiter la vérification
          if (item.nom) {
            const existing = await query(
              'SELECT id FROM projects WHERE user_id = $1 AND nom = $2',
              [userId, item.nom]
            );
            if (existing.rows.length > 0) duplicatesFound++;
          }
        }
      }
    }

    // Pas besoin de nettoyer - fichier en mémoire

    const response: ApiResponse = {
      success: true,
      data: {
        valid: errors.length === 0,
        records_count: data.length,
        duplicates_found: duplicatesFound,
        errors,
        warnings,
        preview: data.slice(0, 5) // Aperçu des 5 premiers
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erreur validation:', error);
    // Pas besoin de nettoyer - fichier en mémoire
    throw createError('Erreur lors de la validation du fichier', 500);
  }
}));

// Import global
router.post('/import/global', parseMultipartData, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { duplicate_strategy = 'ignore' } = req.body;

  if (!req.file) {
    throw createError('Fichier requis', 400);
  }

  console.log('🔍 Import global:', req.file.originalname, 'Stratégie:', duplicate_strategy);

  try {
    const fileContent = req.file.buffer.toString('utf-8');
    const importData = JSON.parse(fileContent);

    if (!importData.data) {
      throw createError('Format de fichier invalide', 400);
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    // Ordre d'import pour respecter les contraintes de clés étrangères
    const importOrder = ['projects', 'sales', 'expenses', 'payment_plans', 'expense_payments', 'checks'];

    for (const dataType of importOrder) {
      if (importData.data[dataType] && Array.isArray(importData.data[dataType])) {
        const result = await importDataType(userId, dataType, importData.data[dataType], duplicate_strategy);
        totalImported += result.imported;
        totalSkipped += result.skipped;
        totalFailed += result.failed;
      }
    }

    // Enregistrer l'opération
    const fileSize = req.file.size;
    await query(
      `INSERT INTO data_operations (user_id, operation_type, data_type, file_name, file_size, records_count)
       VALUES ($1, 'import', 'global', $2, $3, $4)`,
      [userId, req.file.originalname, fileSize, totalImported]
    );

    // Pas besoin de nettoyer - fichier en mémoire

    console.log('✅ Import global terminé:', totalImported, 'importés');

    const response: ApiResponse = {
      success: true,
      data: {
        records_imported: totalImported,
        records_skipped: totalSkipped,
        records_failed: totalFailed
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erreur import global:', error);
    // Pas besoin de nettoyer - fichier en mémoire
    throw createError('Erreur lors de l\'import global', 500);
  }
}));

// Fonction utilitaire pour parser CSV
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

// Fonction utilitaire pour importer un type de données
async function importDataType(userId: string, dataType: string, data: any[], duplicateStrategy: string) {
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  const tableMapping: Record<string, string> = {
    projects: 'projects',
    sales: 'sales',
    expenses: 'expenses',
    payment_plans: 'payment_plans',
    expense_payments: 'expense_payments',
    checks: 'checks'
  };

  const tableName = tableMapping[dataType];
  if (!tableName) return { imported, skipped, failed };

  for (const item of data) {
    try {
      // Nettoyer l'item (supprimer id, ajouter user_id)
      const cleanItem = { ...item };
      delete cleanItem.id;
      cleanItem.user_id = userId;

      // Vérifier les doublons selon la stratégie
      if (duplicateStrategy === 'ignore') {
        // Vérifier si existe déjà (logique simple par nom)
        if (cleanItem.nom) {
          const existing = await query(
            `SELECT id FROM ${tableName} WHERE user_id = $1 AND nom = $2`,
            [userId, cleanItem.nom]
          );
          if (existing.rows.length > 0) {
            skipped++;
            continue;
          }
        }
      }

      // Construire la requête d'insertion
      const columns = Object.keys(cleanItem);
      const values = Object.values(cleanItem);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      await query(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      imported++;
    } catch (error) {
      console.error(`❌ Erreur import ${dataType}:`, error);
      failed++;
    }
  }

  return { imported, skipped, failed };
}

export default router;
