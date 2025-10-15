import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger'; // Import du logger Winston comme recommandé

const router = Router();

// Endpoint de test SANS authentification pour diagnostiquer
router.get('/test-export', async (req: Request, res: Response) => {
  try {
    console.log('🧪 [TEST EXPORT] Test de l\'endpoint d\'export');
    
    // Test de base de données
    const testQuery = await query('SELECT COUNT(*) as count FROM projects');
    console.log('📊 [TEST EXPORT] Test DB - Nombre de projets:', testQuery.rows[0]?.count);
    
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      db_connected: !!testQuery,
      projects_count: testQuery.rows[0]?.count || 0
    };
    
    console.log('✅ [TEST EXPORT] Données de test:', testData);
    return res.json(testData);
  } catch (error) {
    console.error('❌ [TEST EXPORT] Erreur:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint de debug pour l'export AVEC authentification
router.get('/debug-export', authenticateToken, async (req: Request, res: Response) => {
  try {
    logger.info('🔍 [DEBUG EXPORT] Début du debug export');
    const userId = (req as any).user?.userId;

    logger.info('🔍 [DEBUG EXPORT] User object:', (req as any).user);
    logger.info('🔍 [DEBUG EXPORT] UserId extracted:', userId);

    if (!userId) {
      logger.error('🔍 [DEBUG EXPORT] PROBLÈME: userId est undefined');
      return res.json({
        error: 'userId undefined',
        user: (req as any).user,
        headers: req.headers.authorization
      });
    }

    // Test simple d'une requête
    const testResult = await query('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [userId]);
    logger.info('🔍 [DEBUG EXPORT] Test query result:', testResult);

    return res.json({
      success: true,
      userId: userId,
      testQuery: testResult.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('🔍 [DEBUG EXPORT] Erreur:', error);
    return res.json({ error: (error as Error).message, stack: (error as Error).stack });
  }
});

router.use(authenticateToken);

// Export global
router.get('/export-all', async (req: Request, res: Response) => {
  try {
    console.log('🚀 [EXPORT] Début de l\'export global');
    const userId = (req as any).user?.userId;
    console.log('📤 [EXPORT] User ID:', userId);

    // VALIDATION UTILISATEUR
    if (!userId) {
      console.error('[EXPORT ERROR] userId undefined - utilisateur non authentifié');
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    console.log('📊 [EXPORT] Exécution des requêtes SQL...');
    let projects, sales, expenses, checks, payments;

    try {
      [projects, sales, expenses, checks, payments] = await Promise.all([
        query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        query('SELECT * FROM sales WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        query('SELECT * FROM checks WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
        query('SELECT * FROM expense_payments WHERE user_id = $1 ORDER BY created_at DESC', [userId])
      ]);
      console.log('✅ [EXPORT] Requêtes SQL exécutées avec succès');
    } catch (queryError) {
      console.error('❌ [EXPORT] Erreur dans les requêtes SQL:', queryError);
      logger.error('❌ ERREUR dans les requêtes SQL:', queryError);
      return res.status(500).json({ success: false, message: 'Erreur de base de données' });
    }

    // DIAGNOSTIC DÉTAILLÉ DES RÉSULTATS
    console.log('[EXPORT] Résultats requêtes bruts:', {
      projects: !!projects,
      sales: !!sales,
      expenses: !!expenses,
      checks: !!checks,
      payments: !!payments
    });

    console.log('[EXPORT] Nombre d\'enregistrements:', {
      projects: projects?.rows?.length || 0,
      sales: sales?.rows?.length || 0,
      expenses: expenses?.rows?.length || 0,
      checks: checks?.rows?.length || 0,
      payments: payments?.rows?.length || 0
    });

    // Construction des données d'export
    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        user_id: userId,
        total_records: (projects?.rows?.length || 0) + (sales?.rows?.length || 0) + (expenses?.rows?.length || 0) + (checks?.rows?.length || 0) + (payments?.rows?.length || 0)
      },
      projects: projects?.rows || [],
      sales: sales?.rows || [],
      expenses: expenses?.rows || [],
      checks: checks?.rows || [],
      payments: payments?.rows || []
    };

    console.log('📤 [EXPORT] Structure des données:', {
      hasExportInfo: !!exportData.export_info,
      projectsCount: exportData.projects.length,
      salesCount: exportData.sales.length,
      expensesCount: exportData.expenses.length,
      checksCount: exportData.checks.length,
      paymentsCount: exportData.payments.length,
      totalRecords: exportData.export_info.total_records
    });

    // VALIDATION CRITIQUE
    if (!exportData || typeof exportData !== 'object') {
      console.error('[EXPORT ERROR] exportData est invalide:', exportData);
      logger.error('[EXPORT ERROR] exportData est invalide:', exportData);
      return res.status(500).json({ success: false, message: 'Données d\'export invalides' });
    }

    // TEST DE SÉRIALISATION
    let jsonString;
    try {
      jsonString = JSON.stringify(exportData, null, 2);
      console.log('✅ [EXPORT] Sérialisation JSON réussie, taille:', jsonString.length);
      logger.info('[EXPORT] Sérialisation JSON réussie, taille:', jsonString.length);
    } catch (serializeError) {
      console.error('[EXPORT ERROR] Erreur sérialisation JSON:', serializeError);
      logger.error('[EXPORT ERROR] Erreur sérialisation JSON:', serializeError);
      return res.status(500).json({ success: false, message: 'Erreur sérialisation JSON' });
    }

    // Vérification finale du JSON
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
      console.error('[EXPORT ERROR] jsonString invalide:', jsonString);
      return res.status(500).json({ success: false, message: 'Erreur: JSON invalide généré' });
    }

    const fileName = `export-donnees-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    console.log('📤 [EXPORT] Envoi de la réponse, taille:', jsonString.length);
    logger.info('[EXPORT] Envoi de la réponse, taille:', jsonString.length);

    return res.send(jsonString);
  } catch (error) {
    console.error('❌ [EXPORT] Erreur export global:', error);
    logger.error('❌ [EXPORT] Erreur export global:', error);
    return res.status(500).json({
      success: false,
      message: `Erreur: ${(error as Error).message}`
    });
  }
});

// Export sélectif
router.get('/export/:dataType', async (req: Request, res: Response) => {
  try {
    console.log('🚀 [EXPORT SELECTIVE] Début de l\'export sélectif');
    const userId = (req as any).user?.userId;
    const { dataType } = req.params;
    console.log('📤 [EXPORT SELECTIVE] User ID:', userId, 'Data Type:', dataType);

    // VALIDATION UTILISATEUR
    if (!userId) {
      console.error('[EXPORT SELECTIVE ERROR] userId undefined');
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    const typeConfig: Record<string, { table: string; file: string }> = {
      projects: { table: 'projects', file: 'projets' },
      sales: { table: 'sales', file: 'ventes' },
      expenses: { table: 'expenses', file: 'depenses' },
      checks: { table: 'checks', file: 'cheques' },
      payments: { table: 'expense_payments', file: 'paiements' }
    };

    const config = typeConfig[dataType];
    if (!config) {
      console.error('[EXPORT SELECTIVE ERROR] Type non supporté:', dataType);
      return res.status(400).json({
        success: false,
        message: 'Type de données non supporté'
      });
    }

    console.log('📊 [EXPORT SELECTIVE] Exécution requête SQL pour:', config.table);
    const result = await query(
      `SELECT * FROM ${config.table} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`[EXPORT ${dataType}] Résultat:`, result?.rows?.length || 0, 'enregistrements');

    const exportData = {
      export_info: {
        date: new Date().toISOString(),
        user_id: userId,
        data_type: dataType,
        total_records: result?.rows?.length || 0
      },
      data: result?.rows || []
    };

    console.log(`[EXPORT ${dataType}] Structure des données:`, {
      hasExportInfo: !!exportData.export_info,
      dataCount: exportData.data.length,
      totalRecords: exportData.export_info.total_records
    });

    // VALIDATION CRITIQUE
    if (!exportData) {
      console.error(`[EXPORT ${dataType} ERROR] exportData est undefined`);
      return res.status(500).json({ success: false, message: 'Données d\'export undefined' });
    }

    // TEST DE SÉRIALISATION
    let jsonString;
    try {
      jsonString = JSON.stringify(exportData, null, 2);
      console.log(`✅ [EXPORT ${dataType}] Sérialisation JSON réussie, taille:`, jsonString.length);
    } catch (serializeError) {
      console.error(`[EXPORT ${dataType} ERROR] Erreur sérialisation JSON:`, serializeError);
      return res.status(500).json({ success: false, message: 'Erreur sérialisation JSON' });
    }

    // Vérification finale du JSON
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
      console.error(`[EXPORT ${dataType} ERROR] jsonString invalide:`, jsonString);
      return res.status(500).json({ success: false, message: 'Erreur: JSON invalide généré' });
    }

    const fileName = `export-${config.file}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    console.log(`📤 [EXPORT ${dataType}] Envoi de la réponse, taille:`, jsonString.length);
    return res.send(jsonString);
  } catch (error) {
    console.error('❌ [EXPORT SELECTIVE] Erreur export sélectif:', error);
    return res.status(500).json({
      success: false,
      message: `Erreur: ${(error as Error).message}`
    });
  }
});

// Import de données
router.post('/import', async (req: Request, res: Response) => {
  logger.info('🚀 DÉBUT du traitement de la requête d\'importation'); // Log de début comme recommandé

  try {
    const userId = (req as any).user?.userId;
    const { data, dataType, strategy = 'ignore' } = req.body;

    logger.info('📥 Paramètres reçus:', { userId, dataType, strategy, count: data?.length });
    console.log('📥 Import:', { userId, dataType, strategy, count: data?.length });

    // VALIDATION UTILISATEUR
    if (!userId) {
      logger.error('❌ ERREUR: userId undefined - utilisateur non authentifié');
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      logger.error('❌ ERREUR: Données invalides', { data: !!data, isArray: Array.isArray(data), length: data?.length });
      return res.status(400).json({
        success: false,
        message: 'Données invalides'
      });
    }

    logger.info('✅ Validation des données réussie', { dataType, recordCount: data.length });

    const typeConfig: Record<string, { table: string; required: string[] }> = {
      projects: { table: 'projects', required: ['name'] },
      sales: { table: 'sales', required: ['amount', 'project_id'] },
      expenses: { table: 'expenses', required: ['name', 'amount'] },
      checks: { table: 'checks', required: ['number', 'amount'] },
      payments: { table: 'expense_payments', required: ['expense_id', 'amount'] }
    };

    const config = typeConfig[dataType];
    if (!config) {
      logger.error('❌ ERREUR: Type de données non supporté', { dataType, supportedTypes: Object.keys(typeConfig) });
      return res.status(400).json({
        success: false,
        message: 'Type non supporté'
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    logger.info('🔄 Début du traitement des enregistrements', { table: config.table, totalRecords: data.length, strategy });

    for (const record of data) {
      try {
        // Vérifier champs requis
        const missing = config.required.filter(field => !record[field]);
        if (missing.length > 0) {
          errors.push(`Champs manquants: ${missing.join(', ')}`);
          skipped++;
          continue;
        }

        // Préparer données
        const recordData = {
          ...record,
          id: record.id || uuidv4(),
          user_id: userId,
          created_at: record.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Vérifier doublons
        const existing = await query(
          `SELECT id FROM ${config.table} WHERE id = $1 AND user_id = $2`,
          [recordData.id, userId]
        );

        if (existing.rows.length > 0) {
          if (strategy === 'ignore') {
            skipped++;
            continue;
          } else if (strategy === 'replace') {
            await query(
              `DELETE FROM ${config.table} WHERE id = $1 AND user_id = $2`,
              [recordData.id, userId]
            );
          } else if (strategy === 'create_new') {
            recordData.id = uuidv4();
          }
        }

        // Insérer
        const fields = Object.keys(recordData);
        const values = Object.values(recordData);
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
        
        await query(
          `INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        imported++;

      } catch (recordError) {
        logger.error('❌ Erreur sur un enregistrement:', recordError);
        console.error('❌ Erreur enregistrement:', recordError);
        errors.push(`Erreur: ${(recordError as Error).message}`);
        skipped++;
      }
    }

    logger.info('✅ Traitement terminé avec succès. Envoi de la réponse JSON.', {
      imported,
      skipped,
      total: data.length,
      errorCount: errors.length
    }); // Log avant la réponse comme recommandé

    return res.json({
      success: true,
      data: {
        imported,
        skipped,
        total: data.length,
        errors: errors.slice(0, 10)
      },
      message: `Import: ${imported} importés, ${skipped} ignorés`
    });

  } catch (error) {
    logger.error('❌ ERREUR CRITIQUE lors de l\'importation:', error); // Log d'erreur détaillé comme recommandé
    console.error('❌ Erreur import:', error);
    return res.status(500).json({
      success: false,
      message: `Erreur: ${(error as Error).message}`
    });
  }
});

export default router;
