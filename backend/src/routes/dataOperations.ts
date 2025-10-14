import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';
import { DataValidationService } from '../services/dataValidationService';
import { DataImportService } from '../services/dataImportService';
import { DataExportService } from '../services/dataExportService';
import { ImportRequest, ExportRequest } from '../types/dataOperations';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// ==========================================
// VALIDATION
// ==========================================

router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { file_content, file_name, data_type } = req.body;
  const userId = (req as any).user.userId;

  console.log('🔍 Validation demandée:', { 
    userId, 
    fileName: file_name, 
    dataType: data_type,
    contentLength: file_content?.length 
  });

  if (!file_content || !file_name || !data_type) {
    throw createError('Paramètres manquants: file_content, file_name, data_type requis', 400);
  }

  // Décoder le contenu base64
  let decodedContent: string;
  try {
    decodedContent = Buffer.from(file_content, 'base64').toString('utf-8');
  } catch (error) {
    throw createError('Contenu de fichier invalide (base64 attendu)', 400);
  }

  // Valider le contenu
  const validation = DataValidationService.validateFileContent(decodedContent, file_name, data_type);

  const response: ApiResponse = {
    success: validation.valid,
    data: validation,
    message: validation.valid ? 'Fichier valide' : 'Erreurs de validation détectées'
  };

  res.json(response);
}));

// ==========================================
// IMPORT
// ==========================================

router.post('/import', asyncHandler(async (req: Request, res: Response) => {
  const { file_content, file_name, data_type, duplicate_strategy = 'ignore' }: ImportRequest = req.body;
  const userId = (req as any).user.userId;

  console.log('📥 Import demandé:', { 
    userId, 
    fileName: file_name, 
    dataType: data_type,
    duplicateStrategy: duplicate_strategy 
  });

  if (!file_content || !file_name || !data_type) {
    throw createError('Paramètres manquants: file_content, file_name, data_type requis', 400);
  }

  // Décoder le contenu base64
  let decodedContent: string;
  try {
    decodedContent = Buffer.from(file_content, 'base64').toString('utf-8');
  } catch (error) {
    throw createError('Contenu de fichier invalide (base64 attendu)', 400);
  }

  // Valider d'abord le contenu
  const validation = DataValidationService.validateFileContent(decodedContent, file_name, data_type);
  
  if (!validation.valid) {
    throw createError(`Fichier invalide: ${validation.errors.join(', ')}`, 400);
  }

  // Parser les données selon le format
  let data: any[];
  if (file_name.toLowerCase().endsWith('.json')) {
    data = JSON.parse(decodedContent);
    if (!Array.isArray(data)) {
      // Si c'est un objet, chercher un tableau
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length === 1) {
        data = data[arrayKeys[0]];
      } else {
        throw createError('Le fichier JSON doit contenir un tableau de données', 400);
      }
    }
  } else {
    // Parser CSV
    const lines = decodedContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
  }

  // Effectuer l'import
  const result = await DataImportService.importData(userId, data_type, data, file_name, duplicate_strategy);

  const response: ApiResponse = {
    success: result.success,
    data: result,
    message: result.success 
      ? `Import réussi: ${result.records_imported} enregistrements importés`
      : `Échec de l'import: ${result.errors.join(', ')}`
  };

  res.json(response);
}));

// ==========================================
// EXPORT
// ==========================================

router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  const { data_types, format = 'json', include_metadata = false }: ExportRequest = req.body;
  const userId = (req as any).user.userId;

  console.log('📤 Export demandé:', { 
    userId, 
    dataTypes: data_types, 
    format, 
    includeMetadata: include_metadata 
  });

  if (!data_types || !Array.isArray(data_types) || data_types.length === 0) {
    throw createError('Paramètre data_types requis (tableau non vide)', 400);
  }

  // Effectuer l'export
  const result = await DataExportService.exportData(userId, data_types, format, include_metadata);

  const response: ApiResponse = {
    success: result.success,
    data: result,
    message: `Export réussi: ${result.records_count} enregistrements exportés`
  };

  res.json(response);
}));

// ==========================================
// TÉLÉCHARGEMENT
// ==========================================

router.get('/download/:operationId', asyncHandler(async (req: Request, res: Response) => {
  const { operationId } = req.params;
  const userId = (req as any).user.userId;

  console.log('⬇️ Téléchargement demandé:', { userId, operationId });

  // Vérifier que l'opération appartient à l'utilisateur
  const operationResult = await query(
    'SELECT * FROM data_operations WHERE id = $1 AND user_id = $2',
    [operationId, userId]
  );

  if (operationResult.rows.length === 0) {
    throw createError('Opération non trouvée', 404);
  }

  const operation = operationResult.rows[0];
  
  if (operation.status !== 'completed') {
    throw createError('Opération non terminée', 400);
  }

  // Récupérer le fichier
  const { filePath, fileName } = await DataExportService.getDownloadFile(operationId);

  // Envoyer le fichier
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Erreur téléchargement:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erreur lors du téléchargement' });
      }
    }
  });
}));

// ==========================================
// HISTORIQUE DES OPÉRATIONS
// ==========================================

router.get('/operations', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { page = 1, limit = 20 } = req.query;

  console.log('📋 Historique demandé:', { userId, page, limit });

  const offset = (Number(page) - 1) * Number(limit);

  const result = await query(
    `SELECT id, operation_type, data_type, file_name, file_size, records_count, 
            status, error_message, created_at, updated_at
     FROM data_operations 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, Number(limit), offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as total FROM data_operations WHERE user_id = $1',
    [userId]
  );

  const response: ApiResponse = {
    success: true,
    data: {
      operations: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult.rows[0].total),
        pages: Math.ceil(Number(countResult.rows[0].total) / Number(limit))
      }
    },
    message: 'Historique récupéré avec succès'
  };

  res.json(response);
}));

// ==========================================
// STATISTIQUES
// ==========================================

router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  console.log('📊 Statistiques demandées:', { userId });

  const stats = await query(`
    SELECT 
      operation_type,
      data_type,
      status,
      COUNT(*) as count,
      SUM(records_count) as total_records
    FROM data_operations 
    WHERE user_id = $1 
    GROUP BY operation_type, data_type, status
    ORDER BY operation_type, data_type
  `, [userId]);

  const response: ApiResponse = {
    success: true,
    data: { statistics: stats.rows },
    message: 'Statistiques récupérées avec succès'
  };

  res.json(response);
}));

export default router;
